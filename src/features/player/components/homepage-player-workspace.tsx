"use client";

import { useEffect, useRef, useState } from "react";

import { HomepageLeaderboard } from "@/features/leaderboard/components/homepage-leaderboard";
import type { HomepageLeaderboardPlayer } from "@/features/leaderboard/types/homepage-leaderboard";
import type { Aoe4WorldPlayer } from "@/services/aoe4world";

import { usePlayerProfile } from "../hooks/use-player-profile";

import { PlayerHistoryPanel } from "./player-history-panel";
import { PlayerSearch } from "./player-search";

export function HomepagePlayerWorkspace() {
  const [searchSelectedPlayer, setSearchSelectedPlayer] =
    useState<Aoe4WorldPlayer | null>(null);

  const [leaderboardProfileId, setLeaderboardProfileId] = useState<
    number | null
  >(null);

  const historyPanelRef = useRef<HTMLDivElement | null>(null);

  const {
    data: loadedPlayerProfile,
    isLoading: isPlayerProfileLoading,
    error: playerProfileError,
  } = usePlayerProfile(leaderboardProfileId);

  const selectedPlayer =
    leaderboardProfileId !== null
      ? (loadedPlayerProfile ?? null)
      : searchSelectedPlayer;

  useEffect(() => {
    if (!selectedPlayer) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      historyPanelRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [selectedPlayer]);

  function handleSearchPlayerSelect(player: Aoe4WorldPlayer | null) {
    setLeaderboardProfileId(null);
    setSearchSelectedPlayer(player);
  }

  function handleLeaderboardPlayerSelect(player: HomepageLeaderboardPlayer) {
    setSearchSelectedPlayer(null);
    setLeaderboardProfileId(player.profileId);
  }

  return (
    <div className="space-y-10">
      <PlayerSearch
        selectedPlayer={selectedPlayer}
        onSelectPlayer={handleSearchPlayerSelect}
      />

      <HomepageLeaderboard
        selectedProfileId={
          leaderboardProfileId ?? searchSelectedPlayer?.profile_id ?? null
        }
        onSelectPlayer={handleLeaderboardPlayerSelect}
      />

      {leaderboardProfileId !== null && isPlayerProfileLoading && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-black/10 p-4 text-sm text-black/55 dark:border-white/10 dark:text-white/55"
        >
          Loading player profile…
        </div>
      )}

      {leaderboardProfileId !== null && playerProfileError && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/25 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-400"
        >
          The selected player profile could not be loaded. Please try again.
        </div>
      )}

      {selectedPlayer && (
        <div ref={historyPanelRef} className="scroll-mt-6">
          <PlayerHistoryPanel
            player={selectedPlayer}
            onClose={() => {
              setLeaderboardProfileId(null);
              setSearchSelectedPlayer(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
