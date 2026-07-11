import { useQuery } from "@tanstack/react-query";

import type { ApiResponse } from "@/types/api";
import type { EloHistory } from "@/types/history";

export interface UsePlayerHistoryOptions {
  days?: number;
  enabled?: boolean;
}

const HISTORY_DATA_VERSION = "matchmaking-elo-paginated-v1";

function buildHistoryUrl(playerId: number, days: number) {
  const params = new URLSearchParams({
    days: String(days),
    dataVersion: HISTORY_DATA_VERSION,
  });

  return `/api/players/${playerId}/history?${params.toString()}`;
}

async function fetchPlayerHistory(
  playerId: number,
  days: number,
): Promise<EloHistory> {
  const response = await fetch(buildHistoryUrl(playerId, days), {
    headers: {
      Accept: "application/json",
    },
  });

  const payload = (await response.json()) as ApiResponse<EloHistory>;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ?? "Matchmaking ELO history could not be loaded.",
    );
  }

  if (!payload.data) {
    throw new Error("The matchmaking ELO response did not include data.");
  }

  return payload.data;
}

export function usePlayerHistory(
  playerId: number | null | undefined,
  options: UsePlayerHistoryOptions = {},
) {
  const { days = 180, enabled = true } = options;

  const hasValidPlayerId =
    typeof playerId === "number" && Number.isInteger(playerId) && playerId > 0;

  const validDays = Number.isInteger(days) && days > 0 && days <= 180;

  return useQuery({
    queryKey: ["player-history", HISTORY_DATA_VERSION, playerId, days],

    queryFn: () => fetchPlayerHistory(playerId as number, days),

    enabled: enabled && hasValidPlayerId && validDays,

    staleTime: 5 * 60 * 1000,

    gcTime: 30 * 60 * 1000,

    retry: 1,

    refetchOnWindowFocus: false,
  });
}
