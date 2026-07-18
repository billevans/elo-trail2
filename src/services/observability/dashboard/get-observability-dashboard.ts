import { prisma } from "@/services/database";

import { aggregateOperationalEvents } from "./aggregate-operational-events";
import { getObservabilityWindowStart } from "./reporting-window";
import type {
  ObservabilityDashboard,
  ObservabilityWindow,
  OperationalEventRecord,
} from "./types";

interface GetObservabilityDashboardOptions {
  window?: ObservabilityWindow;
  now?: Date;
}

export async function getObservabilityDashboard({
  window = "24h",
  now = new Date(),
}: GetObservabilityDashboardOptions = {}): Promise<ObservabilityDashboard> {
  const windowStartedAt = getObservabilityWindowStart(window, now);

  const records = await prisma.operationalEvent.findMany({
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
  });

  const events: OperationalEventRecord[] = records.map((record) => ({
    ...record,
    metadata: record.metadata,
  }));

  return aggregateOperationalEvents({
    events,
    window,
    windowStartedAt,
    generatedAt: now,
  });
}
