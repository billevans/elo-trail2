import { afterEach, describe, expect, it } from "vitest";

import {
  buildCacheCapacitySnapshot,
  getConfiguredDatabaseAllowanceBytes,
} from "../cache-capacity";

const ORIGINAL_ALLOWANCE = process.env.OBSERVABILITY_DATABASE_ALLOWANCE_BYTES;

afterEach(() => {
  if (ORIGINAL_ALLOWANCE === undefined) {
    delete process.env.OBSERVABILITY_DATABASE_ALLOWANCE_BYTES;
  } else {
    process.env.OBSERVABILITY_DATABASE_ALLOWANCE_BYTES = ORIGINAL_ALLOWANCE;
  }
});

describe("buildCacheCapacitySnapshot", () => {
  it("calculates storage utilisation and averages", () => {
    const result = buildCacheCapacitySnapshot({
      databaseAllowanceBytes: 1_000,

      source: {
        cacheCount: 2,
        cachedGameCount: 10,
        declaredGameCount: 10,

        cacheTableBytes: 100,
        gameTableBytes: 400,

        oldestRefreshedAt: new Date("2026-07-01T00:00:00.000Z"),
        newestRefreshedAt: new Date("2026-07-18T00:00:00.000Z"),
      },
    });

    expect(result).toEqual({
      cacheCount: 2,
      cachedGameCount: 10,
      declaredGameCount: 10,

      cacheTableBytes: 100,
      gameTableBytes: 400,
      totalBytes: 500,

      databaseAllowanceBytes: 1_000,
      utilisationRate: 0.5,

      averageBytesPerCache: 250,
      averageBytesPerGame: 40,

      oldestRefreshedAt: "2026-07-01T00:00:00.000Z",
      newestRefreshedAt: "2026-07-18T00:00:00.000Z",
    });
  });

  it("returns null averages for an empty cache", () => {
    const result = buildCacheCapacitySnapshot({
      databaseAllowanceBytes: 1_000,

      source: {
        cacheCount: 0,
        cachedGameCount: 0,
        declaredGameCount: 0,

        cacheTableBytes: 0,
        gameTableBytes: 0,

        oldestRefreshedAt: null,
        newestRefreshedAt: null,
      },
    });

    expect(result.averageBytesPerCache).toBeNull();
    expect(result.averageBytesPerGame).toBeNull();
    expect(result.utilisationRate).toBe(0);
  });
});

describe("getConfiguredDatabaseAllowanceBytes", () => {
  it("reads a valid configured allowance", () => {
    process.env.OBSERVABILITY_DATABASE_ALLOWANCE_BYTES = "123456";

    expect(getConfiguredDatabaseAllowanceBytes()).toBe(123456);
  });

  it("uses the default for an invalid configured allowance", () => {
    process.env.OBSERVABILITY_DATABASE_ALLOWANCE_BYTES = "invalid";

    expect(getConfiguredDatabaseAllowanceBytes()).toBe(500 * 1024 * 1024);
  });

  it("uses the default for a non-positive allowance", () => {
    process.env.OBSERVABILITY_DATABASE_ALLOWANCE_BYTES = "0";

    expect(getConfiguredDatabaseAllowanceBytes()).toBe(500 * 1024 * 1024);
  });
});
