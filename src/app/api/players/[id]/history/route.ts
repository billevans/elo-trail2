import { NextResponse } from "next/server";

import { getPlayerGames } from "@/services/aoe4world/history";
import { buildEloHistory } from "@/services/aoe4world/timeline";
import type { ApiFailure, ApiSuccess } from "@/types/api";
import type { EloHistory, HistoryLeaderboard } from "@/types/history";

const HISTORY_LEADERBOARDS = new Set<HistoryLeaderboard>([
  "rm_solo",
  "rm_team",
  "rm_1v1",
  "rm_2v2",
  "rm_3v3",
  "rm_4v4",
  "qm_1v1",
  "qm_2v2",
  "qm_3v3",
  "qm_4v4",
]);

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

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

function isHistoryLeaderboard(value: string): value is HistoryLeaderboard {
  return HISTORY_LEADERBOARDS.has(value as HistoryLeaderboard);
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

  const limit = parsePositiveInteger(searchParams.get("limit"), DEFAULT_LIMIT);

  const page = parsePositiveInteger(searchParams.get("page"), 1);

  const leaderboardParameter = searchParams.get("leaderboard");

  if (limit === null || limit > MAX_LIMIT) {
    return failure(
      400,
      "INVALID_LIMIT",
      `Limit must be between 1 and ${MAX_LIMIT}.`,
    );
  }

  if (page === null) {
    return failure(400, "INVALID_PAGE", "Page must be a positive integer.");
  }

  if (
    leaderboardParameter !== null &&
    !isHistoryLeaderboard(leaderboardParameter)
  ) {
    return failure(
      400,
      "INVALID_LEADERBOARD",
      "The requested leaderboard is not supported.",
    );
  }

  const leaderboard = leaderboardParameter ?? undefined;

  try {
    const games = await getPlayerGames(playerId, {
      limit,
      page,
      leaderboard,
    });

    const history = buildEloHistory(playerId, games, leaderboard);

    return NextResponse.json<ApiSuccess<EloHistory>>(
      {
        data: history,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load player history", {
      playerId,
      leaderboard,
      error,
    });

    return failure(
      502,
      "HISTORY_UPSTREAM_ERROR",
      "Player history is temporarily unavailable.",
    );
  }
}
