"use client";

import { useMemo, useState } from "react";
import {
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
import type { EloPoint, MatchSummary } from "@/types/history";

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

  const [copied, setCopied] = useState(false);

  const playerOneHistory = usePlayerHistory(playerOne.profile_id, {
    days: 180,
  });

  const playerTwoHistory = usePlayerHistory(playerTwo.profile_id, {
    days: 180,
  });

  const playerOneCurrentElo = getCurrentElo(playerOne);

  const playerTwoCurrentElo = getCurrentElo(playerTwo);

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

  async function copyComparisonLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  function retryComparison() {
    void Promise.all([playerOneHistory.refetch(), playerTwoHistory.refetch()]);
  }

  return (
    <section className="space-y-6 rounded-2xl border border-black/10 bg-black/[0.02] p-4 sm:p-6 dark:border-white/10 dark:bg-white/[0.03]">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-black/45 uppercase dark:text-white/45">
            Matchmaking ELO comparison
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            {playerOne.name} vs {playerTwo.name}
          </h2>

          <p className="mt-1 text-sm text-black/50 dark:text-white/50">
            Analytics cover the selected {Number.parseInt(range, 10)}
            -day period
            {isFetching ? " · refreshing" : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <HistoryRangeSelector value={range} onChange={setRange} />

          <button
            type="button"
            onClick={onSwap}
            className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium transition hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:outline-none dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:focus-visible:ring-white/40"
          >
            <ArrowRightLeft className="size-4" aria-hidden="true" />
            Swap
          </button>

          <button
            type="button"
            onClick={() => void copyComparisonLink()}
            className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium transition hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:outline-none dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:focus-visible:ring-white/40"
          >
            {copied ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}

            {copied ? "Copied" : "Copy link"}
          </button>

          <span aria-live="polite" className="sr-only">
            {copied ? "Comparison link copied" : ""}
          </span>
        </div>
      </header>

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
              "mt-2 text-sm font-medium",
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

          <p className="text-sm text-black/45 dark:text-white/45">
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
              "mt-2 text-sm font-medium",
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
          className="flex min-h-96 items-center justify-center"
        >
          <div className="flex items-center gap-3 text-black/55 dark:text-white/55">
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            Loading both ELO histories…
          </div>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-500/25 bg-red-500/5 p-6 text-center"
        >
          <h3 className="font-semibold text-red-700 dark:text-red-400">
            Comparison could not be loaded
          </h3>

          <p className="mt-1 text-sm text-red-700/75 dark:text-red-400/75">
            {error.message}
          </p>

          <button
            type="button"
            onClick={retryComparison}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-black/10 bg-white p-3 sm:p-5 dark:border-white/10 dark:bg-black/10">
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
