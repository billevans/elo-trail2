"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import type { Aoe4WorldPlayer } from "@/services/aoe4world";

import { usePlayerSearch } from "../hooks/use-player-search";

import { PlayerCard } from "./player-card";

const MIN_SEARCH_LENGTH = 3;
const MAX_SEARCH_LENGTH = 50;

interface PlayerSearchProps {
  selectedPlayer: Aoe4WorldPlayer | null;
  onSelectPlayer: (player: Aoe4WorldPlayer | null) => void;
}

export function PlayerSearch({
  selectedPlayer,
  onSelectPlayer,
}: PlayerSearchProps) {
  const [query, setQuery] = useState("");
  const [isResultsOpen, setIsResultsOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const { data, isSearching, isDebouncing, error } = usePlayerSearch(query);

  const trimmedQuery = query.trim();
  const hasValidQuery = trimmedQuery.length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        !searchContainerRef.current?.contains(target)
      ) {
        setIsResultsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !isResultsOpen) {
        return;
      }

      setIsResultsOpen(false);
      searchInputRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isResultsOpen]);

  function handleSelectPlayer(player: Aoe4WorldPlayer) {
    onSelectPlayer(player);
    setQuery(player.name);
    setIsResultsOpen(false);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setIsResultsOpen(true);

    /*
     * Once the user edits the query, the previous player panel
     * is no longer the active search context.
     */
    onSelectPlayer(null);
  }

  function handleSearchFocus() {
    if (hasValidQuery) {
      setIsResultsOpen(true);
    }
  }

  const shouldShowResults =
    isResultsOpen && hasValidQuery && !isDebouncing && !isSearching;

  return (
    <div ref={searchContainerRef} className="space-y-8">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-black/40 dark:text-white/40"
          aria-hidden="true"
        />

        <input
          ref={searchInputRef}
          type="search"
          value={query}
          maxLength={MAX_SEARCH_LENGTH}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={handleSearchFocus}
          placeholder="Search for an Age of Empires IV player"
          aria-label="Search players"
          className="w-full rounded-xl border border-black/10 bg-white py-3 pr-4 pl-12 shadow-sm transition outline-none focus:border-black/35 focus:ring-4 focus:ring-black/5 dark:border-white/10 dark:bg-white/5 dark:focus:border-white/35 dark:focus:ring-white/5"
        />
      </div>

      {isResultsOpen && hasValidQuery && isSearching && (
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-black/55 dark:text-white/55"
        >
          Searching players…
        </p>
      )}

      {isResultsOpen && hasValidQuery && !isSearching && error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/25 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-400"
        >
          Unable to search players. Please try again.
        </p>
      )}

      {shouldShowResults && !error && data && data.length > 0 && (
        <div id="player-search-results">
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
                onSelect={handleSelectPlayer}
              />
            ))}
          </div>
        </div>
      )}

      {shouldShowResults && !error && data && data.length === 0 && (
        <div
          id="player-search-results"
          className="rounded-xl border border-dashed border-black/15 p-8 text-center dark:border-white/15"
        >
          <p className="font-medium">No players found</p>

          <p className="mt-1 text-sm text-black/55 dark:text-white/55">
            Check the spelling or try another player name.
          </p>
        </div>
      )}
    </div>
  );
}
