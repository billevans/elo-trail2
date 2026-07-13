import { describe, expect, it } from "vitest";

import type { MatchSummary } from "@/types/history";

import { calculateActivity } from "../activity";

function match(gameId: number, startedAt: string): MatchSummary {
  return {
    gameId,
    startedAt,
    result: "win",
    ratingBefore: 1000,
    ratingAfter: 1010,
    ratingChange: 10,
  };
}

describe("calculateActivity", () => {
  it("calculates the most active day", () => {
    const result = calculateActivity([
      match(1, "2026-01-01T01:00:00Z"),
      match(2, "2026-01-01T02:00:00Z"),
      match(3, "2026-01-02T01:00:00Z"),
    ]);

    expect(result.mostActiveDay).toEqual({
      date: "2026-01-01",
      games: 2,
    });
  });

  it("calculates the longest inactivity period", () => {
    const result = calculateActivity([
      match(1, "2026-01-01T00:00:00Z"),
      match(2, "2026-01-11T00:00:00Z"),
    ]);

    expect(result.longestBreak.days).toBe(10);

    expect(result.longestBreak.from).toBe("2026-01-01T00:00:00Z");

    expect(result.longestBreak.to).toBe("2026-01-11T00:00:00Z");
  });
});
