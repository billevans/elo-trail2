import type { HistoryCacheState } from "./history-cache-types";

export type HistoryLoadDecision = "serve-cache" | "refresh-upstream";

export function decideHistoryLoad(
  cacheState: HistoryCacheState | null,
): HistoryLoadDecision {
  return cacheState === "fresh" ? "serve-cache" : "refresh-upstream";
}
