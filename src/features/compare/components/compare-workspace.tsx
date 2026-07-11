"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { usePlayerProfile } from "@/features/player";
import type { Aoe4WorldPlayer } from "@/services/aoe4world";

import { ComparePlayerPicker } from "./compare-player-picker";
import { ComparisonLoadingState } from "./comparison-loading-state";
import { PlayerComparisonPanel } from "./player-comparison-panel";

function parseProfileId(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }

  const profileId = Number(value);

  return Number.isSafeInteger(profileId) && profileId > 0 ? profileId : null;
}

export function CompareWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const comparisonRef = useRef<HTMLDivElement | null>(null);

  const playerOneId = parseProfileId(searchParams.get("p1"));

  const playerTwoId = parseProfileId(searchParams.get("p2"));

  const [selectedPlayerOne, setSelectedPlayerOne] =
    useState<Aoe4WorldPlayer | null>(null);

  const [selectedPlayerTwo, setSelectedPlayerTwo] =
    useState<Aoe4WorldPlayer | null>(null);

  const playerOneQuery = usePlayerProfile(playerOneId);

  const playerTwoQuery = usePlayerProfile(playerTwoId);

  const playerOne = useMemo(
    () =>
      selectedPlayerOne?.profile_id === playerOneId
        ? selectedPlayerOne
        : (playerOneQuery.data ?? null),
    [playerOneId, playerOneQuery.data, selectedPlayerOne],
  );

  const playerTwo = useMemo(
    () =>
      selectedPlayerTwo?.profile_id === playerTwoId
        ? selectedPlayerTwo
        : (playerTwoQuery.data ?? null),
    [playerTwoId, playerTwoQuery.data, selectedPlayerTwo],
  );

  const isRestoringSharedPlayers =
    (playerOneId !== null && playerOneQuery.isLoading) ||
    (playerTwoId !== null && playerTwoQuery.isLoading);

  useEffect(() => {
    if (!playerOne || !playerTwo) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      comparisonRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [playerOne, playerTwo]);

  function updateUrl(
    nextPlayerOneId: number | null,
    nextPlayerTwoId: number | null,
  ) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextPlayerOneId === null) {
      params.delete("p1");
    } else {
      params.set("p1", String(nextPlayerOneId));
    }

    if (nextPlayerTwoId === null) {
      params.delete("p2");
    } else {
      params.set("p2", String(nextPlayerTwoId));
    }

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function selectPlayerOne(player: Aoe4WorldPlayer) {
    setSelectedPlayerOne(player);

    updateUrl(player.profile_id, playerTwoId);
  }

  function selectPlayerTwo(player: Aoe4WorldPlayer) {
    setSelectedPlayerTwo(player);

    updateUrl(playerOneId, player.profile_id);
  }

  function clearPlayerOne() {
    setSelectedPlayerOne(null);

    updateUrl(null, playerTwoId);
  }

  function clearPlayerTwo() {
    setSelectedPlayerTwo(null);

    updateUrl(playerOneId, null);
  }

  function swapPlayers() {
    setSelectedPlayerOne(playerTwo);
    setSelectedPlayerTwo(playerOne);

    updateUrl(playerTwo?.profile_id ?? null, playerOne?.profile_id ?? null);
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <ComparePlayerPicker
          label="Player one"
          player={playerOne}
          excludedPlayerId={playerTwo?.profile_id}
          onSelect={selectPlayerOne}
          onClear={clearPlayerOne}
        />

        <ComparePlayerPicker
          label="Player two"
          player={playerTwo}
          excludedPlayerId={playerOne?.profile_id}
          onSelect={selectPlayerTwo}
          onClear={clearPlayerTwo}
        />
      </div>

      {isRestoringSharedPlayers && (
        <ComparisonLoadingState message="Restoring shared player profiles…" />
      )}

      {(playerOneQuery.error || playerTwoQuery.error) && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/25 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-400"
        >
          One of the shared player profiles could not be restored. Remove that
          player and search again.
        </div>
      )}

      {!isRestoringSharedPlayers && playerOne && playerTwo && (
        <div ref={comparisonRef} className="scroll-mt-6">
          <PlayerComparisonPanel
            playerOne={playerOne}
            playerTwo={playerTwo}
            onSwap={swapPlayers}
          />
        </div>
      )}

      {!isRestoringSharedPlayers && (!playerOne || !playerTwo) && (
        <div className="rounded-2xl border border-dashed border-black/15 p-10 text-center dark:border-white/15">
          <h2 className="text-xl font-semibold">Select two players</h2>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-black/55 dark:text-white/55">
            Choose two Age of Empires IV profiles to compare their underlying
            ranked matchmaking ELO over the same period.
          </p>
        </div>
      )}
    </div>
  );
}
