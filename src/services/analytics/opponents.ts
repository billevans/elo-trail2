import type { MatchSummary } from "@/types/history";

import type {
  OpponentAnalytics,
  OpponentMatchHighlight,
  OpponentPerformance,
  OpponentSummaryHighlight,
} from "./types";

interface MutableOpponentPerformance {
  opponentKey: string;
  profileId: number | null;
  name: string;
  games: number;
  wins: number;
  losses: number;
  unknownResults: number;
  netEloChange: number;
  opponentRatings: number[];
  lastPlayedAt: string | null;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function normaliseName(value: string | undefined): string {
  const name = value?.trim();

  return name && name.length > 0 ? name : "Unknown opponent";
}

function getOpponentKey(match: MatchSummary): string {
  if (
    typeof match.opponentProfileId === "number" &&
    Number.isInteger(match.opponentProfileId)
  ) {
    return `profile:${match.opponentProfileId}`;
  }

  return `name:${normaliseName(match.opponentName).toLowerCase()}`;
}

function isFiniteNumber(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function toPerformance(entry: MutableOpponentPerformance): OpponentPerformance {
  const decidedGames = entry.wins + entry.losses;

  return {
    opponentKey: entry.opponentKey,
    profileId: entry.profileId,
    name: entry.name,
    games: entry.games,
    wins: entry.wins,
    losses: entry.losses,
    unknownResults: entry.unknownResults,
    winRate: decidedGames > 0 ? (entry.wins / decidedGames) * 100 : null,
    netEloChange: entry.netEloChange,
    averageOpponentElo: average(entry.opponentRatings),
    highestOpponentElo:
      entry.opponentRatings.length > 0
        ? Math.max(...entry.opponentRatings)
        : null,
    lastPlayedAt: entry.lastPlayedAt,
  };
}

function emptyMatchHighlight(): OpponentMatchHighlight {
  return {
    profileId: null,
    name: null,
    opponentElo: null,
    playedAt: null,
    gameId: null,
  };
}

function emptySummaryHighlight(): OpponentSummaryHighlight {
  return {
    profileId: null,
    name: null,
    games: 0,
    wins: 0,
    losses: 0,
    winRate: null,
  };
}

function toMatchHighlight(
  match: MatchSummary | undefined,
): OpponentMatchHighlight {
  if (!match) {
    return emptyMatchHighlight();
  }

  return {
    profileId: match.opponentProfileId ?? null,
    name: normaliseName(match.opponentName),
    opponentElo: isFiniteNumber(match.opponentRating)
      ? match.opponentRating
      : null,
    playedAt: match.startedAt,
    gameId: match.gameId,
  };
}

function toSummaryHighlight(
  opponent: OpponentPerformance | undefined,
): OpponentSummaryHighlight {
  if (!opponent) {
    return emptySummaryHighlight();
  }

  return {
    profileId: opponent.profileId,
    name: opponent.name,
    games: opponent.games,
    wins: opponent.wins,
    losses: opponent.losses,
    winRate: opponent.winRate,
  };
}

export function calculateOpponentAnalytics(
  matches: MatchSummary[],
): OpponentAnalytics {
  const grouped = new Map<string, MutableOpponentPerformance>();

  const validRatings: number[] = [];

  let strongestDefeated: MatchSummary | undefined;

  let highestFaced: MatchSummary | undefined;

  for (const match of matches) {
    const opponentKey = getOpponentKey(match);

    const name = normaliseName(match.opponentName);

    const entry = grouped.get(opponentKey) ?? {
      opponentKey,
      profileId: match.opponentProfileId ?? null,
      name,
      games: 0,
      wins: 0,
      losses: 0,
      unknownResults: 0,
      netEloChange: 0,
      opponentRatings: [],
      lastPlayedAt: null,
    };

    entry.games += 1;
    entry.netEloChange += match.ratingChange;

    if (match.result === "win") {
      entry.wins += 1;
    } else if (match.result === "loss") {
      entry.losses += 1;
    } else {
      entry.unknownResults += 1;
    }

    if (isFiniteNumber(match.opponentRating)) {
      entry.opponentRatings.push(match.opponentRating);

      validRatings.push(match.opponentRating);

      if (
        !highestFaced ||
        !isFiniteNumber(highestFaced.opponentRating) ||
        match.opponentRating > highestFaced.opponentRating
      ) {
        highestFaced = match;
      }

      if (
        match.result === "win" &&
        (!strongestDefeated ||
          !isFiniteNumber(strongestDefeated.opponentRating) ||
          match.opponentRating > strongestDefeated.opponentRating)
      ) {
        strongestDefeated = match;
      }
    }

    if (
      !entry.lastPlayedAt ||
      new Date(match.startedAt).getTime() >
        new Date(entry.lastPlayedAt).getTime()
    ) {
      entry.lastPlayedAt = match.startedAt;
    }

    grouped.set(opponentKey, entry);
  }

  const opponents = [...grouped.values()]
    .map(toPerformance)
    .sort(
      (left, right) =>
        right.games - left.games ||
        right.wins - left.wins ||
        left.name.localeCompare(right.name),
    );

  const mostFrequent = opponents[0];

  return {
    uniqueOpponents: opponents.length,
    repeatOpponents: opponents.filter((opponent) => opponent.games > 1).length,
    averageOpponentElo: average(validRatings),
    strongestDefeated: toMatchHighlight(strongestDefeated),
    highestFaced: toMatchHighlight(highestFaced),
    mostFrequent: toSummaryHighlight(mostFrequent),
    opponents,
  };
}
