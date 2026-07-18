import { describe, expect, it } from "vitest";

import { calculateMetricTrend } from "../compare-observability-dashboards";

describe("calculateMetricTrend", () => {
  it("calculates an increase", () => {
    expect(calculateMetricTrend(120, 100)).toEqual({
      current: 120,
      previous: 100,
      changePercent: 20,
      direction: "up",
    });
  });

  it("calculates a decrease", () => {
    expect(calculateMetricTrend(80, 100)).toEqual({
      current: 80,
      previous: 100,
      changePercent: -20,
      direction: "down",
    });
  });

  it("reports a flat trend", () => {
    expect(calculateMetricTrend(100, 100)).toEqual({
      current: 100,
      previous: 100,
      changePercent: 0,
      direction: "flat",
    });
  });

  it("handles a zero previous value", () => {
    expect(calculateMetricTrend(10, 0)).toEqual({
      current: 10,
      previous: 0,
      changePercent: null,
      direction: "up",
    });
  });

  it("supports unavailable comparison data", () => {
    expect(calculateMetricTrend(10, null)).toEqual({
      current: 10,
      previous: null,
      changePercent: null,
      direction: "unavailable",
    });
  });
});
