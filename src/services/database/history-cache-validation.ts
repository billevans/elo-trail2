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
