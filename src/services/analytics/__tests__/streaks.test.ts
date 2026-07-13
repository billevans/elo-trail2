import { describe, expect, it } from "vitest";

import type { MatchSummary } from "@/types/history";

import { calculateStreaks } from "../streaks";

function match(result: MatchSummary["result"], day: number): MatchSummary {
  return {
    gameId: day,
    startedAt: `2026-01-${String(day).padStart(2, "0")}T00:00:00Z`,
    result,
    ratingBefore: 1000,
    ratingAfter: 1000,
    ratingChange: 0,
  };
}

describe("calculateStreaks", () => {
  it("calculates current and longest streaks", () => {
    const result = calculateStreaks([
      match("win", 1),
      match("win", 2),
      match("loss", 3),
      match("loss", 4),
      match("loss", 5),
      match("win", 6),
    ]);

    expect(result.longestWin).toBe(2);

    expect(result.longestLoss).toBe(3);

    expect(result.current).toEqual({
      kind: "win",
      count: 1,
    });
  });

  it("resets streaks for unknown results", () => {
    const result = calculateStreaks([match("win", 1), match("unknown", 2)]);

    expect(result.current).toEqual({
      kind: "none",
      count: 0,
    });
  });
});
