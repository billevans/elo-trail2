import type { MatchSummary } from "@/types/history";

import type { ActivityAnalytics } from "./types";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function sortMatches(matches: MatchSummary[]) {
  return [...matches].sort(
    (left, right) =>
      new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
  );
}

function toUtcDateKey(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

export function calculateActivity(matches: MatchSummary[]): ActivityAnalytics {
  const sortedMatches = sortMatches(matches).filter(
    (match) => !Number.isNaN(new Date(match.startedAt).getTime()),
  );

  if (sortedMatches.length === 0) {
    return {
      mostActiveDay: {
        date: null,
        games: 0,
      },
      longestBreak: {
        days: 0,
        from: null,
        to: null,
      },
      firstGameAt: null,
      lastGameAt: null,
    };
  }

  const gamesByDay = new Map<string, number>();

  for (const match of sortedMatches) {
    const key = toUtcDateKey(match.startedAt);

    if (!key) {
      continue;
    }

    gamesByDay.set(key, (gamesByDay.get(key) ?? 0) + 1);
  }

  let mostActiveDate: string | null = null;

  let mostActiveGames = 0;

  for (const [date, games] of gamesByDay) {
    if (games > mostActiveGames) {
      mostActiveDate = date;
      mostActiveGames = games;
    }
  }

  let longestBreakDays = 0;
  let longestBreakFrom: string | null = null;
  let longestBreakTo: string | null = null;

  for (let index = 1; index < sortedMatches.length; index += 1) {
    const previous = sortedMatches[index - 1];

    const current = sortedMatches[index];

    if (!previous || !current) {
      continue;
    }

    const previousTime = new Date(previous.startedAt).getTime();

    const currentTime = new Date(current.startedAt).getTime();

    const breakDays = (currentTime - previousTime) / MILLISECONDS_PER_DAY;

    if (breakDays > longestBreakDays) {
      longestBreakDays = breakDays;

      longestBreakFrom = previous.startedAt;

      longestBreakTo = current.startedAt;
    }
  }

  return {
    mostActiveDay: {
      date: mostActiveDate,
      games: mostActiveGames,
    },
    longestBreak: {
      days: Math.floor(longestBreakDays),
      from: longestBreakFrom,
      to: longestBreakTo,
    },
    firstGameAt: sortedMatches[0]?.startedAt ?? null,
    lastGameAt: sortedMatches.at(-1)?.startedAt ?? null,
  };
}
