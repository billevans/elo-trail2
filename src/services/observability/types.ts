export const OPERATIONAL_EVENT_NAMES = [
  "history.request",
  "history.cache.fresh",
  "history.refresh.incremental",
  "history.refresh.full",
  "history.refresh.miss",
  "history.stale.fallback",
  "history.refresh.in_progress",
  "history.error",

  "search.request",
  "search.success",
  "search.error",

  "leaderboard.read",
  "leaderboard.refresh",
  "leaderboard.error",

  "cache.cleanup",
  "cache.cleanup.error",
] as const;

export type OperationalEventName = (typeof OPERATIONAL_EVENT_NAMES)[number];

export interface OperationalEventInput {
  eventName: OperationalEventName;

  route?: string;

  statusCode?: number;
  durationMs?: number;

  profileId?: number;
  historyDays?: number;

  cacheSource?: string;
  upstreamGames?: number;
  returnedGames?: number;

  errorCode?: string;

  metadata?: Record<string, string | number | boolean | null>;
}
