import { describe, expect, it } from "vitest";

import type { EloPoint, MatchSummary } from "@/types/history";

import { calculatePlayerAnalytics } from "../player-analytics";

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
    rating: 995,
    ratingChange: -20,
  },
];

const matches: MatchSummary[] = [
  {
    gameId: 1,
    startedAt: "2026-01-01T00:00:00Z",
    result: "win",
    ratingBefore: 1000,
    ratingAfter: 1015,
    ratingChange: 15,
  },
  {
    gameId: 2,
    startedAt: "2026-01-02T00:00:00Z",
    result: "loss",
    ratingBefore: 1015,
    ratingAfter: 995,
    ratingChange: -20,
  },
];

describe("calculatePlayerAnalytics", () => {
  it("returns the complete analytics model", () => {
    const analytics = calculatePlayerAnalytics({
      points,
      matches,
      career: {
        currentElo: 995,
        games: 100,
        wins: 55,
        losses: 45,
        winRate: 55,
      },
    });

    expect(analytics.rating.currentElo).toBe(995);

    expect(analytics.career.games).toBe(100);

    expect(analytics.matches.games).toBe(2);

    expect(analytics.streaks.current).toEqual({
      kind: "loss",
      count: 1,
    });

    expect(analytics.activity.firstGameAt).toBe("2026-01-01T00:00:00Z");

    expect(analytics.opponents.opponents).toBeDefined();
  });
});
