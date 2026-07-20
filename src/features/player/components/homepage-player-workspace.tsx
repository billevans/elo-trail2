"use client";

import { useEffect, useRef, useState } from "react";

import { HomepageLeaderboard } from "@/features/leaderboard/components/homepage-leaderboard";
import type { Aoe4WorldPlayer } from "@/services/aoe4world";

import { PlayerHistoryPanel } from "./player-history-panel";
import { PlayerSearch } from "./player-search";

export function HomepagePlayerWorkspace() {
  const [selectedPlayer, setSelectedPlayer] = useState<Aoe4WorldPlayer | null>(
    null,
  );

  const historyPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedPlayer) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      historyPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [selectedPlayer]);

  return (
    <div className="space-y-10">
      <PlayerSearch
        selectedPlayer={selectedPlayer}
        onSelectPlayer={setSelectedPlayer}
      />

      <HomepageLeaderboard />

      {selectedPlayer && (
        <div ref={historyPanelRef} className="scroll-mt-6">
          <PlayerHistoryPanel
            player={selectedPlayer}
            onClose={() => {
              setSelectedPlayer(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
