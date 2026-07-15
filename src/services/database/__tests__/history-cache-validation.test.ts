import { describe, expect, it } from "vitest";

import type { Aoe4WorldGame } from "@/services/aoe4world/history-types";

import {
  getCachedGameId,
  getCachedGameStartedAt,
  isAoe4WorldGame,
} from "../history-cache-validation";

describe("history cache validation", () => {
  it("uses the AoE4World game ID", () => {
    const game = {
      game_id: 12345,
      started_at: "2026-07-01T00:00:00Z",
    } as Aoe4WorldGame;

    expect(getCachedGameId(game)).toBe("12345");
  });

  it("falls back to stable game fields", () => {
    const game = {
      started_at: "2026-07-01T00:00:00Z",
      kind: "rm_1v1",
      map: "Dry Arabia",
    } as Aoe4WorldGame;

    expect(getCachedGameId(game)).toBe(
      "2026-07-01T00:00:00Z:rm_1v1:Dry Arabia",
    );
  });

  it("parses valid start dates", () => {
    const game = {
      game_id: 1,
      started_at: "2026-07-01T00:00:00Z",
    } as Aoe4WorldGame;

    expect(getCachedGameStartedAt(game)?.toISOString()).toBe(
      "2026-07-01T00:00:00.000Z",
    );
  });

  it("rejects invalid start dates", () => {
    const game = {
      game_id: 1,
      started_at: "not-a-date",
    } as Aoe4WorldGame;

    expect(getCachedGameStartedAt(game)).toBeNull();
  });

  it("identifies plausible game records", () => {
    expect(
      isAoe4WorldGame({
        game_id: 1,
      }),
    ).toBe(true);

    expect(isAoe4WorldGame(null)).toBe(false);

    expect(
      isAoe4WorldGame({
        somethingElse: true,
      }),
    ).toBe(false);
  });
});
