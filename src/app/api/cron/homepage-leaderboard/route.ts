import { after, NextResponse } from "next/server";

import { refreshHomepageLeaderboard } from "@/features/leaderboard/services/refresh-homepage-leaderboard";
import {
  getLeaderboardRefreshEventName,
  recordOperationalEvent,
  startOperationTimer,
} from "@/services/observability";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export const maxDuration = 300;

function isAuthorised(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

interface RefreshResponseBody {
  success?: boolean;
  generatedAt?: string;
  players?: number;

  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

async function handleLeaderboardRefresh(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORISED",
          message: "Valid cron authorisation is required.",
        },
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const snapshot = await refreshHomepageLeaderboard();

    return NextResponse.json(
      {
        success: true,
        generatedAt: snapshot.generatedAt,
        players: snapshot.players.length,
      },
      {
        headers: {
          "Cache-Control": "no-store",

          "X-Elo-Trail-Leaderboard-Players": String(snapshot.players.length),
        },
      },
    );
  } catch (error) {
    console.error("Homepage leaderboard refresh failed", error);

    const details =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : undefined;

    return NextResponse.json(
      {
        error: {
          code: "LEADERBOARD_REFRESH_FAILED",
          message: "The homepage leaderboard snapshot could not be refreshed.",

          ...(details
            ? {
                details,
              }
            : {}),
        },
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

export async function GET(request: Request) {
  const finishTiming = startOperationTimer();

  const response = await handleLeaderboardRefresh(request);

  const durationMs = finishTiming();

  after(async () => {
    let body: RefreshResponseBody | null = null;

    try {
      body = (await response.clone().json()) as RefreshResponseBody;
    } catch {
      body = null;
    }

    const headerPlayerCount = Number(
      response.headers.get("X-Elo-Trail-Leaderboard-Players"),
    );

    const playerCount =
      Number.isSafeInteger(headerPlayerCount) && headerPlayerCount >= 0
        ? headerPlayerCount
        : typeof body?.players === "number"
          ? body.players
          : 0;

    const errorCode =
      body?.error?.code ??
      (response.status === 401
        ? "UNAUTHORISED"
        : response.status >= 500
          ? "LEADERBOARD_REFRESH_FAILED"
          : undefined);

    await recordOperationalEvent({
      eventName: getLeaderboardRefreshEventName(response.status),
      route: "/api/cron/homepage-leaderboard",
      statusCode: response.status,
      durationMs,
      errorCode,
      metadata: {
        authorised: response.status !== 401,
        playerCount,
      },
    });
  });

  return response;
}
