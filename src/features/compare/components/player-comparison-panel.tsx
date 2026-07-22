"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRightLeft,
  Check,
  Copy,
  LoaderCircle,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  HistoryRangeSelector,
  type HistoryRange,
  usePlayerHistory,
} from "@/features/player";
import type { Aoe4WorldPlayer } from "@/services/aoe4world";
import type { EloHistory, EloPoint, MatchSummary } from "@/types/history";

import {
  calculateComparisonAnalytics,
  type ComparisonAnalytics,
} from "../lib/comparison-analytics";

import { ComparisonMetricsTable } from "./comparison-metrics-table";
import { EloComparisonChart } from "./elo-comparison-chart";

interface PlayerComparisonPanelProps {
  playerOne: Aoe4WorldPlayer;
  playerTwo: Aoe4WorldPlayer;
  onSwap: () => void;
}

type CopyStatus = "idle" | "copied" | "error";

function getRangeStart(range: HistoryRange) {
  const days = Number.parseInt(range, 10);

  const start = new Date();

  start.setDate(start.getDate() - days);

  return start;
}

function filterPoints(points: EloPoint[], range: HistoryRange) {
  const start = getRangeStart(range);

  return points.filter((point) => new Date(point.timestamp) >= start);
}

function filterMatches(matches: MatchSummary[], range: HistoryRange) {
  const start = getRangeStart(range);

  return matches.filter((match) => new Date(match.startedAt) >= start);
}

function getCurrentElo(player: Aoe4WorldPlayer) {
  const rating = player.leaderboards?.rm_1v1_elo?.rating;

  return typeof rating === "number" ? rating : null;
}

function getHistoryCurrentElo(
  history: EloHistory | undefined,
  player: Aoe4WorldPlayer,
) {
  const statisticsRating = history?.statistics.currentRating;

  if (typeof statisticsRating === "number") {
    return statisticsRating;
  }

  const latestPoint = history?.points.at(-1);

  if (typeof latestPoint?.rating === "number") {
    return latestPoint.rating;
  }

  return getCurrentElo(player);
}

function formatElo(value: number | null) {
  return value === null ? "—" : value.toLocaleString();
}

function formatDifference(difference: number | null) {
  return difference === null ? "—" : Math.abs(difference).toLocaleString();
}

function buildAnalytics(
  points: EloPoint[],
  matches: MatchSummary[],
  currentElo: number | null,
): ComparisonAnalytics {
  return calculateComparisonAnalytics(points, matches, currentElo);
}

export function PlayerComparisonPanel({
  playerOne,
  playerTwo,
  onSwap,
}: PlayerComparisonPanelProps) {
  const [range, setRange] = useState<HistoryRange>("180d");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  const playerOneHistory = usePlayerHistory(playerOne.profile_id, {
    days: 180,
  });

  const playerTwoHistory = usePlayerHistory(playerTwo.profile_id, {
    days: 180,
  });

  const playerOneCurrentElo = getHistoryCurrentElo(
    playerOneHistory.data,
    playerOne,
  );

  const playerTwoCurrentElo = getHistoryCurrentElo(
    playerTwoHistory.data,
    playerTwo,
  );

  const playerOnePoints = useMemo(
    () => filterPoints(playerOneHistory.data?.points ?? [], range),
    [playerOneHistory.data?.points, range],
  );

  const playerTwoPoints = useMemo(
    () => filterPoints(playerTwoHistory.data?.points ?? [], range),
    [playerTwoHistory.data?.points, range],
  );

  const playerOneMatches = useMemo(
    () => filterMatches(playerOneHistory.data?.matches ?? [], range),
    [playerOneHistory.data?.matches, range],
  );

  const playerTwoMatches = useMemo(
    () => filterMatches(playerTwoHistory.data?.matches ?? [], range),
    [playerTwoHistory.data?.matches, range],
  );

  const playerOneAnalytics = useMemo(
    () =>
      buildAnalytics(playerOnePoints, playerOneMatches, playerOneCurrentElo),
    [playerOneCurrentElo, playerOneMatches, playerOnePoints],
  );

  const playerTwoAnalytics = useMemo(
    () =>
      buildAnalytics(playerTwoPoints, playerTwoMatches, playerTwoCurrentElo),
    [playerTwoCurrentElo, playerTwoMatches, playerTwoPoints],
  );

  const difference =
    playerOneCurrentElo !== null && playerTwoCurrentElo !== null
      ? playerOneCurrentElo - playerTwoCurrentElo
      : null;

  const isLoading = playerOneHistory.isLoading || playerTwoHistory.isLoading;

  const isFetching = playerOneHistory.isFetching || playerTwoHistory.isFetching;

  const error = playerOneHistory.error ?? playerTwoHistory.error;

  const hasComparisonPoints =
    playerOnePoints.length > 0 || playerTwoPoints.length > 0;

  async function copyComparisonLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);

      setCopyStatus("copied");

      window.setTimeout(() => {
        setCopyStatus("idle");
      }, 2000);
    } catch {
      setCopyStatus("error");

      window.setTimeout(() => {
        setCopyStatus("idle");
      }, 3000);
    }
  }

  function retryComparison() {
    void Promise.all([playerOneHistory.refetch(), playerTwoHistory.refetch()]);
  }

  return (
    <section
      aria-labelledby="comparison-heading"
      className="space-y-6 rounded-2xl border border-black/10 bg-black/[0.02] p-4 sm:p-6 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-[0.16em] text-black/45 uppercase dark:text-white/45">
            Matchmaking ELO comparison
          </p>

          <h2
            id="comparison-heading"
            className="mt-2 text-2xl font-bold tracking-tight break-words sm:text-3xl"
          >
            {playerOne.name} vs {playerTwo.name}
          </h2>

          <p className="mt-1 text-sm text-black/50 dark:text-white/50">
            Performance over the selected {Number.parseInt(range, 10)}-day
            period.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
          <HistoryRangeSelector value={range} onChange={setRange} />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSwap}
              className={[
                "inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2",
                "text-sm font-medium transition hover:bg-black/5",
                "focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:outline-none",
                "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                "dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-black",
              ].join(" ")}
            >
              <ArrowRightLeft className="size-4" aria-hidden="true" />
              Swap
            </button>

            <button
              type="button"
              onClick={() => void copyComparisonLink()}
              className={[
                "inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2",
                "text-sm font-medium transition hover:bg-black/5",
                "focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:outline-none",
                "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                "dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-black",
              ].join(" ")}
            >
              {copyStatus === "copied" ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}

              {copyStatus === "copied" ? "Copied" : "Copy link"}
            </button>
          </div>

          <span aria-live="polite" className="sr-only">
            {copyStatus === "copied"
              ? "Comparison link copied"
              : copyStatus === "error"
                ? "Comparison link could not be copied"
                : ""}
          </span>
        </div>
      </header>

      {copyStatus === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/25 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-400"
        >
          The comparison link could not be copied. Copy the page address from
          your browser instead.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <p className="truncate text-sm text-black/50 dark:text-white/50">
            {playerOne.name}
          </p>

          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {formatElo(playerOneCurrentElo)}
          </p>

          <p className="text-sm text-black/45 dark:text-white/45">
            Current ELO
          </p>

          <p
            className={[
              "mt-2 text-sm font-medium tabular-nums",
              playerOneAnalytics.eloChange > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : playerOneAnalytics.eloChange < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-black/45 dark:text-white/45",
            ].join(" ")}
          >
            {playerOneAnalytics.eloChange > 0 ? "+" : ""}
            {playerOneAnalytics.eloChange.toLocaleString()} during period
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm text-black/50 dark:text-white/50">
            Current ELO difference
          </p>

          <div className="mt-2 flex items-center gap-2">
            {difference !== null &&
              difference !== 0 &&
              (difference > 0 ? (
                <TrendingUp className="size-5" aria-hidden="true" />
              ) : (
                <TrendingDown className="size-5" aria-hidden="true" />
              ))}

            <p className="text-3xl font-semibold tabular-nums">
              {formatDifference(difference)}
            </p>
          </div>

          <p className="text-sm break-words text-black/45 dark:text-white/45">
            {difference === null
              ? "Difference unavailable"
              : difference === 0
                ? "Players are level"
                : difference > 0
                  ? `${playerOne.name} leads`
                  : `${playerTwo.name} leads`}
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <p className="truncate text-sm text-black/50 dark:text-white/50">
            {playerTwo.name}
          </p>

          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {formatElo(playerTwoCurrentElo)}
          </p>

          <p className="text-sm text-black/45 dark:text-white/45">
            Current ELO
          </p>

          <p
            className={[
              "mt-2 text-sm font-medium tabular-nums",
              playerTwoAnalytics.eloChange > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : playerTwoAnalytics.eloChange < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-black/45 dark:text-white/45",
            ].join(" ")}
          >
            {playerTwoAnalytics.eloChange > 0 ? "+" : ""}
            {playerTwoAnalytics.eloChange.toLocaleString()} during period
          </p>
        </div>
      </div>

      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="flex min-h-80 items-center justify-center rounded-xl border border-black/10 bg-white/50 p-6 text-center dark:border-white/10 dark:bg-black/10"
        >
          <div className="flex flex-col items-center gap-3">
            <LoaderCircle
              className="size-6 animate-spin text-black/55 dark:text-white/55"
              aria-hidden="true"
            />

            <div>
              <p className="font-medium">Loading both ELO histories</p>

              <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                Preparing the shared ELO trail and comparison metrics…
              </p>
            </div>
          </div>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-red-500/30 p-6 text-center"
        >
          <AlertCircle className="size-8 text-red-500" aria-hidden="true" />

          <h3 className="mt-3 font-semibold">Comparison could not be loaded</h3>

          <p className="mt-1 max-w-md text-sm break-words text-black/55 dark:text-white/55">
            {error.message}
          </p>

          <button
            type="button"
            onClick={retryComparison}
            className={[
              "mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-black px-4 py-2",
              "text-sm font-medium text-white transition hover:bg-black/80",
              "focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:outline-none",
              "dark:bg-white dark:text-black dark:hover:bg-white/80",
              "dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-black",
            ].join(" ")}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h3 className="text-lg font-semibold">Matchmaking ELO trails</h3>

              <p className="text-sm text-black/55 dark:text-white/55">
                {playerOnePoints.length.toLocaleString()} points for{" "}
                {playerOne.name} and {playerTwoPoints.length.toLocaleString()}{" "}
                points for {playerTwo.name}.
              </p>
            </div>

            {isFetching && (
              <p
                role="status"
                aria-live="polite"
                className="text-xs text-black/45 dark:text-white/45"
              >
                Refreshing comparison…
              </p>
            )}
          </div>

          {hasComparisonPoints ? (
            <div className="overflow-hidden rounded-xl border border-black/10 bg-white p-2 sm:p-5 dark:border-white/10 dark:bg-black/10">
              <EloComparisonChart
                players={[
                  {
                    profileId: playerOne.profile_id,
                    name: playerOne.name,
                    points: playerOnePoints,
                  },
                  {
                    profileId: playerTwo.profile_id,
                    name: playerTwo.name,
                    points: playerTwoPoints,
                  },
                ]}
              />
            </div>
          ) : (
            <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-black/15 p-6 text-center dark:border-white/15">
              <div>
                <h3 className="font-semibold">No ELO history in this range</h3>

                <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                  Try selecting a longer period to compare more history.
                </p>
              </div>
            </div>
          )}

          <ComparisonMetricsTable
            playerOneName={playerOne.name}
            playerTwoName={playerTwo.name}
            playerOne={playerOneAnalytics}
            playerTwo={playerTwoAnalytics}
          />
        </>
      )}
    </section>
  );
}
