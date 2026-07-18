import { after, NextResponse } from "next/server";

import { deleteUnusedPlayerHistoryCaches } from "@/services/database";
import {
  getCacheCleanupEventName,
  recordOperationalEvent,
  startOperationTimer,
} from "@/services/observability";

function isAuthorised(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");

  return authorization === `Bearer ${cronSecret}`;
}

interface CleanupResponseBody {
  data?: {
    deletedCaches?: number;
  };

  error?: {
    code: string;
    message: string;
  };
}

async function handleCacheCleanup(request: Request) {
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
    const result = await deleteUnusedPlayerHistoryCaches();

    return NextResponse.json(
      {
        data: result,
      },
      {
        headers: {
          "Cache-Control": "no-store",

          "X-Elo-Trail-Deleted-Caches": String(result.deletedCaches),
        },
      },
    );
  } catch (error) {
    console.error("Player-history cache cleanup failed", error);

    return NextResponse.json(
      {
        error: {
          code: "HISTORY_CACHE_CLEANUP_FAILED",
          message: "Player-history cache cleanup could not be completed.",
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

  const response = await handleCacheCleanup(request);

  const durationMs = finishTiming();

  after(async () => {
    let body: CleanupResponseBody | null = null;

    try {
      body = (await response.clone().json()) as CleanupResponseBody;
    } catch {
      body = null;
    }

    const headerCount = Number(
      response.headers.get("X-Elo-Trail-Deleted-Caches"),
    );

    const deletedCaches = Number.isSafeInteger(headerCount)
      ? headerCount
      : typeof body?.data?.deletedCaches === "number"
        ? body.data.deletedCaches
        : 0;
    const errorCode =
      body?.error?.code ??
      (response.status === 401
        ? "UNAUTHORISED"
        : response.status >= 500
          ? "HISTORY_CACHE_CLEANUP_FAILED"
          : undefined);

    await recordOperationalEvent({
      eventName: getCacheCleanupEventName(response.status),

      route: "/api/cron/history-cache-cleanup",

      statusCode: response.status,

      durationMs,

      errorCode,

      metadata: {
        authorised: response.status !== 401,

        deletedCaches,
      },
    });
  });

  return response;
}
