import type { OperationalEventName } from "./types";

export function getSearchEventName(statusCode: number): OperationalEventName {
  return statusCode >= 400 ? "search.error" : "search.success";
}

export function getLeaderboardReadEventName(
  statusCode: number,
): OperationalEventName {
  return statusCode >= 400 ? "leaderboard.error" : "leaderboard.read";
}

export function getLeaderboardRefreshEventName(
  statusCode: number,
): OperationalEventName {
  return statusCode >= 400 ? "leaderboard.error" : "leaderboard.refresh";
}

export function getCacheCleanupEventName(
  statusCode: number,
): OperationalEventName {
  return statusCode >= 400 ? "cache.cleanup.error" : "cache.cleanup";
}

export function getOperationalErrorCode(
  statusCode: number,
  errorCode: string | null,
): string | undefined {
  if (errorCode) {
    return errorCode;
  }

  return statusCode >= 500 ? "INTERNAL_ERROR" : undefined;
}

export function getArrayLength(value: unknown): number | undefined {
  return Array.isArray(value) ? value.length : undefined;
}
