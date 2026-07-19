import type {
  CleanupMetricsSummary,
  HistoryMetricsSummary,
  LeaderboardMetricsSummary,
  ObservabilityDashboard,
  ObservabilityWindow,
  OperationalEventRecord,
  RecentOperationalError,
  RouteMetricsSummary,
  SearchMetricsSummary,
} from "./types";

const RECENT_ERROR_LIMIT = 10;

function round(value: number, decimalPlaces = 2): number {
  const factor = 10 ** decimalPlaces;

  return Math.round(value * factor) / factor;
}

function divide(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return round(numerator / denominator);
}

function divideOrNull(numerator: number, denominator: number): number | null {
  if (denominator === 0) {
    return null;
  }

  return round(numerator / denominator);
}

function isErrorEvent(event: OperationalEventRecord): boolean {
  return (
    (event.statusCode !== null && event.statusCode >= 400) ||
    event.errorCode !== null ||
    event.eventName.endsWith(".error")
  );
}

function getMetadataNumber(metadata: unknown, key: string): number | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = (metadata as Record<string, unknown>)[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function countEvents(
  events: OperationalEventRecord[],
  eventName: string,
): number {
  return events.filter((event) => event.eventName === eventName).length;
}

function sumNullableNumbers(values: Array<number | null>): number {
  return values.reduce<number>((total, value) => {
    return total + (value ?? 0);
  }, 0);
}

function buildHistorySummary(
  events: OperationalEventRecord[],
): HistoryMetricsSummary {
  const requests = countEvents(events, "history.request");

  const freshCacheHits = countEvents(events, "history.cache.fresh");

  const incrementalRefreshes = countEvents(
    events,
    "history.refresh.incremental",
  );

  const fullRefreshes = countEvents(events, "history.refresh.full");

  const cacheMisses = countEvents(events, "history.refresh.miss");

  const staleFallbacks = countEvents(events, "history.stale.fallback");

  const refreshesInProgress = countEvents(
    events,
    "history.refresh.in_progress",
  );

  const errors = countEvents(events, "history.error");

  return {
    requests,
    freshCacheHits,
    incrementalRefreshes,
    fullRefreshes,
    cacheMisses,
    staleFallbacks,
    refreshesInProgress,
    errors,

    cacheHitRate: divide(freshCacheHits, requests),
  };
}

function buildSearchSummary(
  events: OperationalEventRecord[],
): SearchMetricsSummary {
  const successfulEvents = events.filter(
    (event) => event.eventName === "search.success",
  );

  const failedSearches = countEvents(events, "search.error");

  const totalResultsReturned = successfulEvents.reduce((total, event) => {
    return total + (getMetadataNumber(event.metadata, "resultCount") ?? 0);
  }, 0);

  return {
    successfulSearches: successfulEvents.length,
    failedSearches,
    totalResultsReturned,

    averageResultsPerSuccessfulSearch: divide(
      totalResultsReturned,
      successfulEvents.length,
    ),
  };
}

function buildLeaderboardSummary(
  events: OperationalEventRecord[],
): LeaderboardMetricsSummary {
  const successfulRefreshes = events
    .filter(
      (event) =>
        event.eventName === "leaderboard.refresh" && !isErrorEvent(event),
    )
    .sort(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
    );

  const latestPlayerCount =
    successfulRefreshes.length > 0
      ? getMetadataNumber(successfulRefreshes[0].metadata, "playerCount")
      : null;

  return {
    reads: countEvents(events, "leaderboard.read"),
    refreshes: successfulRefreshes.length,
    errors: countEvents(events, "leaderboard.error"),
    latestPlayerCount,
  };
}

function buildCleanupSummary(
  events: OperationalEventRecord[],
): CleanupMetricsSummary {
  const successfulCleanupEvents = events.filter(
    (event) => event.eventName === "cache.cleanup" && !isErrorEvent(event),
  );

  const deletedCaches = successfulCleanupEvents.reduce((total, event) => {
    return total + (getMetadataNumber(event.metadata, "deletedCaches") ?? 0);
  }, 0);

  return {
    successfulRuns: successfulCleanupEvents.length,
    failedRuns: countEvents(events, "cache.cleanup.error"),
    deletedCaches,
  };
}

function buildRouteSummaries(
  events: OperationalEventRecord[],
): RouteMetricsSummary[] {
  const routeGroups = new Map<string, OperationalEventRecord[]>();

  for (const event of events) {
    const route = event.route ?? "(unassigned)";
    const existing = routeGroups.get(route) ?? [];

    existing.push(event);
    routeGroups.set(route, existing);
  }

  return Array.from(routeGroups.entries())
    .map(([route, routeEvents]) => {
      const errorCount = routeEvents.filter(isErrorEvent).length;

      const durations = routeEvents
        .map((event) => event.durationMs)
        .filter((duration): duration is number => duration !== null);

      const totalDuration = durations.reduce(
        (total, duration) => total + duration,
        0,
      );

      return {
        route,
        requests: routeEvents.length,
        errors: errorCount,
        errorRate: divide(errorCount, routeEvents.length),

        averageDurationMs: divide(totalDuration, durations.length),

        maximumDurationMs: durations.length > 0 ? Math.max(...durations) : 0,
      };
    })
    .sort((left, right) => {
      if (right.requests !== left.requests) {
        return right.requests - left.requests;
      }

      return left.route.localeCompare(right.route);
    });
}

function buildRecentErrors(
  events: OperationalEventRecord[],
): RecentOperationalError[] {
  return events
    .filter(isErrorEvent)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, RECENT_ERROR_LIMIT)
    .map((event) => ({
      eventName: event.eventName,
      route: event.route,
      statusCode: event.statusCode,
      errorCode: event.errorCode,
      durationMs: event.durationMs,
      createdAt: event.createdAt.toISOString(),
    }));
}

interface AggregateOperationalEventsOptions {
  events: OperationalEventRecord[];
  window: ObservabilityWindow;
  windowStartedAt: Date;
  generatedAt?: Date;
}

export function aggregateOperationalEvents({
  events,
  window,
  windowStartedAt,
  generatedAt = new Date(),
}: AggregateOperationalEventsOptions): Omit<
  ObservabilityDashboard,
  "cacheCapacity"
> {
  const errorEvents = events.filter(isErrorEvent).length;

  const durations = events
    .map((event) => event.durationMs)
    .filter((duration): duration is number => duration !== null);

  const totalDuration = durations.reduce(
    (total, duration) => total + duration,
    0,
  );

  const upstreamGames = sumNullableNumbers(
    events.map((event) => event.upstreamGames),
  );

  const returnedGames = sumNullableNumbers(
    events.map((event) => event.returnedGames),
  );

  return {
    window,
    windowStartedAt: windowStartedAt.toISOString(),
    generatedAt: generatedAt.toISOString(),

    overview: {
      totalEvents: events.length,
      successfulEvents: events.length - errorEvents,
      errorEvents,
      errorRate: divide(errorEvents, events.length),

      averageDurationMs: divide(totalDuration, durations.length),

      maximumDurationMs: durations.length > 0 ? Math.max(...durations) : 0,
    },

    apiEfficiency: {
      upstreamGames,
      returnedGames,

      upstreamPerReturnedGame: divideOrNull(upstreamGames, returnedGames),

      returnedPerUpstreamGame: divideOrNull(returnedGames, upstreamGames),
    },

    history: buildHistorySummary(events),
    search: buildSearchSummary(events),
    leaderboard: buildLeaderboardSummary(events),
    cleanup: buildCleanupSummary(events),

    routes: buildRouteSummaries(events),
    recentErrors: buildRecentErrors(events),
  };
}
