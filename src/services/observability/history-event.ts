import type { OperationalEventName } from "./types";

export function getHistoryOperationalEventName(
  statusCode: number,
  cacheSource: string | null,
): OperationalEventName {
  switch (cacheSource) {
    case "database-fresh":
      return "history.cache.fresh";

    case "aoe4world-incremental-refresh":
      return "history.refresh.incremental";

    case "aoe4world-full-refresh":
      return "history.refresh.full";

    case "aoe4world-cache-miss":
      return "history.refresh.miss";

    case "database-stale-fallback":
      return "history.stale.fallback";

    case "database-stale-refresh-in-progress":
      return "history.refresh.in_progress";

    default:
      return statusCode >= 400 ? "history.error" : "history.request";
  }
}

export function getHistoryErrorCode(statusCode: number): string | undefined {
  switch (statusCode) {
    case 400:
      return "INVALID_HISTORY_REQUEST";

    case 429:
      return "RATE_LIMITED";

    case 502:
      return "HISTORY_UPSTREAM_ERROR";

    case 503:
      return "HISTORY_REFRESH_IN_PROGRESS";

    default:
      return statusCode >= 500 ? "HISTORY_INTERNAL_ERROR" : undefined;
  }
}

export function parseMetricHeader(value: string | null): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : undefined;
}
