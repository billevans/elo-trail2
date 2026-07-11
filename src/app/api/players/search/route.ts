import { NextResponse } from "next/server";

import { Aoe4WorldRequestError } from "@/services/aoe4world/client";
import { searchPlayers } from "@/services/aoe4world/players";

const MIN_SEARCH_LENGTH = 3;
const MAX_SEARCH_LENGTH = 50;

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

export async function GET(request: Request) {
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
