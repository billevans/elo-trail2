import { aoe4Request } from "./client";

import type { Aoe4WorldPlayer } from "./types";

interface PlayerSearchResponse {
  players: Aoe4WorldPlayer[];
}

export async function searchPlayers(query: string): Promise<Aoe4WorldPlayer[]> {
  if (!query.trim()) {
    return [];
  }

  const response = await aoe4Request<PlayerSearchResponse>(
    `/players/search?query=${encodeURIComponent(query)}`,
  );

  return response.players ?? [];
}
