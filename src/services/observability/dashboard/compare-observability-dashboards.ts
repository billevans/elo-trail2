import type {
  MetricTrend,
  ObservabilityDashboard,
  ObservabilityDashboardComparison,
  ObservabilityDashboardTrends,
} from "./types";

function round(value: number, decimalPlaces = 1): number {
  const factor = 10 ** decimalPlaces;

  return Math.round(value * factor) / factor;
}

export function calculateMetricTrend(
  current: number,
  previous: number | null,
): MetricTrend {
  if (previous === null) {
    return {
      current,
      previous: null,
      changePercent: null,
      direction: "unavailable",
    };
  }

  if (previous === 0) {
    if (current === 0) {
      return {
        current,
        previous,
        changePercent: 0,
        direction: "flat",
      };
    }

    return {
      current,
      previous,
      changePercent: null,
      direction: "up",
    };
  }

  const changePercent = round(
    ((current - previous) / Math.abs(previous)) * 100,
  );

  return {
    current,
    previous,
    changePercent,
    direction: changePercent > 0 ? "up" : changePercent < 0 ? "down" : "flat",
  };
}

export function compareObservabilityDashboards(
  current: ObservabilityDashboard,
  previous: ObservabilityDashboard,
): ObservabilityDashboardComparison {
  const trends: ObservabilityDashboardTrends = {
    totalEvents: calculateMetricTrend(
      current.overview.totalEvents,
      previous.overview.totalEvents,
    ),

    errorRate: calculateMetricTrend(
      current.overview.errorRate,
      previous.overview.errorRate,
    ),

    averageDurationMs: calculateMetricTrend(
      current.overview.averageDurationMs,
      previous.overview.averageDurationMs,
    ),

    cacheHitRate: calculateMetricTrend(
      current.history.cacheHitRate,
      previous.history.cacheHitRate,
    ),

    upstreamGames: calculateMetricTrend(
      current.apiEfficiency.upstreamGames,
      previous.apiEfficiency.upstreamGames,
    ),
  };

  return {
    current,
    previous,
    trends,
  };
}
