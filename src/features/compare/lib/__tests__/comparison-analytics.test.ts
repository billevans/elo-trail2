import { describe, expect, it } from "vitest";

import type { EloPoint, MatchSummary } from "@/types/history";

import { calculateComparisonAnalytics } from "../comparison-analytics";

function createPoint(overrides: Partial<EloPoint> = {}): EloPoint {
  return {
    gameId: 1,
    timestamp: "2026-07-01T10:00:00.000Z",
    rating: 1015,
    ratingChange: 15,
    ...overrides,
  };
}

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

describe("calculateComparisonAnalytics", () => {
  it("returns empty analytics without history", () => {
    expect(calculateComparisonAnalytics([], [])).toEqual({
      startingElo: null,
      currentElo: null,
      eloChange: 0,
      peakElo: null,
      lowestElo: null,
      games: 0,
      wins: 0,
      losses: 0,
      winRate: null,
      averageEloMovement: null,
      largestGain: null,
      largestLoss: null,
    });
  });

  it("derives the starting ELO from the first history point", () => {
    const result = calculateComparisonAnalytics(
      [
        createPoint({
          rating: 1015,
          ratingChange: 15,
        }),
      ],
      [createMatch()],
    );

    expect(result.startingElo).toBe(1000);

    expect(result.currentElo).toBe(1015);

    expect(result.eloChange).toBe(15);
  });

  it("uses the authoritative profile ELO for the current rating", () => {
    const result = calculateComparisonAnalytics(
      [
        createPoint({
          rating: 1015,
          ratingChange: 15,
        }),
      ],
      [createMatch()],
      1020,
    );

    expect(result.currentElo).toBe(1020);

    expect(result.eloChange).toBe(20);

    expect(result.peakElo).toBe(1020);
  });

  it("calculates peak and lowest ELO across the period", () => {
    const points = [
      createPoint({
        gameId: 1,
        rating: 1015,
        ratingChange: 15,
      }),

      createPoint({
        gameId: 2,
        timestamp: "2026-07-02T10:00:00.000Z",
        rating: 990,
        ratingChange: -25,
      }),

      createPoint({
        gameId: 3,
        timestamp: "2026-07-03T10:00:00.000Z",
        rating: 1030,
        ratingChange: 40,
      }),
    ];

    const result = calculateComparisonAnalytics(points, []);

    expect(result.startingElo).toBe(1000);

    expect(result.peakElo).toBe(1030);

    expect(result.lowestElo).toBe(990);
  });

  it("calculates games, results and win rate", () => {
    const matches = [
      createMatch({
        gameId: 1,
        result: "win",
      }),

      createMatch({
        gameId: 2,
        result: "loss",
        ratingChange: -12,
      }),

      createMatch({
        gameId: 3,
        result: "win",
        ratingChange: 10,
      }),

      createMatch({
        gameId: 4,
        result: "unknown",
        ratingChange: 0,
      }),
    ];

    const result = calculateComparisonAnalytics([], matches);

    expect(result.games).toBe(4);
    expect(result.wins).toBe(2);
    expect(result.losses).toBe(1);

    expect(result.winRate).toBeCloseTo(66.666, 2);
  });

  it("calculates average movement and largest changes", () => {
    const matches = [
      createMatch({
        gameId: 1,
        ratingChange: 15,
      }),

      createMatch({
        gameId: 2,
        ratingChange: -20,
        result: "loss",
      }),

      createMatch({
        gameId: 3,
        ratingChange: 5,
      }),
    ];

    const result = calculateComparisonAnalytics([], matches);

    expect(result.averageEloMovement).toBeCloseTo(13.333, 2);

    expect(result.largestGain).toBe(15);

    expect(result.largestLoss).toBe(-20);
  });

  it("returns null for gain or loss when none exists", () => {
    const onlyWins = calculateComparisonAnalytics(
      [],
      [
        createMatch({
          ratingChange: 12,
        }),
      ],
    );

    expect(onlyWins.largestGain).toBe(12);

    expect(onlyWins.largestLoss).toBeNull();

    const onlyLosses = calculateComparisonAnalytics(
      [],
      [
        createMatch({
          result: "loss",
          ratingChange: -10,
        }),
      ],
    );

    expect(onlyLosses.largestGain).toBeNull();

    expect(onlyLosses.largestLoss).toBe(-10);
  });
});
