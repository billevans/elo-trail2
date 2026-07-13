import { describe, expect, it } from "vitest";

import type { EloPoint, MatchSummary } from "@/types/history";

import {
  calculateMatchAnalytics,
  calculateRatingAnalytics,
} from "../statistics";

function point(
  rating: number,
  ratingChange: number,
  timestamp: string,
): EloPoint {
  return {
    gameId: timestamp,
    rating,
    ratingChange,
    timestamp,
  };
}

function match(
  result: MatchSummary["result"],
  ratingChange: number,
  startedAt: string,
): MatchSummary {
  return {
    gameId: startedAt,
    startedAt,
    result,
    ratingBefore: 1000,
    ratingAfter: 1000 + ratingChange,
    ratingChange,
  };
}

describe("calculateRatingAnalytics", () => {
  it("calculates rating extremes and change", () => {
    const result = calculateRatingAnalytics([
      point(1015, 15, "2026-01-01T00:00:00Z"),
      point(990, -25, "2026-01-02T00:00:00Z"),
      point(1030, 40, "2026-01-03T00:00:00Z"),
    ]);

    expect(result.startingElo).toBe(1000);

    expect(result.currentElo).toBe(1030);

    expect(result.peak.rating).toBe(1030);

    expect(result.lowest.rating).toBe(990);

    expect(result.totalChange).toBe(30);
  });

  it("uses authoritative current ELO", () => {
    const result = calculateRatingAnalytics(
      [point(1015, 15, "2026-01-01T00:00:00Z")],
      1025,
    );

    expect(result.currentElo).toBe(1025);

    expect(result.totalChange).toBe(25);
  });
});

describe("calculateMatchAnalytics", () => {
  it("calculates results and rating movements", () => {
    const result = calculateMatchAnalytics([
      match("win", 15, "2026-01-01T00:00:00Z"),
      match("loss", -20, "2026-01-02T00:00:00Z"),
      match("win", 10, "2026-01-03T00:00:00Z"),
    ]);

    expect(result.games).toBe(3);
    expect(result.wins).toBe(2);
    expect(result.losses).toBe(1);

    expect(result.winRate).toBeCloseTo(66.666, 2);

    expect(result.averageGain).toBe(12.5);

    expect(result.averageLoss).toBe(-20);

    expect(result.biggestGain).toBe(15);

    expect(result.biggestLoss).toBe(-20);
  });
});
