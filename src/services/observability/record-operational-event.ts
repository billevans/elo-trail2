import type { Prisma } from "@prisma/client";

import { prisma } from "@/services/database";

import { normaliseOperationalEvent } from "./normalise-operational-event";
import type { OperationalEventInput } from "./types";

export async function recordOperationalEvent(
  input: OperationalEventInput,
): Promise<void> {
  try {
    const event = normaliseOperationalEvent(input);

    await prisma.operationalEvent.create({
      data: {
        eventName: event.eventName,

        route: event.route,

        statusCode: event.statusCode,

        durationMs: event.durationMs,

        profileId: event.profileId,

        historyDays: event.historyDays,

        cacheSource: event.cacheSource,

        upstreamGames: event.upstreamGames,

        returnedGames: event.returnedGames,

        errorCode: event.errorCode,

        metadata: event.metadata
          ? (event.metadata as Prisma.InputJsonValue)
          : undefined,
      },
    });
  } catch (error) {
    /*
     * Observability must always fail open. Metrics are
     * useful, but they must never break a player request,
     * cache refresh or scheduled task.
     */
    console.error("Operational event recording failed", {
      eventName: input.eventName,
      error,
    });
  }
}
