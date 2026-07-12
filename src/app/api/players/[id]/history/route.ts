import { NextResponse } from "next/server";

import { Aoe4WorldRequestError } from "@/services/aoe4world/client";
import { getPlayerGames } from "@/services/aoe4world/history";
import { buildEloHistory } from "@/services/aoe4world/timeline";
import type { ApiFailure, ApiSuccess } from "@/types/api";
import type { EloHistory, HistoryLeaderboard } from "@/types/history";

const DEFAULT_HISTORY_DAYS = 180;
const MAX_HISTORY_DAYS = 180;

/*
 * Forty pages × 50 games gives a maximum of
 * 2,000 matchmaking-ELO game records.
 */
const MAX_HISTORY_PAGES = 40;

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
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
   * `since` value stable for the entire day, improving
   * cache reuse for repeated requests.
   */
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);

  return date.toISOString();
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

  try {
    const games = await getPlayerGames(playerId, {
      leaderboard,
      since,
      pageSize: 50,
      maxPages: MAX_HISTORY_PAGES,
    });

    const history = buildEloHistory(playerId, games, leaderboard);

    return NextResponse.json<ApiSuccess<EloHistory>>(
      {
        data: history,
      },
      {
        headers: {
          /*
           * Fresh for 15 minutes. A cached response may then be
           * served for up to another 15 minutes while it refreshes.
           * This limits normal worst-case visible staleness to
           * approximately 30 minutes without continuous polling.
           */
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=900",

          "X-Elo-Trail-Data-Version": "responsible-api-2000-v2",

          "X-Elo-Trail-History-Days": String(MAX_HISTORY_PAGES),

          "X-Elo-Trail-Games-Fetched": String(games.length),

          "X-Elo-Trail-Max-Pages": String(MAX_HISTORY_PAGES),

          "X-Elo-Trail-Cache-Seconds": "900",
        },
      },
    );
  } catch (error) {
    if (error instanceof Aoe4WorldRequestError && error.status === 429) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "AoE4World is temporarily rate limiting requests.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": error.retryAfter ?? "60",
          },
        },
      );
    }

    throw error;
  }
}
