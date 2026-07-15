import type {
  HistoryCacheState,
  HistoryCacheMetadata,
} from "./history-cache-types";

export type HistoryLoadDecision =
  "serve-cache" | "bootstrap-cache" | "incremental-refresh" | "full-refresh";

export function decideHistoryLoad(
  cacheState: HistoryCacheState | null,
  metadata: HistoryCacheMetadata | null = null,
): HistoryLoadDecision {
  if (cacheState === "fresh") {
    return "serve-cache";
  }

  if (cacheState === "miss" || cacheState === null) {
    return "bootstrap-cache";
  }

  if (cacheState === "stale" && metadata?.newestGameAt) {
    return "incremental-refresh";
  }

  return "full-refresh";
}
