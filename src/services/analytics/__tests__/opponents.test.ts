import { describe, expect, it } from "vitest";

import type { MatchSummary } from "@/types/history";

import { calculateOpponentAnalytics } from "../opponents";

function match(
  gameId: number,
  opponentProfileId: number,
  opponentName: string,
  opponentRating: number,
  result: MatchSummary["result"],
  ratingChange: number,
): MatchSummary {
  return {
    gameId,
    startedAt: `2026-01-${String(gameId).padStart(2, "0")}T00:00:00Z`,
    result,
    ratingBefore: 1000,
    ratingAfter: 1000 + ratingChange,
    ratingChange,
    opponentProfileId,
    opponentName,
    opponentRating,
  };
}

describe("calculateOpponentAnalytics", () => {
  it("groups repeat opponents", () => {
    const analytics = calculateOpponentAnalytics([
      match(1, 10, "Player A", 1100, "win", 15),
      match(2, 10, "Player A", 1120, "loss", -20),
      match(3, 20, "Player B", 1200, "win", 18),
    ]);

    expect(analytics.uniqueOpponents).toBe(2);

    expect(analytics.repeatOpponents).toBe(1);

    const playerA = analytics.opponents.find(
      (opponent) => opponent.profileId === 10,
    );

    expect(playerA).toMatchObject({
      games: 2,
      wins: 1,
      losses: 1,
      winRate: 50,
      netEloChange: -5,
      averageOpponentElo: 1110,
      highestOpponentElo: 1120,
    });
  });

  it("identifies the strongest defeated opponent", () => {
    const analytics = calculateOpponentAnalytics([
      match(1, 10, "Player A", 1100, "win", 15),
      match(2, 20, "Player B", 1250, "loss", -20),
      match(3, 30, "Player C", 1210, "win", 18),
    ]);

    expect(analytics.strongestDefeated.name).toBe("Player C");

    expect(analytics.strongestDefeated.opponentElo).toBe(1210);
  });

  it("identifies the highest-rated opponent faced", () => {
    const analytics = calculateOpponentAnalytics([
      match(1, 10, "Player A", 1100, "win", 15),
      match(2, 20, "Player B", 1250, "loss", -20),
    ]);

    expect(analytics.highestFaced.name).toBe("Player B");

    expect(analytics.highestFaced.opponentElo).toBe(1250);
  });

  it("calculates average opponent ELO", () => {
    const analytics = calculateOpponentAnalytics([
      match(1, 10, "Player A", 1000, "win", 10),
      match(2, 20, "Player B", 1200, "loss", -10),
    ]);

    expect(analytics.averageOpponentElo).toBe(1100);
  });

  it("returns safe empty highlights", () => {
    const analytics = calculateOpponentAnalytics([]);

    expect(analytics.uniqueOpponents).toBe(0);

    expect(analytics.strongestDefeated.name).toBeNull();

    expect(analytics.highestFaced.name).toBeNull();
  });
});
