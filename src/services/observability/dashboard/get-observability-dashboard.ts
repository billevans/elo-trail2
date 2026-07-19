import { prisma } from "@/services/database";

import { aggregateOperationalEvents } from "./aggregate-operational-events";
import { getCacheCapacitySnapshot } from "./cache-capacity";
import { getObservabilityWindowStart } from "./reporting-window";
import type {
  ObservabilityDashboard,
  ObservabilityWindow,
  OperationalEventRecord,
} from "./types";

interface GetObservabilityDashboardOptions {
  window?: ObservabilityWindow;
  now?: Date;
  cacheCapacity?: ObservabilityDashboard["cacheCapacity"];
}

export async function getObservabilityDashboard({
  window = "24h",
  now = new Date(),
  cacheCapacity: suppliedCacheCapacity,
}: GetObservabilityDashboardOptions = {}): Promise<ObservabilityDashboard> {
  const windowStartedAt = getObservabilityWindowStart(window, now);

  const [records, cacheCapacity] = await Promise.all([
    prisma.operationalEvent.findMany({
      where: {
        createdAt: {
          gte: windowStartedAt,
          lte: now,
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      select: {
        eventName: true,
        route: true,

        statusCode: true,
        durationMs: true,

        profileId: true,
        historyDays: true,

        cacheSource: true,
        upstreamGames: true,
        returnedGames: true,

        errorCode: true,
        metadata: true,

        createdAt: true,
      },
    }),

    suppliedCacheCapacity
      ? Promise.resolve(suppliedCacheCapacity)
      : getCacheCapacitySnapshot(),
  ]);

  const events: OperationalEventRecord[] = records.map((record) => ({
    ...record,
    metadata: record.metadata,
  }));

  const eventMetrics = aggregateOperationalEvents({
    events,
    window,
    windowStartedAt,
    generatedAt: now,
  });

  return {
    ...eventMetrics,
    cacheCapacity,
  };
}
