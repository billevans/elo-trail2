import type { MatchSummary } from "@/types/history";

import type {
  CivilisationAnalytics,
  CivilisationHighlight,
  CivilisationPerformance,
} from "./types";

interface MutableCivilisationPerformance {
  civilisation: string;
  games: number;
  wins: number;
  losses: number;
  unknownResults: number;
  netEloChange: number;
  gains: number[];
  lossesInElo: number[];
}

function normaliseCivilisation(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const normalised = value.trim().toLowerCase();

  return normalised.length > 0 ? normalised : null;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function toPerformance(
  entry: MutableCivilisationPerformance,
): CivilisationPerformance {
  const decidedGames = entry.wins + entry.losses;

  return {
    civilisation: entry.civilisation,
    games: entry.games,
    wins: entry.wins,
    losses: entry.losses,
    unknownResults: entry.unknownResults,
    winRate: decidedGames > 0 ? (entry.wins / decidedGames) * 100 : null,
    netEloChange: entry.netEloChange,
    averageEloChange: entry.games > 0 ? entry.netEloChange / entry.games : null,
    averageGain: average(entry.gains),
    averageLoss: average(entry.lossesInElo),
  };
}

function emptyHighlight(): CivilisationHighlight {
  return {
    civilisation: null,
    games: 0,
    winRate: null,
  };
}

function toHighlight(
  performance: CivilisationPerformance | undefined,
): CivilisationHighlight {
  if (!performance) {
    return emptyHighlight();
  }

  return {
    civilisation: performance.civilisation,
    games: performance.games,
    winRate: performance.winRate,
  };
}

function chooseFavourite(
  civilisations: CivilisationPerformance[],
): CivilisationPerformance | undefined {
  return [...civilisations].sort(
    (left, right) =>
      right.games - left.games ||
      right.wins - left.wins ||
      left.civilisation.localeCompare(right.civilisation),
  )[0];
}

function chooseStrongest(
  civilisations: CivilisationPerformance[],
  minimumGames: number,
): CivilisationPerformance | undefined {
  return civilisations
    .filter((entry) => entry.games >= minimumGames && entry.winRate !== null)
    .sort(
      (left, right) =>
        (right.winRate ?? 0) - (left.winRate ?? 0) ||
        right.games - left.games ||
        right.netEloChange - left.netEloChange,
    )[0];
}

function chooseWeakest(
  civilisations: CivilisationPerformance[],
  minimumGames: number,
): CivilisationPerformance | undefined {
  return civilisations
    .filter((entry) => entry.games >= minimumGames && entry.winRate !== null)
    .sort(
      (left, right) =>
        (left.winRate ?? 0) - (right.winRate ?? 0) ||
        right.games - left.games ||
        left.netEloChange - right.netEloChange,
    )[0];
}

export function calculateCivilisationAnalytics(
  matches: MatchSummary[],
  minimumGamesForRanking = 3,
): CivilisationAnalytics {
  const grouped = new Map<string, MutableCivilisationPerformance>();

  for (const match of matches) {
    const civilisation = normaliseCivilisation(match.civilization);

    if (!civilisation) {
      continue;
    }

    const entry = grouped.get(civilisation) ?? {
      civilisation,
      games: 0,
      wins: 0,
      losses: 0,
      unknownResults: 0,
      netEloChange: 0,
      gains: [],
      lossesInElo: [],
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

    if (match.ratingChange > 0) {
      entry.gains.push(match.ratingChange);
    }

    if (match.ratingChange < 0) {
      entry.lossesInElo.push(match.ratingChange);
    }

    grouped.set(civilisation, entry);
  }

  const civilisations = [...grouped.values()]
    .map(toPerformance)
    .sort(
      (left, right) =>
        right.games - left.games ||
        left.civilisation.localeCompare(right.civilisation),
    );

  return {
    civilisations,
    favourite: toHighlight(chooseFavourite(civilisations)),
    strongest: toHighlight(
      chooseStrongest(civilisations, minimumGamesForRanking),
    ),
    weakest: toHighlight(chooseWeakest(civilisations, minimumGamesForRanking)),
  };
}
