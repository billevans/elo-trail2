export type HistoryLeaderboard =
  | "rm_solo"
  | "rm_team"
  | "rm_1v1"
  | "rm_2v2"
  | "rm_3v3"
  | "rm_4v4"
  | "qm_1v1"
  | "qm_2v2"
  | "qm_3v3"
  | "qm_4v4";

export type MatchResult = "win" | "loss" | "unknown";

export interface EloPoint {
  gameId: number | string;
  timestamp: string;
  rating: number;
  ratingChange: number;
  rank?: number;
}

export interface MatchSummary {
  gameId: number | string;
  startedAt: string;
  leaderboard?: string;
  map?: string;
  civilization?: string;
  result: MatchResult;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
  opponentProfileId?: number;
  opponentName?: string;
}

export interface EloStatistics {
  currentRating: number | null;
  peakRating: number | null;
  lowestRating: number | null;
  ratingChange: number;
  games: number;
  wins: number;
  losses: number;
  winRate: number | null;
}

export interface EloHistory {
  playerId: number;
  leaderboard?: string;
  points: EloPoint[];
  matches: MatchSummary[];
  statistics: EloStatistics;
}

export interface PlayerGamesOptions {
  leaderboard?: HistoryLeaderboard;

  /**
   * Only games at or after this date are requested.
   * This should be an ISO-8601 date string.
   */
  since?: string;

  /**
   * AoE4World currently returns no more than 50 games
   * per page for this endpoint.
   */
  pageSize?: number;

  /**
   * Safety ceiling to prevent unbounded upstream requests.
   */
  maxPages?: number;
}
