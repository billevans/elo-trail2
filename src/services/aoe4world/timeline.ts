import type {
  EloHistory,
  EloPoint,
  MatchResult,
  MatchSummary,
} from "@/types/history";

import type { Aoe4WorldGame, Aoe4WorldGamePlayer } from "./history-types";
import { calculateEloStatistics } from "./statistics";

function flattenPlayers(game: Aoe4WorldGame): Aoe4WorldGamePlayer[] {
  if (Array.isArray(game.teams)) {
    return game.teams.flat();
  }

  return Array.isArray(game.players) ? game.players : [];
}

function normaliseResult(result: string | null | undefined): MatchResult {
  const value = result?.toLowerCase();

  if (value === "win" || value === "won") {
    return "win";
  }

  if (value === "loss" || value === "lost") {
    return "loss";
  }

  return "unknown";
}

function toMatchSummary(
  game: Aoe4WorldGame,
  playerId: number,
): MatchSummary | null {
  if (!game.started_at) {
    return null;
  }

  const players = flattenPlayers(game);

  const player = players.find((entry) => entry.profile_id === playerId);

  if (!player || typeof player.rating !== "number") {
    return null;
  }

  const ratingChange = player.rating_diff ?? 0;

  const opponent = players.find(
    (entry) => entry.profile_id != null && entry.profile_id !== playerId,
  );

  return {
    gameId: game.game_id ?? game.id ?? `${playerId}-${game.started_at}`,

    startedAt: game.started_at,

    leaderboard: game.leaderboard ?? undefined,

    map: game.map_name ?? game.map ?? undefined,

    civilization: player.civilization ?? undefined,

    result: normaliseResult(player.result),

    ratingBefore: player.rating,

    ratingAfter: player.rating + ratingChange,

    ratingChange,

    opponentProfileId: opponent?.profile_id ?? undefined,

    opponentName: opponent?.name ?? undefined,
  };
}

export function buildEloHistory(
  playerId: number,
  games: Aoe4WorldGame[],
  leaderboard?: string,
): EloHistory {
  if (!Number.isInteger(playerId) || playerId <= 0) {
    throw new Error("A valid positive player profile ID is required");
  }

  const matches = games
    .map((game) => toMatchSummary(game, playerId))
    .filter((match): match is MatchSummary => match !== null)
    .sort(
      (left, right) =>
        new Date(left.startedAt).getTime() -
        new Date(right.startedAt).getTime(),
    );

  const points: EloPoint[] = matches.map((match) => ({
    gameId: match.gameId,
    timestamp: match.startedAt,
    rating: match.ratingAfter,
    ratingChange: match.ratingChange,
  }));

  return {
    playerId,
    leaderboard,
    points,
    matches,
    statistics: calculateEloStatistics(matches),
  };
}
