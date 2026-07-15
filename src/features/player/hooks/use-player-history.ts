import { useQuery } from "@tanstack/react-query";

import type { ApiResponse } from "@/types/api";
import type { EloHistory } from "@/types/history";

export interface UsePlayerHistoryOptions {
  days?: number;
  enabled?: boolean;
}

const HISTORY_DATA_VERSION = "persistent-history-cache-v1";

const HISTORY_STALE_TIME_MS = 15 * 60 * 1000;

const HISTORY_GC_TIME_MS = 60 * 60 * 1000;

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

  const hasValidDays = Number.isInteger(days) && days > 0 && days <= 180;

  return useQuery({
    queryKey: ["player-history", HISTORY_DATA_VERSION, playerId, days],

    queryFn: () => fetchPlayerHistory(playerId as number, days),

    enabled: enabled && hasValidPlayerId && hasValidDays,

    /*
     * Reusing history for 15 minutes prevents repeat
     * pagination requests as users move around the UI.
     */
    staleTime: HISTORY_STALE_TIME_MS,

    gcTime: HISTORY_GC_TIME_MS,

    retry: 1,

    /*
     * History must not refresh just because the user
     * changes tabs or reconnects their browser.
     */
    refetchOnWindowFocus: false,

    refetchOnReconnect: false,

    refetchOnMount: false,

    /*
     * No polling. All refreshes remain user-driven or
     * governed by the route/cache expiry.
     */
    refetchInterval: false,
  });
}
