"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { Aoe4WorldPlayer } from "@/services/aoe4world/types";

const SEARCH_DEBOUNCE_MS = 400;
const MIN_SEARCH_LENGTH = 3;
const MAX_SEARCH_LENGTH = 50;

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [delay, value]);

  return debouncedValue;
}

async function fetchPlayers(
  query: string,
  signal: AbortSignal,
): Promise<Aoe4WorldPlayer[]> {
  const response = await fetch(
    `/api/players/search?q=${encodeURIComponent(query)}`,
    {
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  const data = (await response.json()) as {
    players?: Aoe4WorldPlayer[];
    error?: {
      message?: string;
    };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Player search failed.");
  }

  return data.players ?? [];
}

export function usePlayerSearch(query: string) {
  const normalisedQuery = query.trim().slice(0, MAX_SEARCH_LENGTH);

  const debouncedQuery = useDebouncedValue(normalisedQuery, SEARCH_DEBOUNCE_MS);

  const isValidQuery =
    debouncedQuery.length >= MIN_SEARCH_LENGTH &&
    debouncedQuery.length <= MAX_SEARCH_LENGTH;

  return useQuery({
    queryKey: ["players", debouncedQuery.toLowerCase()],

    queryFn: ({ signal }) => fetchPlayers(debouncedQuery, signal),

    enabled: isValidQuery,

    staleTime: 5 * 60 * 1000,

    gcTime: 30 * 60 * 1000,

    retry: false,

    refetchOnWindowFocus: false,
  });
}
