import { describe, expect, it } from "vitest";

import type { HistoryCacheMetadata } from "../history-cache-types";
import { decideHistoryLoad } from "../history-cache-policy";

const metadata: HistoryCacheMetadata = {
  id: "cache-1",
  profileId: 11196570,
  leaderboard: "rm_1v1",
  historyDays: 180,
  refreshedAt: new Date("2026-07-15T00:00:00Z"),
  expiresAt: new Date("2026-07-15T00:30:00Z"),
  newestGameAt: new Date("2026-07-14T10:00:00Z"),
  oldestGameAt: new Date("2026-01-16T10:00:00Z"),
  gameCount: 100,
  dataVersion: "persistent-history-v1",
};

describe("decideHistoryLoad", () => {
  it("serves fresh cache", () => {
    expect(decideHistoryLoad("fresh", metadata)).toBe("serve-cache");
  });

  it("bootstraps a cache miss", () => {
    expect(decideHistoryLoad("miss", null)).toBe("bootstrap-cache");
  });

  it("incrementally refreshes stale cache with a newest game", () => {
    expect(decideHistoryLoad("stale", metadata)).toBe("incremental-refresh");
  });

  it("fully refreshes stale cache without a newest game", () => {
    expect(
      decideHistoryLoad("stale", {
        ...metadata,
        newestGameAt: null,
      }),
    ).toBe("full-refresh");
  });

  it("bootstraps when cache access is unavailable", () => {
    expect(decideHistoryLoad(null, null)).toBe("bootstrap-cache");
  });
});
