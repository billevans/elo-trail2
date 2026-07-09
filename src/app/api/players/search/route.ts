import { NextResponse } from "next/server";

import { searchPlayers } from "@/services/aoe4world/players";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({
      players: [],
    });
  }

  const players = await searchPlayers(query);

  return NextResponse.json({
    players,
  });
}
