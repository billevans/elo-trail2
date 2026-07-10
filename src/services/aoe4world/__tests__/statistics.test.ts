import { describe, expect, it } from "vitest";

import type { MatchSummary } from "@/types/history";

import { calculateEloStatistics } from "../statistics";

function createMatch(overrides: Partial<MatchSummary> = {}): MatchSummary {
  return {
    gameId: 1,
    startedAt: "2026-07-01T10:00:00.000Z",
    result: "win",
    ratingBefore: 1000,
    ratingAfter: 1015,
    ratingChange: 15,
    ...overrides,
  };
}

describe("calculateEloStatistics", () => {
  it("returns empty statistics when there are no matches", () => {
    expect(calculateEloStatistics([])).toEqual({
      currentRating: null,
      peakRating: null,
      lowestRating: null,
      ratingChange: 0,
      games: 0,
      wins: 0,
      losses: 0,
      winRate: null,
    });
  });

  it("calculates current, peak and lowest ratings", () => {
    const matches = [
      createMatch({
        gameId: 1,
        ratingAfter: 1015,
      }),

      createMatch({
        gameId: 2,
        ratingBefore: 1015,
        ratingAfter: 995,
        ratingChange: -20,
        result: "loss",
      }),

      createMatch({
        gameId: 3,
        ratingBefore: 995,
        ratingAfter: 1020,
        ratingChange: 25,
      }),
    ];

    const result = calculateEloStatistics(matches);

    expect(result.currentRating).toBe(1020);

    expect(result.peakRating).toBe(1020);

    expect(result.lowestRating).toBe(995);

    expect(result.ratingChange).toBe(20);
  });

  it("calculates wins, losses and win rate", () => {
    const matches = [
      createMatch({
        gameId: 1,
        result: "win",
      }),

      createMatch({
        gameId: 2,
        result: "loss",
        ratingChange: -15,
      }),

      createMatch({
        gameId: 3,
        result: "win",
      }),

      createMatch({
        gameId: 4,
        result: "unknown",
        ratingChange: 0,
      }),
    ];

    const result = calculateEloStatistics(matches);

    expect(result.games).toBe(4);
    expect(result.wins).toBe(2);
    expect(result.losses).toBe(1);

    expect(result.winRate).toBeCloseTo(66.666, 2);
  });

  it("excludes unknown results from win-rate calculation", () => {
    const result = calculateEloStatistics([
      createMatch({
        result: "unknown",
      }),
    ]);

    expect(result.games).toBe(1);
    expect(result.wins).toBe(0);
    expect(result.losses).toBe(0);
    expect(result.winRate).toBeNull();
  });
});
