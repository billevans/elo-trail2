"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import type { Aoe4WorldPlayer } from "@/services/aoe4world";

import { usePlayerSearch } from "../hooks/use-player-search";

import { PlayerCard } from "./player-card";
import { PlayerHistoryPanel } from "./player-history-panel";

export function PlayerSearch() {
  const [query, setQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Aoe4WorldPlayer | null>(
    null,
  );

  const { data, isLoading, error } = usePlayerSearch(query);

  return (
    <div className="space-y-8">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-black/40 dark:text-white/40"
          aria-hidden="true"
        />

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for an Age of Empires IV player"
          aria-label="Search players"
          className="w-full rounded-xl border border-black/10 bg-white py-3 pr-4 pl-12 shadow-sm transition outline-none focus:border-black/35 focus:ring-4 focus:ring-black/5 dark:border-white/10 dark:bg-white/5 dark:focus:border-white/35 dark:focus:ring-white/5"
        />
      </div>

      {isLoading && (
        <p className="text-sm text-black/55 dark:text-white/55">
          Searching players…
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/25 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-400"
        >
          Unable to search players. Please try again.
        </p>
      )}

      {data && data.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Search results</h2>

            <p className="text-sm text-black/55 dark:text-white/55">
              {data.length} {data.length === 1 ? "player" : "players"}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {data.map((player) => (
              <PlayerCard
                key={player.profile_id}
                player={player}
                isSelected={selectedPlayer?.profile_id === player.profile_id}
                onSelect={setSelectedPlayer}
              />
            ))}
          </div>
        </div>
      )}

      {data && data.length === 0 && query.trim().length >= 2 && !isLoading && (
        <div className="rounded-xl border border-dashed border-black/15 p-8 text-center dark:border-white/15">
          <p className="font-medium">No players found</p>

          <p className="mt-1 text-sm text-black/55 dark:text-white/55">
            Check the spelling or try another player name.
          </p>
        </div>
      )}

      {selectedPlayer && (
        <PlayerHistoryPanel
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
