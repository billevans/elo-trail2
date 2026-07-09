import { useQuery } from "@tanstack/react-query";

import type { Aoe4WorldPlayer } from "@/services/aoe4world/types";

async function fetchPlayers(query: string): Promise<Aoe4WorldPlayer[]> {
  const response = await fetch(
    `/api/players/search?q=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw new Error("Player search failed");
  }

  const data = await response.json();

  return data.players ?? [];
}

export function usePlayerSearch(query: string) {
  return useQuery({
    queryKey: ["players", query],

    queryFn: () => fetchPlayers(query),

    enabled: query.length > 2,
  });
}
