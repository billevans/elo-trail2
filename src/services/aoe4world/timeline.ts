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
    return game.teams
      .flat()
      .map((entry) => entry.player)
      .filter(
        (player): player is Aoe4WorldGamePlayer =>
          player !== null && player !== undefined,
      );
  }

  return Array.isArray(game.players) ? game.players : [];
}

function normaliseResult(result: string | null | undefined): MatchResult {
  const value = result?.trim().toLowerCase();

  if (value === "win" || value === "won") {
    return "win";
  }

  if (value === "loss" || value === "lost") {
    return "loss";
  }

  return "unknown";
}

function getOpponent(
  game: Aoe4WorldGame,
  playerId: number,
): Aoe4WorldGamePlayer | undefined {
  if (Array.isArray(game.teams)) {
    const playerTeamIndex = game.teams.findIndex((team) =>
      team.some((entry) => entry.player?.profile_id === playerId),
    );

    if (playerTeamIndex >= 0) {
      const opposingTeam = game.teams.find(
        (_, index) => index !== playerTeamIndex,
      );

      const opposingPlayer = opposingTeam
        ?.map((entry) => entry.player)
        .find(
          (player): player is Aoe4WorldGamePlayer =>
            player !== null &&
            player !== undefined &&
            player.profile_id !== playerId,
        );

      if (opposingPlayer) {
        return opposingPlayer;
      }
    }
  }

  return flattenPlayers(game).find(
    (player) =>
      player.profile_id !== null &&
      player.profile_id !== undefined &&
      player.profile_id !== playerId,
  );
}

function toMatchSummary(
  game: Aoe4WorldGame,
  playerId: number,
): MatchSummary | null {
  if (!game.started_at) {
    return null;
  }

  const startedAt = new Date(game.started_at);

  if (Number.isNaN(startedAt.getTime())) {
    return null;
  }

  const players = flattenPlayers(game);

  const player = players.find((entry) => entry.profile_id === playerId);

  /*
   * ELO Trail uses only matchmaking ELO.
   *
   * rating / rating_diff = ranked-season points
   * mmr / mmr_diff       = matchmaking ELO
   */
  if (
    !player ||
    typeof player.mmr !== "number" ||
    !Number.isFinite(player.mmr)
  ) {
    return null;
  }

  const eloChange =
    typeof player.mmr_diff === "number" && Number.isFinite(player.mmr_diff)
      ? player.mmr_diff
      : 0;

  const opponent = getOpponent(game, playerId);

  return {
    gameId: game.game_id ?? game.id ?? `${playerId}-${game.started_at}`,

    startedAt: startedAt.toISOString(),

    leaderboard: game.mmr_leaderboard ?? game.kind ?? undefined,

    map: game.map ?? game.map_name ?? undefined,

    civilization: player.civilization ?? undefined,

    result: normaliseResult(player.result),

    ratingBefore: player.mmr,

    ratingAfter: player.mmr + eloChange,

    ratingChange: eloChange,

    opponentProfileId: opponent?.profile_id ?? undefined,

    opponentName: opponent?.name ?? undefined,

    opponentRating:
      typeof opponent?.mmr === "number" && Number.isFinite(opponent.mmr)
        ? opponent.mmr
        : undefined,
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
