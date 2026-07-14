import type { EloPoint } from "@/types/history";

export interface EloChartSummary {
  startingElo: number | null;
  currentElo: number | null;
  averageElo: number | null;
  peakPoint: EloPoint | null;
  lowestPoint: EloPoint | null;
}

function sortPoints(points: EloPoint[]): EloPoint[] {
  return [...points].sort(
    (left, right) =>
      new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  );
}

export function calculateEloChartSummary(points: EloPoint[]): EloChartSummary {
  const sortedPoints = sortPoints(points);

  const firstPoint = sortedPoints[0];
  const currentPoint = sortedPoints.at(-1);

  if (!firstPoint || !currentPoint) {
    return {
      startingElo: null,
      currentElo: null,
      averageElo: null,
      peakPoint: null,
      lowestPoint: null,
    };
  }

  let peakPoint = firstPoint;
  let lowestPoint = firstPoint;

  let ratingTotal = firstPoint.rating - firstPoint.ratingChange;

  for (const point of sortedPoints) {
    ratingTotal += point.rating;

    if (point.rating > peakPoint.rating) {
      peakPoint = point;
    }

    if (point.rating < lowestPoint.rating) {
      lowestPoint = point;
    }
  }

  const startingElo = firstPoint.rating - firstPoint.ratingChange;

  return {
    startingElo,
    currentElo: currentPoint.rating,
    averageElo: ratingTotal / (sortedPoints.length + 1),
    peakPoint,
    lowestPoint,
  };
}

export function calculateChartDomain(
  points: EloPoint[],
  minimumPadding = 25,
): [number, number] {
  if (points.length === 0) {
    return [0, 100];
  }

  const ratings = points.flatMap((point) => [
    point.rating,
    point.rating - point.ratingChange,
  ]);

  const minimum = Math.min(...ratings);
  const maximum = Math.max(...ratings);

  const range = maximum - minimum;

  const padding = Math.max(minimumPadding, Math.round(range * 0.12));

  return [minimum - padding, maximum + padding];
}
