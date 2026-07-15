import { NextResponse } from "next/server";

import { Aoe4WorldRequestError } from "@/services/aoe4world/client";
import { getPlayerGames } from "@/services/aoe4world/history";
import { buildEloHistory } from "@/services/aoe4world/timeline";
import {
  createHistoryCacheKey,
  decideHistoryLoad,
  getIncrementalRefreshSince,
  mergeCachedPlayerGames,
  mergeHistoryGames,
  PLAYER_HISTORY_REFRESH_OVERLAP_MS,
  readCachedPlayerGames,
  writeCachedPlayerGames,
} from "@/services/database";
import type { ApiFailure, ApiSuccess } from "@/types/api";
import type { EloHistory, HistoryLeaderboard } from "@/types/history";

const DEFAULT_HISTORY_DAYS = 180;
const MAX_HISTORY_DAYS = 180;

/*
 * Forty pages × 50 games gives a maximum of
 * 2,000 matchmaking-ELO game records.
 */
const MAX_HISTORY_PAGES = 40;

const RESPONSE_DATA_VERSION = "persistent-history-cache-v2";

type HistoryResponseSource =
  | "database-fresh"
  | "aoe4world-cache-miss"
  | "aoe4world-full-refresh"
  | "aoe4world-incremental-refresh"
  | "aoe4world-cache-unavailable";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface SuccessResponseOptions {
  source: HistoryResponseSource;
  historyDays: number;
  games: number;
  upstreamGames?: number | null;
  cacheAgeSeconds?: number | null;
  cacheRefreshedAt?: Date | null;
}

function parsePositiveInteger(
  value: string | null,
  fallback: number,
): number | null {
  if (value === null) {
    return fallback;
  }

  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function failure(
  status: number,
  code: string,
  message: string,
): NextResponse<ApiFailure> {
  return NextResponse.json<ApiFailure>(
    {
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function getSinceDate(days: number): string {
  const date = new Date();

  /*
   * Normalise to UTC midnight before subtracting the
   * requested number of days. This keeps the generated
   * `since` value stable throughout the day.
   */
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);

  return date.toISOString();
}

function getCacheAgeSeconds(refreshedAt: Date): number {
  return (Date.now() - refreshedAt.getTime()) / 1000;
}

function createSuccessResponse(
  history: EloHistory,
  options: SuccessResponseOptions,
): NextResponse<ApiSuccess<EloHistory>> {
  const headers = new Headers({
    /*
     * Vercel may serve the response for 15 minutes and
     * revalidate it during the following 15 minutes.
     * The PostgreSQL cache remains the shared source used
     * whenever the route itself executes.
     */
    "Cache-Control": "public, s-maxage=900, stale-while-revalidate=900",

    "X-Elo-Trail-Data-Version": RESPONSE_DATA_VERSION,

    "X-Elo-Trail-History-Days": String(options.historyDays),

    "X-Elo-Trail-Games-Fetched": String(options.games),

    "X-Elo-Trail-Max-Pages": String(MAX_HISTORY_PAGES),

    "X-Elo-Trail-Cache-Seconds": "900",

    "X-Elo-Trail-History-Source": options.source,
  });

  if (options.upstreamGames !== undefined && options.upstreamGames !== null) {
    headers.set("X-Elo-Trail-Upstream-Games", String(options.upstreamGames));
  }

  if (
    options.cacheAgeSeconds !== undefined &&
    options.cacheAgeSeconds !== null
  ) {
    headers.set(
      "X-Elo-Trail-Database-Cache-Age",
      String(Math.max(0, Math.floor(options.cacheAgeSeconds))),
    );
  }

  if (options.cacheRefreshedAt) {
    headers.set(
      "X-Elo-Trail-Database-Cache-Refreshed",
      options.cacheRefreshedAt.toISOString(),
    );
  }

  return NextResponse.json<ApiSuccess<EloHistory>>(
    {
      data: history,
    },
    {
      headers,
    },
  );
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const playerId = parsePositiveInteger(id, 0);

  if (playerId === null || playerId === 0) {
    return failure(
      400,
      "INVALID_PLAYER_ID",
      "Player ID must be a positive integer.",
    );
  }

  const { searchParams } = new URL(request.url);

  const days = parsePositiveInteger(
    searchParams.get("days"),
    DEFAULT_HISTORY_DAYS,
  );

  if (days === null || days > MAX_HISTORY_DAYS) {
    return failure(
      400,
      "INVALID_HISTORY_RANGE",
      `History range must be between 1 and ${MAX_HISTORY_DAYS} days.`,
    );
  }

  /*
   * ELO Trail exclusively tracks ranked 1v1
   * matchmaking ELO—not seasonal ranked points.
   */
  const leaderboard: HistoryLeaderboard = "rm_1v1";

  const since = getSinceDate(days);

  const cacheKey = createHistoryCacheKey(playerId, leaderboard, days);

  let cachedResult: Awaited<ReturnType<typeof readCachedPlayerGames>> | null =
    null;

  let cacheReadFailed = false;

  /*
   * Cache access must fail open. A temporary database
   * problem must not stop ELO Trail from loading history
   * directly from AoE4World.
   */
  try {
    cachedResult = await readCachedPlayerGames(cacheKey);
  } catch (error) {
    cacheReadFailed = true;

    console.error("Persistent player history cache read failed", {
      playerId,
      leaderboard,
      days,
      error,
    });
  }

  const loadDecision = decideHistoryLoad(
    cachedResult?.state ?? null,
    cachedResult?.metadata ?? null,
  );

  if (loadDecision === "serve-cache" && cachedResult?.metadata) {
    const history = buildEloHistory(playerId, cachedResult.games, leaderboard);

    return createSuccessResponse(history, {
      source: "database-fresh",
      historyDays: days,
      games: cachedResult.games.length,
      cacheAgeSeconds: getCacheAgeSeconds(cachedResult.metadata.refreshedAt),
      cacheRefreshedAt: cachedResult.metadata.refreshedAt,
    });
  }

  try {
    const newestGameAt = cachedResult?.metadata?.newestGameAt;

    const canRefreshIncrementally =
      loadDecision === "incremental-refresh" &&
      newestGameAt !== null &&
      newestGameAt !== undefined;

    const upstreamSince = canRefreshIncrementally
      ? getIncrementalRefreshSince(
          newestGameAt,
          PLAYER_HISTORY_REFRESH_OVERLAP_MS,
        )
      : since;

    const upstreamGames = await getPlayerGames(playerId, {
      leaderboard,
      since: upstreamSince,
      pageSize: 50,
      maxPages: MAX_HISTORY_PAGES,
    });

    const combinedGames = canRefreshIncrementally
      ? mergeHistoryGames(cachedResult?.games ?? [], upstreamGames)
      : upstreamGames;

    const history = buildEloHistory(playerId, combinedGames, leaderboard);

    let cacheRefreshedAt: Date | null = null;

    /*
     * Database persistence remains an optimisation.
     * If the write fails, the valid history response is
     * still returned to the user.
     */
    try {
      const metadata = canRefreshIncrementally
        ? await mergeCachedPlayerGames(cacheKey, upstreamGames)
        : await writeCachedPlayerGames(cacheKey, upstreamGames);

      cacheRefreshedAt = metadata.refreshedAt;
    } catch (error) {
      console.error("Persistent player history cache write failed", {
        playerId,
        leaderboard,
        days,
        loadDecision,
        upstreamGames: upstreamGames.length,
        error,
      });
    }

    const source: HistoryResponseSource = cacheReadFailed
      ? "aoe4world-cache-unavailable"
      : canRefreshIncrementally
        ? "aoe4world-incremental-refresh"
        : loadDecision === "full-refresh"
          ? "aoe4world-full-refresh"
          : "aoe4world-cache-miss";

    return createSuccessResponse(history, {
      source,
      historyDays: days,
      games: combinedGames.length,
      upstreamGames: upstreamGames.length,
      cacheAgeSeconds: cacheRefreshedAt ? 0 : null,
      cacheRefreshedAt,
    });
  } catch (error) {
    if (error instanceof Aoe4WorldRequestError && error.status === 429) {
      return NextResponse.json<ApiFailure>(
        {
          error: {
            code: "RATE_LIMITED",
            message: "AoE4World is temporarily rate limiting requests.",
          },
        },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": error.retryAfter ?? "60",
          },
        },
      );
    }

    console.error("Failed to load matchmaking ELO history", {
      playerId,
      leaderboard,
      since,
      loadDecision,
      error,
    });

    return failure(
      502,
      "HISTORY_UPSTREAM_ERROR",
      "Matchmaking ELO history is temporarily unavailable.",
    );
  }
}
