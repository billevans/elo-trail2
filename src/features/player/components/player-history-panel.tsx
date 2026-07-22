"use client";

import { useId, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Swords,
  X,
} from "lucide-react";

import { calculatePlayerAnalytics } from "@/services/analytics";
import type { Aoe4WorldPlayer } from "@/services/aoe4world";
import type { EloPoint, MatchSummary } from "@/types/history";

import { usePlayerHistory } from "../hooks/use-player-history";

import { CivilisationAnalyticsPanel } from "./civilisation-analytics-panel";
import { EloHistoryChart } from "./elo-history-chart";
import {
  HistoryRangeSelector,
  type HistoryRange,
} from "./history-range-selector";
import { PlayerAnalyticsCards } from "./player-analytics-cards";
import { OpponentAnalyticsPanel } from "./opponent-analytics-panel";

interface PlayerHistoryPanelProps {
  player: Aoe4WorldPlayer;
  onClose: () => void;
}

interface MatchmakingCareerSummary {
  currentElo: number | null;
  games: number;
  wins: number;
  losses: number;
  winRate: number | null;
}

function getMatchmakingCareerSummary(
  player: Aoe4WorldPlayer,
): MatchmakingCareerSummary {
  const leaderboard = player.leaderboards?.rm_1v1_elo;

  return {
    currentElo:
      typeof leaderboard?.rating === "number" ? leaderboard.rating : null,

    games:
      typeof leaderboard?.games_count === "number"
        ? leaderboard.games_count
        : 0,

    wins:
      typeof leaderboard?.wins_count === "number" ? leaderboard.wins_count : 0,

    losses:
      typeof leaderboard?.losses_count === "number"
        ? leaderboard.losses_count
        : 0,

    winRate:
      typeof leaderboard?.win_rate === "number" ? leaderboard.win_rate : null,
  };
}

function getRangeStart(range: HistoryRange): Date {
  const days = Number.parseInt(range, 10);

  const start = new Date();

  start.setDate(start.getDate() - days);

  return start;
}

function filterPointsByRange(
  points: EloPoint[],
  range: HistoryRange,
): EloPoint[] {
  const start = getRangeStart(range);

  return points.filter((point) => new Date(point.timestamp) >= start);
}

function filterMatchesByRange(
  matches: MatchSummary[],
  range: HistoryRange,
): MatchSummary[] {
  const start = getRangeStart(range);

  return matches.filter((match) => new Date(match.startedAt) >= start);
}

export function PlayerHistoryPanel({
  player,
  onClose,
}: PlayerHistoryPanelProps) {
  const [range, setRange] = useState<HistoryRange>("180d");
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(false);

  const analyticsRegionId = useId();

  const { data, isLoading, isFetching, error, refetch } = usePlayerHistory(
    player.profile_id,
    {
      days: 180,
    },
  );

  const career = useMemo(() => getMatchmakingCareerSummary(player), [player]);

  const filteredPoints = useMemo(
    () => filterPointsByRange(data?.points ?? [], range),
    [data?.points, range],
  );

  const filteredMatches = useMemo(
    () => filterMatchesByRange(data?.matches ?? [], range),
    [data?.matches, range],
  );

  const analytics = useMemo(
    () =>
      calculatePlayerAnalytics({
        points: filteredPoints,
        matches: filteredMatches,
        career,
      }),
    [career, filteredMatches, filteredPoints],
  );

  function handleClose() {
    setIsAnalyticsExpanded(false);
    onClose();
  }

  return (
    <section
      aria-labelledby="player-history-heading"
      className="space-y-6 rounded-2xl border border-black/10 bg-black/[0.02] p-4 sm:p-6 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Swords className="size-5 shrink-0" aria-hidden="true" />

            <p className="text-sm font-medium text-black/55 dark:text-white/55">
              Matchmaking ELO history
            </p>
          </div>

          <h2
            id="player-history-heading"
            className="mt-2 text-2xl font-bold tracking-tight break-words sm:text-3xl"
          >
            {player.name}
          </h2>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-black/55 dark:text-white/55">
            <span>Profile #{player.profile_id}</span>

            {career.currentElo !== null && (
              <span>Matchmaking ELO: {career.currentElo.toLocaleString()}</span>
            )}

            {career.games > 0 && (
              <span>
                {career.wins.toLocaleString()} wins ·{" "}
                {career.losses.toLocaleString()} losses
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className={[
            "inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-black/10 transition-colors",
            "hover:bg-black/5",
            "focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:outline-none",
            "dark:border-white/10 dark:hover:bg-white/10",
            "dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-black",
          ].join(" ")}
          aria-label={`Close ${player.name} history`}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </header>

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
              <p className="font-medium">Loading matchmaking ELO history</p>

              <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                Preparing the player&apos;s ELO trail and recent results…
              </p>
            </div>
          </div>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-red-500/30 p-6 text-center"
        >
          <AlertCircle className="size-8 text-red-500" aria-hidden="true" />

          <h3 className="mt-3 font-semibold">
            ELO history could not be loaded
          </h3>

          <p className="mt-1 max-w-md text-sm break-words text-black/55 dark:text-white/55">
            {error.message}
          </p>

          <button
            type="button"
            onClick={() => void refetch()}
            className={[
              "mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-black px-4 py-2",
              "text-sm font-medium text-white transition hover:bg-black/80",
              "focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:outline-none",
              "dark:bg-white dark:text-black dark:hover:bg-white/80",
              "dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-black",
            ].join(" ")}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h3 className="text-lg font-semibold">
                Matchmaking ELO progression
              </h3>

              <p className="text-sm text-black/55 dark:text-white/55">
                {filteredPoints.length.toLocaleString()} history points shown
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              {isFetching && (
                <p
                  role="status"
                  aria-live="polite"
                  className="text-xs text-black/45 dark:text-white/45"
                >
                  Refreshing ELO history…
                </p>
              )}

              <HistoryRangeSelector value={range} onChange={setRange} />
            </div>
          </div>

          {filteredPoints.length === 0 ? (
            <div className="flex min-h-72 items-center justify-center rounded-xl border border-dashed border-black/15 p-6 text-center dark:border-white/15">
              <div>
                <h3 className="font-semibold">No ELO history in this range</h3>

                <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                  Try selecting a longer period to view more of this
                  player&apos;s ELO trail.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-black/10 bg-white p-2 sm:p-5 dark:border-white/10 dark:bg-black/10">
              <EloHistoryChart points={filteredPoints} />
            </div>
          )}

          <section
            aria-labelledby={`${analyticsRegionId}-heading`}
            className="space-y-4"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3
                  id={`${analyticsRegionId}-heading`}
                  className="text-lg font-semibold"
                >
                  Player analytics
                </h3>

                <p className="text-sm text-black/55 dark:text-white/55">
                  Performance insights for the selected history range.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsAnalyticsExpanded((currentValue) => !currentValue)
                }
                aria-expanded={isAnalyticsExpanded}
                aria-controls={analyticsRegionId}
                className={[
                  "inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-black/10 px-3 py-2",
                  "text-sm font-medium transition hover:bg-black/5 sm:self-auto",
                  "focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:outline-none",
                  "dark:border-white/10 dark:hover:bg-white/10",
                  "dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-black",
                ].join(" ")}
              >
                {isAnalyticsExpanded ? (
                  <>
                    Show less
                    <ChevronUp className="size-4" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    View all analytics
                    <ChevronDown className="size-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>

            <div id={analyticsRegionId}>
              <div
                className={
                  isAnalyticsExpanded
                    ? undefined
                    : "max-h-36 overflow-hidden sm:max-h-40"
                }
              >
                <PlayerAnalyticsCards analytics={analytics} />
              </div>

              {!isAnalyticsExpanded && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none -mt-12 h-12 bg-gradient-to-t from-[#fafafa] to-transparent dark:from-[#101010]"
                />
              )}

              {isAnalyticsExpanded && (
                <div className="mt-6 space-y-6">
                  <CivilisationAnalyticsPanel
                    analytics={analytics.civilisations}
                  />

                  <OpponentAnalyticsPanel analytics={analytics.opponents} />
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="recent-games-heading">
            <div className="mb-3">
              <h3 id="recent-games-heading" className="text-lg font-semibold">
                Recent games
              </h3>

              <p className="text-sm text-black/55 dark:text-white/55">
                Matchmaking ELO changes from the latest games in the selected
                range.
              </p>
            </div>

            {filteredMatches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/15 p-8 text-center dark:border-white/15">
                <p className="font-medium">No recent games in this range</p>

                <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                  Try selecting a longer period to view more matchmaking games.
                </p>
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
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
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

                            <span className="font-medium break-words">
                              {match.opponentName
                                ? `vs ${match.opponentName}`
                                : "Opponent unavailable"}
                            </span>
                          </div>

                          <p className="mt-1 text-sm break-words text-black/55 dark:text-white/55">
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

                        <div className="shrink-0 text-left sm:text-right">
                          <p className="font-semibold tabular-nums">
                            {match.ratingAfter.toLocaleString()} ELO
                          </p>

                          <p
                            className={[
                              "text-sm font-medium tabular-nums",
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
          </section>
        </>
      )}
    </section>
  );
}
