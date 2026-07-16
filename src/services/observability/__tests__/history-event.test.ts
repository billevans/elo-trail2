import { describe, expect, it } from "vitest";

import {
  getHistoryErrorCode,
  getHistoryOperationalEventName,
  parseMetricHeader,
} from "../history-event";

describe("history observability helpers", () => {
  it.each([
    ["database-fresh", "history.cache.fresh"],
    ["aoe4world-incremental-refresh", "history.refresh.incremental"],
    ["aoe4world-full-refresh", "history.refresh.full"],
    ["aoe4world-cache-miss", "history.refresh.miss"],
    ["database-stale-fallback", "history.stale.fallback"],
    ["database-stale-refresh-in-progress", "history.refresh.in_progress"],
  ] as const)("maps %s to %s", (source, eventName) => {
    expect(getHistoryOperationalEventName(200, source)).toBe(eventName);
  });

  it("classifies an unsuccessful response as an error", () => {
    expect(getHistoryOperationalEventName(502, null)).toBe("history.error");
  });

  it("returns safe error codes", () => {
    expect(getHistoryErrorCode(429)).toBe("RATE_LIMITED");

    expect(getHistoryErrorCode(500)).toBe("HISTORY_INTERNAL_ERROR");

    expect(getHistoryErrorCode(200)).toBeUndefined();
  });

  it("parses numeric response headers", () => {
    expect(parseMetricHeader("69")).toBe(69);

    expect(parseMetricHeader(null)).toBeUndefined();

    expect(parseMetricHeader("invalid")).toBeUndefined();
  });
});
