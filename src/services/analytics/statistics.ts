import type { EloPoint, MatchSummary } from "@/types/history";

import type {
  MatchAnalytics,
  PlayerCareerSummary,
  RatingAnalytics,
  RatingExtreme,
} from "./types";

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sortPoints(points: EloPoint[]) {
  return [...points].sort(
    (left, right) =>
      new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  );
}

function sortMatches(matches: MatchSummary[]) {
  return [...matches].sort(
    (left, right) =>
      new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
  );
}

function calculateMedian(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);

  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle] ?? null;
  }

  const left = sorted[middle - 1];

  const right = sorted[middle];

  if (left === undefined || right === undefined) {
    return null;
  }

  return (left + right) / 2;
}

function createExtreme(point: EloPoint | undefined): RatingExtreme {
  if (!point) {
    return {
      rating: null,
      date: null,
      gameId: null,
    };
  }

  return {
    rating: point.rating,
    date: point.timestamp,
    gameId: point.gameId,
  };
}

export function calculateRatingAnalytics(
  points: EloPoint[],
  authoritativeCurrentElo?: number | null,
): RatingAnalytics {
  const sortedPoints = sortPoints(points);

  const firstPoint = sortedPoints[0];

  const lastPoint = sortedPoints.at(-1);

  const startingElo = firstPoint
    ? firstPoint.rating - firstPoint.ratingChange
    : null;

  const currentElo = isFiniteNumber(authoritativeCurrentElo)
    ? authoritativeCurrentElo
    : (lastPoint?.rating ?? null);

  if (sortedPoints.length === 0) {
    return {
      startingElo,
      currentElo,
      peak: {
        rating: currentElo,
        date: null,
        gameId: null,
      },
      lowest: {
        rating: currentElo,
        date: null,
        gameId: null,
      },
      totalChange: 0,
      averageElo: currentElo,
      medianElo: currentElo,
    };
  }

  let peakPoint = sortedPoints[0];

  let lowestPoint = sortedPoints[0];

  for (const point of sortedPoints) {
    if (!peakPoint || point.rating > peakPoint.rating) {
      peakPoint = point;
    }

    if (!lowestPoint || point.rating < lowestPoint.rating) {
      lowestPoint = point;
    }
  }

  const ratings = sortedPoints.map((point) => point.rating);

  if (startingElo !== null) {
    ratings.unshift(startingElo);
  }

  if (currentElo !== null && currentElo !== lastPoint?.rating) {
    ratings.push(currentElo);
  }

  const averageElo =
    ratings.length === 0
      ? null
      : ratings.reduce((total, rating) => total + rating, 0) / ratings.length;

  const peak = createExtreme(peakPoint);

  const lowest = createExtreme(lowestPoint);

  if (
    currentElo !== null &&
    (peak.rating === null || currentElo > peak.rating)
  ) {
    peak.rating = currentElo;
    peak.date = lastPoint?.timestamp ?? null;
    peak.gameId = lastPoint?.gameId ?? null;
  }

  if (
    currentElo !== null &&
    (lowest.rating === null || currentElo < lowest.rating)
  ) {
    lowest.rating = currentElo;
    lowest.date = lastPoint?.timestamp ?? null;
    lowest.gameId = lastPoint?.gameId ?? null;
  }

  return {
    startingElo,
    currentElo,
    peak,
    lowest,
    totalChange:
      startingElo !== null && currentElo !== null
        ? currentElo - startingElo
        : 0,
    averageElo,
    medianElo: calculateMedian(ratings),
  };
}

export function calculateMatchAnalytics(
  matches: MatchSummary[],
): MatchAnalytics {
  const sortedMatches = sortMatches(matches);

  const wins = sortedMatches.filter((match) => match.result === "win");

  const losses = sortedMatches.filter((match) => match.result === "loss");

  const unknownResults = sortedMatches.length - wins.length - losses.length;

  const gains = sortedMatches
    .map((match) => match.ratingChange)
    .filter((change) => change > 0);

  const negativeChanges = sortedMatches
    .map((match) => match.ratingChange)
    .filter((change) => change < 0);

  const decidedGames = wins.length + losses.length;

  return {
    games: sortedMatches.length,
    wins: wins.length,
    losses: losses.length,
    unknownResults,
    winRate: decidedGames === 0 ? null : (wins.length / decidedGames) * 100,
    averageGain:
      gains.length === 0
        ? null
        : gains.reduce((total, gain) => total + gain, 0) / gains.length,
    averageLoss:
      negativeChanges.length === 0
        ? null
        : negativeChanges.reduce((total, loss) => total + loss, 0) /
          negativeChanges.length,
    biggestGain: gains.length === 0 ? null : Math.max(...gains),
    biggestLoss:
      negativeChanges.length === 0 ? null : Math.min(...negativeChanges),
  };
}

export function normaliseCareerSummary(
  career: Partial<PlayerCareerSummary> | undefined,
  fallbackMatches: MatchAnalytics,
  currentElo: number | null,
): PlayerCareerSummary {
  const games = isFiniteNumber(career?.games)
    ? career.games
    : fallbackMatches.games;

  const wins = isFiniteNumber(career?.wins)
    ? career.wins
    : fallbackMatches.wins;

  const losses = isFiniteNumber(career?.losses)
    ? career.losses
    : fallbackMatches.losses;

  const winRate = isFiniteNumber(career?.winRate)
    ? career.winRate
    : wins + losses > 0
      ? (wins / (wins + losses)) * 100
      : null;

  return {
    currentElo: isFiniteNumber(career?.currentElo)
      ? career.currentElo
      : currentElo,
    games,
    wins,
    losses,
    winRate,
  };
}
