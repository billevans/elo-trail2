export const OBSERVABILITY_WINDOWS = ["24h", "7d", "30d"] as const;

export type ObservabilityWindow = (typeof OBSERVABILITY_WINDOWS)[number];

export interface OperationalEventRecord {
  eventName: string;
  route: string | null;

  statusCode: number | null;
  durationMs: number | null;

  profileId: number | null;
  historyDays: number | null;

  cacheSource: string | null;
  upstreamGames: number | null;
  returnedGames: number | null;

  errorCode: string | null;
  metadata: unknown;

  createdAt: Date;
}

export interface ObservabilityOverview {
  totalEvents: number;
  successfulEvents: number;
  errorEvents: number;
  errorRate: number;

  averageDurationMs: number;
  maximumDurationMs: number;
}

export interface ApiEfficiencySummary {
  upstreamGames: number;
  returnedGames: number;

  upstreamPerReturnedGame: number | null;
  returnedPerUpstreamGame: number | null;
}

export interface HistoryMetricsSummary {
  requests: number;

  freshCacheHits: number;
  incrementalRefreshes: number;
  fullRefreshes: number;
  cacheMisses: number;

  staleFallbacks: number;
  refreshesInProgress: number;
  errors: number;

  cacheHitRate: number;
}

export interface SearchMetricsSummary {
  successfulSearches: number;
  failedSearches: number;
  totalResultsReturned: number;
  averageResultsPerSuccessfulSearch: number;
}

export interface LeaderboardMetricsSummary {
  reads: number;
  refreshes: number;
  errors: number;
  latestPlayerCount: number | null;
}

export interface CleanupMetricsSummary {
  successfulRuns: number;
  failedRuns: number;
  deletedCaches: number;
}

export interface RouteMetricsSummary {
  route: string;

  requests: number;
  errors: number;
  errorRate: number;

  averageDurationMs: number;
  maximumDurationMs: number;
}

export interface RecentOperationalError {
  eventName: string;
  route: string | null;
  statusCode: number | null;
  errorCode: string | null;
  durationMs: number | null;
  createdAt: string;
}

export interface ObservabilityDashboard {
  window: ObservabilityWindow;
  windowStartedAt: string;
  generatedAt: string;

  overview: ObservabilityOverview;
  apiEfficiency: ApiEfficiencySummary;
  history: HistoryMetricsSummary;
  search: SearchMetricsSummary;
  leaderboard: LeaderboardMetricsSummary;
  cleanup: CleanupMetricsSummary;

  routes: RouteMetricsSummary[];
  recentErrors: RecentOperationalError[];
}
