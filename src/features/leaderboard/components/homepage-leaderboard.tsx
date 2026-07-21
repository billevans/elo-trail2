"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Crown, LoaderCircle, RefreshCw } from "lucide-react";

import type {
  HomepageLeaderboardApiResponse,
  HomepageLeaderboardData,
  HomepageLeaderboardPlayer,
} from "../types/homepage-leaderboard";

import { HomepageLeaderboardChart } from "./homepage-leaderboard-chart";

async function fetchHomepageLeaderboard(): Promise<HomepageLeaderboardData> {
  const response = await fetch("/api/homepage-leaderboard", {
    headers: {
      Accept: "application/json",
    },
  });

  const payload = (await response.json()) as HomepageLeaderboardApiResponse;

  if (!response.ok || !payload.data) {
    throw new Error(
      payload.error?.message ?? "The leaderboard could not be loaded.",
    );
  }

  return payload.data;
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

interface HomepageLeaderboardProps {
  selectedProfileId: number | null;
  onSelectPlayer: (player: HomepageLeaderboardPlayer) => void;
}

export function HomepageLeaderboard({
  selectedProfileId,
  onSelectPlayer,
}: HomepageLeaderboardProps) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["homepage-leaderboard"],

    queryFn: fetchHomepageLeaderboard,

    staleTime: 60 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    retry: 1,

    refetchOnWindowFocus: false,

    refetchOnReconnect: false,

    refetchInterval: false,
  });

  if (isLoading) {
    return (
      <section
        aria-labelledby="top-players-loading-heading"
        aria-busy="true"
        className="flex min-h-72 items-center justify-center rounded-2xl border border-black/10 bg-black/[0.01] px-6 dark:border-white/10 dark:bg-white/[0.02]"
      >
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-3 text-center text-black/55 dark:text-white/55"
        >
          <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />

          <div>
            <h2
              id="top-players-loading-heading"
              className="font-semibold text-black dark:text-white"
            >
              Loading daily leaderboard
            </h2>

            <p className="mt-1 text-sm">
              Retrieving the latest matchmaking ELO snapshot…
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section
        aria-labelledby="top-players-error-heading"
        className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-red-500/30 p-6 text-center"
      >
        <AlertCircle className="size-8 text-red-500" aria-hidden="true" />

        <h2 id="top-players-error-heading" className="mt-3 font-semibold">
          Daily leaderboard unavailable
        </h2>

        <p className="mt-1 max-w-md text-sm text-black/55 dark:text-white/55">
          The latest daily snapshot could not be loaded. Player search remains
          available above.
        </p>

        <button
          type="button"
          onClick={() => void refetch()}
          className={[
            "mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 py-2",
            "text-sm font-medium text-white transition hover:bg-black/80",
            "focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:outline-none",
            "dark:bg-white dark:text-black dark:hover:bg-white/80",
            "dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-black",
          ].join(" ")}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </button>
      </section>
    );
  }

  if (data.players.length === 0) {
    return (
      <section
        aria-labelledby="top-players-empty-heading"
        className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 p-6 text-center dark:border-white/15"
      >
        <Crown
          className="size-8 text-black/35 dark:text-white/35"
          aria-hidden="true"
        />

        <h2 id="top-players-empty-heading" className="mt-3 font-semibold">
          No leaderboard players available
        </h2>

        <p className="mt-1 max-w-md text-sm text-black/55 dark:text-white/55">
          The daily snapshot loaded successfully, but it does not currently
          contain any players.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="top-players-heading" className="space-y-5">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="size-5 shrink-0" aria-hidden="true" />

            <h2
              id="top-players-heading"
              className="text-2xl font-bold tracking-tight"
            >
              Top matchmaking ELO players
            </h2>
          </div>

          <p className="mt-1 max-w-2xl text-sm text-black/55 dark:text-white/55">
            Ninety-day matchmaking ELO histories for the current top ten RM 1v1
            players.
          </p>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className="text-xs text-black/45 dark:text-white/45">
            Updated {formatUpdatedAt(data.generatedAt)}
          </p>

          {isFetching && (
            <p
              role="status"
              aria-live="polite"
              className="mt-1 text-xs text-black/45 dark:text-white/45"
            >
              Refreshing leaderboard…
            </p>
          )}
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white p-2 shadow-sm sm:p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <HomepageLeaderboardChart players={data.players} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {data.players.map((player) => {
          const isSelected = selectedProfileId === player.profileId;

          return (
            <button
              key={player.profileId}
              type="button"
              onClick={() => onSelectPlayer(player)}
              aria-pressed={isSelected}
              aria-label={`View ${player.name} matchmaking ELO history`}
              className={[
                "flex min-h-24 w-full items-center justify-between gap-4 rounded-xl border bg-white p-3 text-left transition",
                "hover:bg-black/[0.03]",
                "focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:outline-none",
                "dark:bg-white/5 dark:hover:bg-white/10",
                "dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-black",
                isSelected
                  ? "border-black/40 ring-2 ring-black/10 dark:border-white/50 dark:ring-white/10"
                  : "border-black/10 dark:border-white/10",
              ].join(" ")}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold text-black/45 dark:text-white/45">
                    Rank #{player.rank}
                  </p>

                  {isSelected && (
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-[0.6875rem] font-medium text-black/60 dark:bg-white/10 dark:text-white/65">
                      Selected
                    </span>
                  )}
                </div>

                <h3 className="mt-1 truncate font-semibold">{player.name}</h3>

                <p className="mt-1 text-xs text-black/45 dark:text-white/45">
                  {player.gamesInWindow.toLocaleString()} games in 90 days
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xl font-bold tabular-nums">
                  {player.currentElo.toLocaleString()}
                </p>

                <p className="text-xs text-black/45 dark:text-white/45">ELO</p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-black/40 dark:text-white/40">
        Data source: AoE4World. ELO Trail is not affiliated with AoE4World,
        Microsoft, or World&apos;s Edge.
      </p>
    </section>
  );
}
