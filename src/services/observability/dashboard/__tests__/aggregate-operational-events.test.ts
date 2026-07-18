import { describe, expect, it } from "vitest";

import { aggregateOperationalEvents } from "../aggregate-operational-events";
import type { OperationalEventRecord } from "../types";

const windowStartedAt = new Date("2026-07-17T12:00:00.000Z");
const generatedAt = new Date("2026-07-18T12:00:00.000Z");

function createEvent(
  overrides: Partial<OperationalEventRecord>,
): OperationalEventRecord {
  return {
    eventName: "history.request",
    route: "/api/players/[id]/history",

    statusCode: 200,
    durationMs: 100,

    profileId: null,
    historyDays: null,

    cacheSource: null,
    upstreamGames: null,
    returnedGames: null,

    errorCode: null,
    metadata: null,

    createdAt: generatedAt,

    ...overrides,
  };
}

describe("aggregateOperationalEvents", () => {
  it("returns safe zero values for an empty dataset", () => {
    const result = aggregateOperationalEvents({
      events: [],
      window: "24h",
      windowStartedAt,
      generatedAt,
    });

    expect(result.overview).toEqual({
      totalEvents: 0,
      successfulEvents: 0,
      errorEvents: 0,
      errorRate: 0,
      averageDurationMs: 0,
      maximumDurationMs: 0,
    });

    expect(result.apiEfficiency).toEqual({
      upstreamGames: 0,
      returnedGames: 0,
      upstreamPerReturnedGame: null,
      returnedPerUpstreamGame: null,
    });

    expect(result.routes).toEqual([]);
    expect(result.recentErrors).toEqual([]);
  });

  it("aggregates overview and API efficiency metrics", () => {
    const result = aggregateOperationalEvents({
      window: "24h",
      windowStartedAt,
      generatedAt,

      events: [
        createEvent({
          durationMs: 100,
          upstreamGames: 3,
          returnedGames: 69,
        }),

        createEvent({
          eventName: "history.error",
          statusCode: 500,
          durationMs: 300,
          errorCode: "INTERNAL_ERROR",
        }),
      ],
    });

    expect(result.overview).toEqual({
      totalEvents: 2,
      successfulEvents: 1,
      errorEvents: 1,
      errorRate: 0.5,
      averageDurationMs: 200,
      maximumDurationMs: 300,
    });

    expect(result.apiEfficiency).toEqual({
      upstreamGames: 3,
      returnedGames: 69,
      upstreamPerReturnedGame: 0.04,
      returnedPerUpstreamGame: 23,
    });
  });

  it("aggregates history cache outcomes", () => {
    const result = aggregateOperationalEvents({
      window: "24h",
      windowStartedAt,
      generatedAt,

      events: [
        createEvent({
          eventName: "history.request",
        }),

        createEvent({
          eventName: "history.request",
        }),

        createEvent({
          eventName: "history.cache.fresh",
        }),

        createEvent({
          eventName: "history.refresh.incremental",
        }),

        createEvent({
          eventName: "history.stale.fallback",
        }),
      ],
    });

    expect(result.history).toEqual({
      requests: 2,
      freshCacheHits: 1,
      incrementalRefreshes: 1,
      fullRefreshes: 0,
      cacheMisses: 0,
      staleFallbacks: 1,
      refreshesInProgress: 0,
      errors: 0,
      cacheHitRate: 0.5,
    });
  });

  it("reads bounded search result metadata", () => {
    const result = aggregateOperationalEvents({
      window: "24h",
      windowStartedAt,
      generatedAt,

      events: [
        createEvent({
          eventName: "search.success",
          route: "/api/players/search",
          metadata: {
            queryLength: 6,
            resultCount: 50,
          },
        }),

        createEvent({
          eventName: "search.success",
          route: "/api/players/search",
          metadata: {
            queryLength: 8,
            resultCount: 10,
          },
        }),

        createEvent({
          eventName: "search.error",
          route: "/api/players/search",
          statusCode: 400,
          errorCode: "SEARCH_TOO_SHORT",
          metadata: {
            queryLength: 2,
          },
        }),
      ],
    });

    expect(result.search).toEqual({
      successfulSearches: 2,
      failedSearches: 1,
      totalResultsReturned: 60,
      averageResultsPerSuccessfulSearch: 30,
    });
  });

  it("ignores malformed metadata values", () => {
    const result = aggregateOperationalEvents({
      window: "24h",
      windowStartedAt,
      generatedAt,

      events: [
        createEvent({
          eventName: "search.success",
          metadata: {
            resultCount: "fifty",
          },
        }),

        createEvent({
          eventName: "cache.cleanup",
          metadata: ["invalid"],
        }),
      ],
    });

    expect(result.search.totalResultsReturned).toBe(0);
    expect(result.cleanup.deletedCaches).toBe(0);
  });

  it("summarises routes and recent errors", () => {
    const result = aggregateOperationalEvents({
      window: "24h",
      windowStartedAt,
      generatedAt,

      events: [
        createEvent({
          route: "/api/players/search",
          eventName: "search.success",
          durationMs: 100,
        }),

        createEvent({
          route: "/api/players/search",
          eventName: "search.error",
          statusCode: 400,
          durationMs: 20,
          errorCode: "SEARCH_TOO_SHORT",
          createdAt: new Date("2026-07-18T11:00:00.000Z"),
        }),

        createEvent({
          route: "/api/homepage-leaderboard",
          eventName: "leaderboard.read",
          durationMs: 300,
        }),
      ],
    });

    expect(result.routes[0]).toEqual({
      route: "/api/players/search",
      requests: 2,
      errors: 1,
      errorRate: 0.5,
      averageDurationMs: 60,
      maximumDurationMs: 100,
    });

    expect(result.recentErrors).toEqual([
      {
        eventName: "search.error",
        route: "/api/players/search",
        statusCode: 400,
        errorCode: "SEARCH_TOO_SHORT",
        durationMs: 20,
        createdAt: "2026-07-18T11:00:00.000Z",
      },
    ]);
  });

  it("reports the latest successful leaderboard player count", () => {
    const result = aggregateOperationalEvents({
      window: "24h",
      windowStartedAt,
      generatedAt,

      events: [
        createEvent({
          eventName: "leaderboard.refresh",
          route: "/api/cron/homepage-leaderboard",
          metadata: {
            playerCount: 6,
          },
          createdAt: new Date("2026-07-18T08:00:00.000Z"),
        }),

        createEvent({
          eventName: "leaderboard.refresh",
          route: "/api/cron/homepage-leaderboard",
          metadata: {
            playerCount: 8,
          },
          createdAt: new Date("2026-07-18T10:00:00.000Z"),
        }),
      ],
    });

    expect(result.leaderboard).toEqual({
      reads: 0,
      refreshes: 2,
      errors: 0,
      latestPlayerCount: 8,
    });
  });
});
