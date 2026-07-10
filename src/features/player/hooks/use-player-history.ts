import { useQuery } from "@tanstack/react-query";

import type { ApiResponse } from "@/types/api";
import type { EloHistory, HistoryLeaderboard } from "@/types/history";

export interface UsePlayerHistoryOptions {
  leaderboard?: HistoryLeaderboard;
  limit?: number;
  page?: number;
  enabled?: boolean;
}

function buildHistoryUrl(playerId: number, options: UsePlayerHistoryOptions) {
  const params = new URLSearchParams();

  if (options.leaderboard) {
    params.set("leaderboard", options.leaderboard);
  }

  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }

  if (options.page !== undefined) {
    params.set("page", String(options.page));
  }

  const query = params.toString();

  return `/api/players/${playerId}/history${query ? `?${query}` : ""}`;
}

async function fetchPlayerHistory(
  playerId: number,
  options: UsePlayerHistoryOptions,
): Promise<EloHistory> {
  const response = await fetch(buildHistoryUrl(playerId, options));

  const payload = (await response.json()) as ApiResponse<EloHistory>;

  if (!response.ok) {
    const message =
      payload.error?.message ?? "Player history could not be loaded.";

    throw new Error(message);
  }

  if (!payload.data) {
    throw new Error("Player history response did not include data.");
  }

  return payload.data;
}

export function usePlayerHistory(
  playerId: number | null | undefined,
  options: UsePlayerHistoryOptions = {},
) {
  const { enabled = true, leaderboard, limit = 200, page = 1 } = options;

  const hasValidPlayerId =
    typeof playerId === "number" && Number.isInteger(playerId) && playerId > 0;

  return useQuery({
    queryKey: ["player-history", playerId, leaderboard ?? "all", limit, page],

    queryFn: () =>
      fetchPlayerHistory(playerId as number, {
        leaderboard,
        limit,
        page,
      }),

    enabled: enabled && hasValidPlayerId,

    staleTime: 5 * 60 * 1000,

    gcTime: 30 * 60 * 1000,

    retry: 1,
  });
}
