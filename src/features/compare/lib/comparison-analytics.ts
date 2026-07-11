import type { EloPoint, MatchSummary } from "@/types/history";

export interface ComparisonAnalytics {
  startingElo: number | null;
  currentElo: number | null;
  eloChange: number;
  peakElo: number | null;
  lowestElo: number | null;

  games: number;
  wins: number;
  losses: number;
  winRate: number | null;

  averageEloMovement: number | null;
  largestGain: number | null;
  largestLoss: number | null;
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getStartingElo(points: EloPoint[]): number | null {
  const firstPoint = points[0];

  if (!firstPoint) {
    return null;
  }

  return firstPoint.rating - firstPoint.ratingChange;
}

function getCurrentElo(
  points: EloPoint[],
  authoritativeCurrentElo: number | null | undefined,
): number | null {
  if (isFiniteNumber(authoritativeCurrentElo)) {
    return authoritativeCurrentElo;
  }

  return points.at(-1)?.rating ?? null;
}

export function calculateComparisonAnalytics(
  points: EloPoint[],
  matches: MatchSummary[],
  authoritativeCurrentElo?: number | null,
): ComparisonAnalytics {
  const startingElo = getStartingElo(points);

  const currentElo = getCurrentElo(points, authoritativeCurrentElo);

  const ratings = points.map((point) => point.rating);

  if (startingElo !== null) {
    ratings.push(startingElo);
  }

  if (currentElo !== null) {
    ratings.push(currentElo);
  }

  const wins = matches.filter((match) => match.result === "win").length;

  const losses = matches.filter((match) => match.result === "loss").length;

  const decidedGames = wins + losses;

  const changes = matches
    .map((match) => match.ratingChange)
    .filter(Number.isFinite);

  const gains = changes.filter((change) => change > 0);

  const lossesByElo = changes.filter((change) => change < 0);

  const averageEloMovement =
    changes.length > 0
      ? changes.reduce((total, change) => total + Math.abs(change), 0) /
        changes.length
      : null;

  return {
    startingElo,

    currentElo,

    eloChange:
      startingElo !== null && currentElo !== null
        ? currentElo - startingElo
        : 0,

    peakElo: ratings.length > 0 ? Math.max(...ratings) : null,

    lowestElo: ratings.length > 0 ? Math.min(...ratings) : null,

    games: matches.length,

    wins,

    losses,

    winRate: decidedGames > 0 ? (wins / decidedGames) * 100 : null,

    averageEloMovement,

    largestGain: gains.length > 0 ? Math.max(...gains) : null,

    largestLoss: lossesByElo.length > 0 ? Math.min(...lossesByElo) : null,
  };
}
