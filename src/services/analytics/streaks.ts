import type { MatchSummary } from "@/types/history";

import type { StreakAnalytics, StreakKind, StreakValue } from "./types";

function sortMatches(matches: MatchSummary[]) {
  return [...matches].sort(
    (left, right) =>
      new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
  );
}

function toStreakKind(match: MatchSummary): StreakKind {
  if (match.result === "win") {
    return "win";
  }

  if (match.result === "loss") {
    return "loss";
  }

  return "none";
}

export function calculateStreaks(matches: MatchSummary[]): StreakAnalytics {
  const sortedMatches = sortMatches(matches);

  let activeKind: StreakKind = "none";

  let activeCount = 0;
  let longestWin = 0;
  let longestLoss = 0;

  for (const match of sortedMatches) {
    const kind = toStreakKind(match);

    if (kind === "none") {
      activeKind = "none";
      activeCount = 0;
      continue;
    }

    if (kind === activeKind) {
      activeCount += 1;
    } else {
      activeKind = kind;
      activeCount = 1;
    }

    if (kind === "win") {
      longestWin = Math.max(longestWin, activeCount);
    }

    if (kind === "loss") {
      longestLoss = Math.max(longestLoss, activeCount);
    }
  }

  const current: StreakValue =
    activeKind === "none"
      ? {
          kind: "none",
          count: 0,
        }
      : {
          kind: activeKind,
          count: activeCount,
        };

  return {
    current,
    longestWin,
    longestLoss,
  };
}
