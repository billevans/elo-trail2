import { after, NextResponse } from "next/server";

import { getHomepageLeaderboard } from "@/features/leaderboard/services/get-homepage-leaderboard";
import type { HomepageLeaderboardApiResponse } from "@/features/leaderboard/types/homepage-leaderboard";
import {
  getLeaderboardReadEventName,
  recordOperationalEvent,
  startOperationTimer,
} from "@/services/observability";

export const runtime = "nodejs";

export const revalidate = 3600;

interface LeaderboardResponseBody {
  data?: {
    players?: unknown[];
  } | null;

  error?: {
    code: string;
    message: string;
  };
}

async function handleLeaderboardRead() {
  try {
    const data = await getHomepageLeaderboard();

    if (!data) {
      return NextResponse.json<HomepageLeaderboardApiResponse>(
        {
          data: null,
          error: {
            code: "SNAPSHOT_NOT_READY",
            message:
              "The daily leaderboard snapshot has not been generated yet.",
          },
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        },
      );
    }

    return NextResponse.json<HomepageLeaderboardApiResponse>(
      {
        data,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",

          "X-Elo-Trail-Snapshot-Generated": data.generatedAt,

          "X-Elo-Trail-Leaderboard-Players": String(data.players.length),
        },
      },
    );
  } catch (error) {
    console.error("Homepage leaderboard read failed", error);

    return NextResponse.json<HomepageLeaderboardApiResponse>(
      {
        data: null,
        error: {
          code: "SNAPSHOT_READ_FAILED",
          message: "The homepage leaderboard is temporarily unavailable.",
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

export async function GET() {
  const finishTiming = startOperationTimer();

  const response = await handleLeaderboardRead();

  const durationMs = finishTiming();

  after(async () => {
    let body: LeaderboardResponseBody | null = null;

    try {
      body = (await response.clone().json()) as LeaderboardResponseBody;
    } catch {
      body = null;
    }

    const headerCount = Number(
      response.headers.get("X-Elo-Trail-Leaderboard-Players"),
    );

    const playerCount = Number.isSafeInteger(headerCount)
      ? headerCount
      : Array.isArray(body?.data?.players)
        ? body.data.players.length
        : 0;

    await recordOperationalEvent({
      eventName: getLeaderboardReadEventName(response.status),

      route: "/api/homepage-leaderboard",

      statusCode: response.status,

      durationMs,

      errorCode: body?.error?.code,

      metadata: {
        playerCount,
        snapshotReady: response.status === 200,
      },
    });
  });

  return response;
}
