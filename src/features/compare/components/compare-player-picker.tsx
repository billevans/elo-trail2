"use client";

import { useState } from "react";
import { Search, UserRound, X } from "lucide-react";

import type { Aoe4WorldPlayer } from "@/services/aoe4world";
import { usePlayerSearch } from "@/features/player";

interface ComparePlayerPickerProps {
  label: string;
  player: Aoe4WorldPlayer | null;
  excludedPlayerId?: number;
  onSelect: (player: Aoe4WorldPlayer) => void;
  onClear: () => void;
}

export function ComparePlayerPicker({
  label,
  player,
  excludedPlayerId,
  onSelect,
  onClear,
}: ComparePlayerPickerProps) {
  const [query, setQuery] = useState("");

  const { data, isLoading, error } = usePlayerSearch(query);

  const results = (data ?? [])
    .filter((result) => result.profile_id !== excludedPlayerId)
    .slice(0, 8);

  function handleSelect(selectedPlayer: Aoe4WorldPlayer) {
    onSelect(selectedPlayer);
    setQuery("");
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-black/50 dark:text-white/50">
            {label}
          </p>

          {player ? (
            <div className="mt-1">
              <h2 className="text-xl font-semibold">{player.name}</h2>

              <p className="text-sm text-black/55 dark:text-white/55">
                Profile #{player.profile_id.toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2 text-black/55 dark:text-white/55">
              <UserRound className="size-5" aria-hidden="true" />

              <span>No player selected</span>
            </div>
          )}
        </div>

        {player && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-black/10 transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            aria-label={`Remove ${player.name}`}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="relative mt-4">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-black/40 dark:text-white/40"
          aria-hidden="true"
        />

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search players"
          aria-label={`${label} search`}
          className="w-full rounded-lg border border-black/10 bg-black/[0.02] py-2.5 pr-3 pl-10 text-sm transition outline-none focus:border-black/30 focus:ring-4 focus:ring-black/5 dark:border-white/10 dark:bg-white/5 dark:focus:border-white/30"
        />
      </div>

      {isLoading && (
        <p className="mt-3 text-sm text-black/50 dark:text-white/50">
          Searching…
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          Player search failed.
        </p>
      )}

      {query.trim().length >= 2 && !isLoading && results.length === 0 && (
        <p className="mt-3 text-sm text-black/50 dark:text-white/50">
          No matching players found.
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-black/10 dark:border-white/10">
          <div className="divide-y divide-black/10 dark:divide-white/10">
            {results.map((result) => {
              const matchmakingElo = result.leaderboards?.rm_1v1_elo?.rating;

              return (
                <button
                  key={result.profile_id}
                  type="button"
                  onClick={() => handleSelect(result)}
                  className="flex w-full items-center justify-between gap-4 p-3 text-left transition hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{result.name}</p>

                    <p className="text-xs text-black/50 dark:text-white/50">
                      Profile #{result.profile_id}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-semibold">
                      {typeof matchmakingElo === "number"
                        ? matchmakingElo.toLocaleString()
                        : "—"}
                    </p>

                    <p className="text-xs text-black/45 dark:text-white/45">
                      ELO
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
