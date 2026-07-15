import type { Aoe4WorldGame } from "@/services/aoe4world/history-types";

export function getCachedGameId(game: Aoe4WorldGame): string {
  if (typeof game.game_id === "number" || typeof game.game_id === "string") {
    return String(game.game_id);
  }

  if (typeof game.id === "number" || typeof game.id === "string") {
    return String(game.id);
  }

  return [
    game.started_at ?? "unknown-date",
    game.kind ?? "unknown-kind",
    game.map ?? game.map_name ?? "unknown-map",
  ].join(":");
}

export function getCachedGameStartedAt(game: Aoe4WorldGame): Date | null {
  if (!game.started_at) {
    return null;
  }

  const startedAt = new Date(game.started_at);

  return Number.isNaN(startedAt.getTime()) ? null : startedAt;
}

export function isAoe4WorldGame(value: unknown): value is Aoe4WorldGame {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<Aoe4WorldGame>;

  return (
    candidate.game_id !== undefined ||
    candidate.id !== undefined ||
    typeof candidate.started_at === "string"
  );
}

export function mergeHistoryGames(
  cachedGames: Aoe4WorldGame[],
  refreshedGames: Aoe4WorldGame[],
): Aoe4WorldGame[] {
  const gamesById = new Map<string, Aoe4WorldGame>();

  /*
   * Cached games are inserted first. Refreshed games are
   * inserted afterward, so overlapping upstream records
   * replace older cached representations.
   */
  for (const game of cachedGames) {
    gamesById.set(getCachedGameId(game), game);
  }

  for (const game of refreshedGames) {
    gamesById.set(getCachedGameId(game), game);
  }

  return [...gamesById.values()].sort((left, right) => {
    const leftTime = getCachedGameStartedAt(left)?.getTime() ?? 0;

    const rightTime = getCachedGameStartedAt(right)?.getTime() ?? 0;

    return leftTime - rightTime;
  });
}

export function getIncrementalRefreshSince(
  newestGameAt: Date,
  overlapMilliseconds: number,
): string {
  if (Number.isNaN(newestGameAt.getTime())) {
    throw new Error("Newest cached game date must be valid.");
  }

  if (!Number.isFinite(overlapMilliseconds) || overlapMilliseconds < 0) {
    throw new Error("Refresh overlap must be a non-negative number.");
  }

  return new Date(newestGameAt.getTime() - overlapMilliseconds).toISOString();
}
