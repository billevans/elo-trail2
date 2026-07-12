"use client";

import { useQuery } from "@tanstack/react-query";
import { Crown, LoaderCircle } from "lucide-react";

import type {
  HomepageLeaderboardApiResponse,
  HomepageLeaderboardData,
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

export function HomepageLeaderboard() {
  const { data, isLoading, error } = useQuery({
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
        role="status"
        aria-live="polite"
        className="flex min-h-64 items-center justify-center rounded-2xl border border-black/10 dark:border-white/10"
      >
        <div className="flex items-center gap-3 text-black/55 dark:text-white/55">
          <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          Loading daily leaderboard…
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-2xl border border-dashed border-black/15 p-8 text-center dark:border-white/15">
        <h2 className="font-semibold">Daily leaderboard unavailable</h2>

        <p className="mt-1 text-sm text-black/55 dark:text-white/55">
          The latest daily snapshot could not be loaded. Player search remains
          available below.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="top-players-heading" className="space-y-5">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="size-5" aria-hidden="true" />

            <h2
              id="top-players-heading"
              className="text-2xl font-bold tracking-tight"
            >
              Top matchmaking ELO players
            </h2>
          </div>

          <p className="mt-1 text-sm text-black/55 dark:text-white/55">
            Ninety-day matchmaking ELO histories for the current top eight RM
            1v1 players.
          </p>
        </div>

        <p className="text-xs text-black/45 dark:text-white/45">
          Updated {formatUpdatedAt(data.generatedAt)}
        </p>
      </header>

      <div className="rounded-2xl border border-black/10 bg-white p-3 shadow-sm sm:p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <HomepageLeaderboardChart players={data.players} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.players.map((player) => (
          <article
            key={player.profileId}
            className="flex items-center justify-between gap-4 rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/5"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-black/45 dark:text-white/45">
                Rank #{player.rank}
              </p>

              <h3 className="truncate font-semibold">{player.name}</h3>

              <p className="text-xs text-black/45 dark:text-white/45">
                {player.gamesInWindow.toLocaleString()} games in 90 days
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-xl font-bold tabular-nums">
                {player.currentElo.toLocaleString()}
              </p>

              <p className="text-xs text-black/45 dark:text-white/45">ELO</p>
            </div>
          </article>
        ))}
      </div>

      <p className="text-xs text-black/40 dark:text-white/40">
        Data source: AoE4World. ELO Trail is not affiliated with AoE4World,
        Microsoft, or World&apos;s Edge.
      </p>
    </section>
  );
}
