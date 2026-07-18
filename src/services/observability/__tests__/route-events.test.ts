import { describe, expect, it } from "vitest";

import {
  getArrayLength,
  getCacheCleanupEventName,
  getLeaderboardReadEventName,
  getLeaderboardRefreshEventName,
  getOperationalErrorCode,
  getSearchEventName,
} from "../route-events";

describe("route observability helpers", () => {
  it("classifies search outcomes", () => {
    expect(getSearchEventName(200)).toBe("search.success");

    expect(getSearchEventName(400)).toBe("search.error");

    expect(getSearchEventName(500)).toBe("search.error");
  });

  it("classifies leaderboard reads", () => {
    expect(getLeaderboardReadEventName(200)).toBe("leaderboard.read");

    expect(getLeaderboardReadEventName(503)).toBe("leaderboard.error");
  });

  it("classifies leaderboard refreshes", () => {
    expect(getLeaderboardRefreshEventName(200)).toBe("leaderboard.refresh");

    expect(getLeaderboardRefreshEventName(401)).toBe("leaderboard.error");
  });

  it("classifies cache cleanup", () => {
    expect(getCacheCleanupEventName(200)).toBe("cache.cleanup");

    expect(getCacheCleanupEventName(500)).toBe("cache.cleanup.error");
  });

  it("returns bounded array counts", () => {
    expect(getArrayLength([1, 2, 3])).toBe(3);

    expect(getArrayLength(null)).toBeUndefined();
  });

  it("uses explicit safe error codes", () => {
    expect(getOperationalErrorCode(400, "SEARCH_TOO_SHORT")).toBe(
      "SEARCH_TOO_SHORT",
    );

    expect(getOperationalErrorCode(500, null)).toBe("INTERNAL_ERROR");

    expect(getOperationalErrorCode(200, null)).toBeUndefined();
  });
});
