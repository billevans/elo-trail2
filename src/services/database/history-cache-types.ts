import type { Aoe4WorldGame } from "@/services/aoe4world/history-types";
import type { EloHistory, HistoryLeaderboard } from "@/types/history";

export type HistoryCacheState = "miss" | "fresh" | "stale";

export interface HistoryCacheKey {
  profileId: number;
  leaderboard: HistoryLeaderboard;
  historyDays: number;
}

export interface HistoryCacheMetadata {
  id: string;
  profileId: number;
  leaderboard: string;
  historyDays: number;
  refreshedAt: Date;
  expiresAt: Date;
  newestGameAt: Date | null;
  oldestGameAt: Date | null;
  gameCount: number;
  dataVersion: string;
}

export interface CachedHistoryGames {
  state: HistoryCacheState;
  metadata: HistoryCacheMetadata | null;
  games: Aoe4WorldGame[];
}

export interface CachedEloHistory {
  state: HistoryCacheState;
  metadata: HistoryCacheMetadata | null;
  history: EloHistory | null;
}

export interface HistoryCacheBoundary {
  newestGameId: string | null;
  newestStartedAt: Date | null;
  cachedGameCount: number;
}
