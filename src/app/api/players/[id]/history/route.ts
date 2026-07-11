import { NextResponse } from "next/server";

import { getPlayerGames } from "@/services/aoe4world/history";
import { buildEloHistory } from "@/services/aoe4world/timeline";
import type { ApiFailure, ApiSuccess } from "@/types/api";
import type { EloHistory, HistoryLeaderboard } from "@/types/history";

const DEFAULT_HISTORY_DAYS = 180;
const MAX_HISTORY_DAYS = 180;
const MAX_HISTORY_PAGES = 100;

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
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",

          "X-Elo-Trail-Data-Version": "matchmaking-elo-paginated-v1",

          "X-Elo-Trail-History-Days": String(days),

          "X-Elo-Trail-Games-Fetched": String(games.length),
        },
      },
    );
  } catch (error) {
    console.error("Failed to load paginated matchmaking ELO history", {
      playerId,
      leaderboard,
      since,
      error,
    });

    return failure(
      502,
      "HISTORY_UPSTREAM_ERROR",
      "Matchmaking ELO history is temporarily unavailable.",
    );
  }
}
