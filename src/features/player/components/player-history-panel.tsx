"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { AlertCircle, LoaderCircle, Swords, X } from "lucide-react";

import type { Aoe4WorldPlayer } from "@/services/aoe4world";
import { calculateEloStatistics } from "@/services/aoe4world/statistics";
import type { EloPoint, MatchSummary } from "@/types/history";

import { usePlayerHistory } from "../hooks/use-player-history";

import { EloHistoryChart } from "./elo-history-chart";
import {
  HistoryRangeSelector,
  type HistoryRange,
} from "./history-range-selector";
import { HistoryStatCards } from "./history-stat-cards";

interface PlayerHistoryPanelProps {
  player: Aoe4WorldPlayer;
  onClose: () => void;
}

function getRangeStart(range: HistoryRange) {
  if (range === "all") {
    return null;
  }

  const days = Number.parseInt(range, 10);
  const start = new Date();

  start.setDate(start.getDate() - days);

  return start;
}

function getPlayerRating(player: Aoe4WorldPlayer) {
  const preferredKeys = ["rm_1v1", "rm_solo", "qm_1v1"];

  for (const key of preferredKeys) {
    const leaderboard = player.leaderboards?.[key];

    if (typeof leaderboard?.rating === "number") {
      return leaderboard.rating;
    }
  }

  const firstRatedLeaderboard = Object.values(player.leaderboards ?? {}).find(
    (leaderboard) => typeof leaderboard.rating === "number",
  );

  return firstRatedLeaderboard?.rating ?? null;
}

function filterByRange<T extends { timestamp: string }>(
  values: T[],
  range: HistoryRange,
) {
  const start = getRangeStart(range);

  if (!start) {
    return values;
  }

  return values.filter((value) => new Date(value.timestamp) >= start);
}

function filterMatchesByRange(matches: MatchSummary[], range: HistoryRange) {
  const start = getRangeStart(range);

  if (!start) {
    return matches;
  }

  return matches.filter((match) => new Date(match.startedAt) >= start);
}

function createStatistics(points: EloPoint[], matches: MatchSummary[]) {
  const calculated = calculateEloStatistics(matches);

  if (points.length === 0) {
    return calculated;
  }

  const ratings = points.map((point) => point.rating);

  return {
    ...calculated,

    currentRating: ratings.at(-1) ?? null,

    peakRating: Math.max(...ratings),

    lowestRating: Math.min(...ratings),

    ratingChange:
      ratings.length > 1
        ? ratings.at(-1)! - ratings[0]!
        : (points[0]?.ratingChange ?? 0),
  };
}

export function PlayerHistoryPanel({
  player,
  onClose,
}: PlayerHistoryPanelProps) {
  const [range, setRange] = useState<HistoryRange>("all");

  const { data, isLoading, isFetching, error, refetch } = usePlayerHistory(
    player.profile_id,
    {
      leaderboard: "rm_solo",
      limit: 200,
    },
  );

  const filteredPoints = useMemo(
    () => filterByRange(data?.points ?? [], range),
    [data?.points, range],
  );

  const filteredMatches = useMemo(
    () => filterMatchesByRange(data?.matches ?? [], range),
    [data?.matches, range],
  );

  const statistics = useMemo(
    () => createStatistics(filteredPoints, filteredMatches),
    [filteredMatches, filteredPoints],
  );

  const profileRating = getPlayerRating(player);

  return (
    <section className="space-y-6 rounded-2xl border border-black/10 bg-black/[0.02] p-4 sm:p-6 dark:border-white/10 dark:bg-white/[0.03]">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <Swords className="size-5" aria-hidden="true" />

            <p className="text-sm font-medium text-black/55 dark:text-white/55">
              Ranked solo history
            </p>
          </div>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            {player.name}
          </h2>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-black/55 dark:text-white/55">
            <span>Profile #{player.profile_id}</span>

            {player.country && <span>{player.country}</span>}

            {profileRating !== null && (
              <span>
                Current profile rating: {profileRating.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-10 shrink-0 items-center justify-center self-end rounded-lg border border-black/10 transition-colors hover:bg-black/5 sm:self-auto dark:border-white/10 dark:hover:bg-white/10"
          aria-label={`Close ${player.name} history`}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </header>

      {isLoading ? (
        <div className="flex min-h-96 items-center justify-center">
          <div className="flex items-center gap-3 text-black/60 dark:text-white/60">
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />

            <span>Loading ELO history…</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-red-500/30 p-6 text-center">
          <AlertCircle className="size-8 text-red-500" aria-hidden="true" />

          <h3 className="mt-3 font-semibold">History could not be loaded</h3>

          <p className="mt-1 max-w-md text-sm text-black/55 dark:text-white/55">
            {error.message}
          </p>

          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-semibold">Rating progression</h3>

              <p className="text-sm text-black/55 dark:text-white/55">
                {filteredPoints.length.toLocaleString()} rated games shown
                {isFetching ? " · refreshing" : ""}
              </p>
            </div>

            <HistoryRangeSelector value={range} onChange={setRange} />
          </div>

          <HistoryStatCards statistics={statistics} />

          <div className="rounded-xl border border-black/10 bg-white p-3 sm:p-5 dark:border-white/10 dark:bg-black/10">
            <EloHistoryChart points={filteredPoints} />
          </div>

          <div>
            <div className="mb-3">
              <h3 className="text-lg font-semibold">Recent games</h3>

              <p className="text-sm text-black/55 dark:text-white/55">
                Latest games in the selected range
              </p>
            </div>

            {filteredMatches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/15 p-8 text-center text-sm text-black/55 dark:border-white/15 dark:text-white/55">
                No games are available for this range.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                <div className="divide-y divide-black/10 dark:divide-white/10">
                  {[...filteredMatches]
                    .reverse()
                    .slice(0, 10)
                    .map((match) => (
                      <article
                        key={match.gameId}
                        className="flex flex-col justify-between gap-3 bg-white p-4 sm:flex-row sm:items-center dark:bg-white/[0.03]"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={[
                                "rounded-full px-2 py-0.5 text-xs font-semibold uppercase",
                                match.result === "win"
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                  : match.result === "loss"
                                    ? "bg-red-500/10 text-red-700 dark:text-red-400"
                                    : "bg-black/5 text-black/55 dark:bg-white/10 dark:text-white/55",
                              ].join(" ")}
                            >
                              {match.result}
                            </span>

                            <span className="font-medium">
                              {match.opponentName
                                ? `vs ${match.opponentName}`
                                : "Opponent unavailable"}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                            {format(
                              new Date(match.startedAt),
                              "d MMM yyyy, h:mm a",
                            )}
                            {match.map ? ` · ${match.map}` : ""}
                            {match.civilization
                              ? ` · ${match.civilization}`
                              : ""}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="font-semibold">
                            {match.ratingAfter.toLocaleString()} ELO
                          </p>

                          <p
                            className={[
                              "text-sm font-medium",
                              match.ratingChange >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400",
                            ].join(" ")}
                          >
                            {match.ratingChange >= 0 ? "+" : ""}
                            {match.ratingChange}
                          </p>
                        </div>
                      </article>
                    ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
