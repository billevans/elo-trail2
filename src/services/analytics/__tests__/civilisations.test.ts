import { describe, expect, it } from "vitest";

import type { MatchSummary } from "@/types/history";

import { calculateCivilisationAnalytics } from "../civilisations";

function match(
  gameId: number,
  civilisation: string | undefined,
  result: MatchSummary["result"],
  ratingChange: number,
): MatchSummary {
  return {
    gameId,
    startedAt: `2026-01-${String(gameId).padStart(2, "0")}T00:00:00Z`,
    civilization: civilisation,
    result,
    ratingBefore: 1000,
    ratingAfter: 1000 + ratingChange,
    ratingChange,
  };
}

describe("calculateCivilisationAnalytics", () => {
  it("groups matches by civilisation", () => {
    const analytics = calculateCivilisationAnalytics([
      match(1, "english", "win", 15),
      match(2, "english", "loss", -20),
      match(3, "french", "win", 10),
    ]);

    expect(analytics.civilisations).toHaveLength(2);

    const english = analytics.civilisations.find(
      (entry) => entry.civilisation === "english",
    );

    expect(english).toMatchObject({
      games: 2,
      wins: 1,
      losses: 1,
      winRate: 50,
      netEloChange: -5,
      averageEloChange: -2.5,
      averageGain: 15,
      averageLoss: -20,
    });
  });

  it("chooses the most-played civilisation as favourite", () => {
    const analytics = calculateCivilisationAnalytics([
      match(1, "english", "win", 10),
      match(2, "english", "win", 10),
      match(3, "french", "win", 10),
    ]);

    expect(analytics.favourite.civilisation).toBe("english");

    expect(analytics.favourite.games).toBe(2);
  });

  it("requires the minimum game count for strongest and weakest", () => {
    const analytics = calculateCivilisationAnalytics(
      [
        match(1, "english", "win", 10),
        match(2, "english", "win", 10),
        match(3, "english", "loss", -10),
        match(4, "french", "loss", -10),
        match(5, "french", "loss", -10),
        match(6, "french", "loss", -10),
        match(7, "mongols", "win", 10),
      ],
      3,
    );

    expect(analytics.strongest.civilisation).toBe("english");

    expect(analytics.weakest.civilisation).toBe("french");
  });

  it("ignores matches without civilisation information", () => {
    const analytics = calculateCivilisationAnalytics([
      match(1, undefined, "win", 10),
    ]);

    expect(analytics.civilisations).toEqual([]);

    expect(analytics.favourite.civilisation).toBeNull();
  });
});
