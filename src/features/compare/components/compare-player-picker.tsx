"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, UserRound, X } from "lucide-react";

import { usePlayerSearch } from "@/features/player";
import type { Aoe4WorldPlayer } from "@/services/aoe4world";

const MIN_SEARCH_LENGTH = 3;
const MAX_SEARCH_LENGTH = 50;

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
  const [isResultsOpen, setIsResultsOpen] = useState(false);

  const containerRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const resultsRegionId = useId();

  const { data, isSearching, isDebouncing, error } = usePlayerSearch(query);

  const trimmedQuery = query.trim();
  const hasValidQuery = trimmedQuery.length >= MIN_SEARCH_LENGTH;

  const results = (data ?? [])
    .filter((result) => result.profile_id !== excludedPlayerId)
    .slice(0, 8);

  const shouldShowResults =
    isResultsOpen && hasValidQuery && !isSearching && !isDebouncing && !error;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Node && !containerRef.current?.contains(target)) {
        setIsResultsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !isResultsOpen) {
        return;
      }

      setIsResultsOpen(false);
      inputRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isResultsOpen]);

  function handleSelect(selectedPlayer: Aoe4WorldPlayer) {
    onSelect(selectedPlayer);
    setQuery("");
    setIsResultsOpen(false);
  }

  function handleClear() {
    onClear();
    setQuery("");
    setIsResultsOpen(false);
    inputRef.current?.focus();
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setIsResultsOpen(true);
  }

  function handleFocus() {
    if (hasValidQuery) {
      setIsResultsOpen(true);
    }
  }

  return (
    <section
      ref={containerRef}
      aria-labelledby={`${resultsRegionId}-label`}
      className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            id={`${resultsRegionId}-label`}
            className="text-sm font-medium text-black/50 dark:text-white/50"
          >
            {label}
          </p>

          {player ? (
            <div className="mt-1">
              <h2 className="text-xl font-semibold break-words">
                {player.name}
              </h2>

              <p className="text-sm text-black/55 dark:text-white/55">
                Profile #{player.profile_id.toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2 text-black/55 dark:text-white/55">
              <UserRound className="size-5 shrink-0" aria-hidden="true" />
              <span>No player selected</span>
            </div>
          )}
        </div>

        {player && (
          <button
            type="button"
            onClick={handleClear}
            className={[
              "inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-black/10 transition",
              "hover:bg-black/5",
              "focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:outline-none",
              "dark:border-white/10 dark:hover:bg-white/10",
              "dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-black",
            ].join(" ")}
            aria-label={`Remove ${player.name} from ${label.toLowerCase()}`}
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
          ref={inputRef}
          type="search"
          value={query}
          maxLength={MAX_SEARCH_LENGTH}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={handleFocus}
          placeholder={`Search for ${label.toLowerCase()}`}
          aria-label={`${label} search`}
          className={[
            "w-full rounded-lg border border-black/10 bg-black/[0.02] py-2.5 pr-3 pl-10 text-sm transition outline-none",
            "focus:border-black/30 focus:ring-4 focus:ring-black/5",
            "dark:border-white/10 dark:bg-white/5 dark:focus:border-white/30 dark:focus:ring-white/5",
          ].join(" ")}
        />
      </div>

      {isResultsOpen && hasValidQuery && isSearching && (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 text-sm text-black/50 dark:text-white/50"
        >
          Searching players…
        </p>
      )}

      {isResultsOpen && hasValidQuery && !isSearching && error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-500/25 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-400"
        >
          Player search failed. Please try again.
        </p>
      )}

      {shouldShowResults && results.length === 0 && (
        <p className="mt-3 text-sm text-black/50 dark:text-white/50">
          No matching players found.
        </p>
      )}

      {shouldShowResults && results.length > 0 && (
        <div
          id={resultsRegionId}
          className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-black/10 dark:border-white/10"
        >
          <div className="divide-y divide-black/10 dark:divide-white/10">
            {results.map((result) => {
              const matchmakingElo = result.leaderboards?.rm_1v1_elo?.rating;

              return (
                <button
                  key={result.profile_id}
                  type="button"
                  onClick={() => handleSelect(result)}
                  className={[
                    "flex min-h-16 w-full items-center justify-between gap-4 p-3 text-left transition",
                    "hover:bg-black/5",
                    "focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:outline-none focus-visible:ring-inset",
                    "dark:hover:bg-white/5 dark:focus-visible:ring-white/50",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{result.name}</p>

                    <p className="text-xs text-black/50 dark:text-white/50">
                      Profile #{result.profile_id.toLocaleString()}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-semibold tabular-nums">
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
