import { NextResponse } from "next/server";

import { deleteUnusedPlayerHistoryCaches } from "@/services/database";

function isAuthorised(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");

  return authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
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
