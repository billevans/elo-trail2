import { after, NextResponse } from "next/server";

import { Aoe4WorldRequestError } from "@/services/aoe4world/client";
import { searchPlayers } from "@/services/aoe4world/players";
import {
  getSearchEventName,
  recordOperationalEvent,
  startOperationTimer,
} from "@/services/observability";

const MIN_SEARCH_LENGTH = 3;
const MAX_SEARCH_LENGTH = 50;

interface SearchResponseBody {
  players?: unknown[];
  error?: {
    code: string;
    message: string;
  };
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  retryAfter?: string | null,
) {
  const headers = new Headers({
    "Cache-Control": "no-store",
  });

  if (retryAfter) {
    headers.set("Retry-After", retryAfter);
  }

  return NextResponse.json(
    {
      players: [],
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers,
    },
  );
}

async function handleSearchRequest(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = (searchParams.get("q") ?? "").trim();

  if (query.length === 0) {
    return NextResponse.json(
      {
        players: [],
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  }

  if (query.length < MIN_SEARCH_LENGTH) {
    return errorResponse(
      400,
      "SEARCH_TOO_SHORT",
      `Search terms must contain at least ${MIN_SEARCH_LENGTH} characters.`,
    );
  }

  if (query.length > MAX_SEARCH_LENGTH) {
    return errorResponse(
      400,
      "SEARCH_TOO_LONG",
      `Search terms cannot exceed ${MAX_SEARCH_LENGTH} characters.`,
    );
  }

  try {
    const players = await searchPlayers(query);

    return NextResponse.json(
      {
        players,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",

          "X-Elo-Trail-Cache": "player-search-v1",

          "X-Elo-Trail-Search-Results": String(players.length),
        },
      },
    );
  } catch (error) {
    if (error instanceof Aoe4WorldRequestError && error.status === 429) {
      return errorResponse(
        429,
        "RATE_LIMITED",
        "AoE4World is temporarily rate limiting requests.",
        error.retryAfter ?? "60",
      );
    }

    console.error("Player search failed", {
      queryLength: query.length,
      error,
    });

    return errorResponse(
      502,
      "SEARCH_UPSTREAM_ERROR",
      "Player search is temporarily unavailable.",
    );
  }
}

export async function GET(request: Request) {
  const finishTiming = startOperationTimer();

  const { searchParams } = new URL(request.url);

  /*
   * Store only query length—not the search text.
   */
  const queryLength = (searchParams.get("q") ?? "").trim().length;

  const response = await handleSearchRequest(request);

  const durationMs = finishTiming();

  after(async () => {
    let body: SearchResponseBody | null = null;

    try {
      body = (await response.clone().json()) as SearchResponseBody;
    } catch {
      body = null;
    }

    const returnedPlayers = Number(
      response.headers.get("X-Elo-Trail-Search-Results"),
    );
    const resultCount =
      Number.isSafeInteger(returnedPlayers) && returnedPlayers >= 0
        ? returnedPlayers
        : Array.isArray(body?.players)
          ? body.players.length
          : 0;

    const errorCode =
      body?.error?.code ??
      (response.status === 400
        ? queryLength < MIN_SEARCH_LENGTH
          ? "SEARCH_TOO_SHORT"
          : queryLength > MAX_SEARCH_LENGTH
            ? "SEARCH_TOO_LONG"
            : "INVALID_SEARCH"
        : response.status === 429
          ? "RATE_LIMITED"
          : response.status >= 500
            ? "SEARCH_UPSTREAM_ERROR"
            : undefined);

    await recordOperationalEvent({
      eventName: getSearchEventName(response.status),
      route: "/api/players/search",
      statusCode: response.status,
      durationMs,
      errorCode,
      metadata: {
        queryLength,
        resultCount,
      },
    });
  });

  return response;
}
