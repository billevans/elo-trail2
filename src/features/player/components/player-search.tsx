"use client";

import { useState } from "react";

import { usePlayerSearch } from "../hooks/use-player-search";

import { PlayerCard } from "./player-card";

export function PlayerSearch() {
  const [query, setQuery] = useState("");

  const { data, isLoading, error } = usePlayerSearch(query);

  return (
    <div className="space-y-6">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search Age of Empires IV player..."
        className="w-full rounded-md border px-4 py-2"
      />

      {isLoading && <p>Searching...</p>}

      {error && <p>Unable to search players.</p>}

      <div className="grid gap-4">
        {data?.map((player) => (
          <PlayerCard key={player.profile_id} player={player} />
        ))}
      </div>
    </div>
  );
}
