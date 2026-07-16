import { describe, expect, it } from "vitest";

import {
  isOperationalEventName,
  normaliseOperationalEvent,
} from "../normalise-operational-event";

describe("normaliseOperationalEvent", () => {
  it("retains valid operational fields", () => {
    const result = normaliseOperationalEvent({
      eventName: "history.cache.fresh",
      route: "/api/players/[id]/history",
      statusCode: 200,
      durationMs: 125,
      profileId: 11196570,
      historyDays: 180,
      cacheSource: "database-fresh",
      upstreamGames: 0,
      returnedGames: 69,
    });

    expect(result).toEqual({
      eventName: "history.cache.fresh",
      route: "/api/players/[id]/history",
      statusCode: 200,
      durationMs: 125,
      profileId: 11196570,
      historyDays: 180,
      cacheSource: "database-fresh",
      upstreamGames: 0,
      returnedGames: 69,
      errorCode: undefined,
      metadata: undefined,
    });
  });

  it("removes invalid numeric values", () => {
    const result = normaliseOperationalEvent({
      eventName: "history.error",
      statusCode: 999,
      durationMs: -1,
      profileId: 0,
      historyDays: 500,
      upstreamGames: -1,
    });

    expect(result.statusCode).toBeUndefined();

    expect(result.durationMs).toBeUndefined();

    expect(result.profileId).toBeUndefined();

    expect(result.historyDays).toBeUndefined();

    expect(result.upstreamGames).toBeUndefined();
  });

  it("limits metadata size", () => {
    const metadata = Object.fromEntries(
      Array.from(
        {
          length: 30,
        },
        (_, index) => [`key-${index}`, `value-${index}`],
      ),
    );

    const result = normaliseOperationalEvent({
      eventName: "cache.cleanup",
      metadata,
    });

    expect(Object.keys(result.metadata ?? {})).toHaveLength(20);
  });

  it("recognises supported event names", () => {
    expect(isOperationalEventName("history.request")).toBe(true);

    expect(isOperationalEventName("unknown.event")).toBe(false);
  });
});
