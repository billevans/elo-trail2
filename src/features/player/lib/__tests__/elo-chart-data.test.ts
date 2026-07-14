import { describe, expect, it } from "vitest";

import type { EloPoint } from "@/types/history";

import {
  calculateChartDomain,
  calculateEloChartSummary,
} from "../elo-chart-data";

const points: EloPoint[] = [
  {
    gameId: 1,
    timestamp: "2026-01-01T00:00:00Z",
    rating: 1015,
    ratingChange: 15,
  },
  {
    gameId: 2,
    timestamp: "2026-01-02T00:00:00Z",
    rating: 990,
    ratingChange: -25,
  },
  {
    gameId: 3,
    timestamp: "2026-01-03T00:00:00Z",
    rating: 1040,
    ratingChange: 50,
  },
];

describe("calculateEloChartSummary", () => {
  it("returns the starting, current, peak and lowest ratings", () => {
    const result = calculateEloChartSummary(points);

    expect(result.startingElo).toBe(1000);

    expect(result.currentElo).toBe(1040);

    expect(result.peakPoint?.rating).toBe(1040);

    expect(result.lowestPoint?.rating).toBe(990);
  });

  it("calculates the average including the starting rating", () => {
    const result = calculateEloChartSummary(points);

    expect(result.averageElo).toBeCloseTo(1011.25, 2);
  });

  it("returns empty values for an empty timeline", () => {
    expect(calculateEloChartSummary([])).toEqual({
      startingElo: null,
      currentElo: null,
      averageElo: null,
      peakPoint: null,
      lowestPoint: null,
    });
  });
});

describe("calculateChartDomain", () => {
  it("includes both before and after ratings", () => {
    const [minimum, maximum] = calculateChartDomain(points);

    expect(minimum).toBeLessThan(990);

    expect(maximum).toBeGreaterThan(1040);
  });

  it("returns a safe default for no points", () => {
    expect(calculateChartDomain([])).toEqual([0, 100]);
  });
});
