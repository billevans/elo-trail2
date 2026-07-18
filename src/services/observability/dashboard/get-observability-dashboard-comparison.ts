import { compareObservabilityDashboards } from "./compare-observability-dashboards";
import { getObservabilityDashboard } from "./get-observability-dashboard";
import { getObservabilityWindowStart } from "./reporting-window";
import type {
  ObservabilityDashboardComparison,
  ObservabilityWindow,
} from "./types";

interface GetDashboardComparisonOptions {
  window?: ObservabilityWindow;
  now?: Date;
}

export async function getObservabilityDashboardComparison({
  window = "24h",
  now = new Date(),
}: GetDashboardComparisonOptions = {}): Promise<ObservabilityDashboardComparison> {
  const currentWindowStartedAt = getObservabilityWindowStart(window, now);

  const previousWindowEndedAt = currentWindowStartedAt;

  const [current, previous] = await Promise.all([
    getObservabilityDashboard({
      window,
      now,
    }),

    getObservabilityDashboard({
      window,
      now: previousWindowEndedAt,
    }),
  ]);

  return compareObservabilityDashboards(current, previous);
}
