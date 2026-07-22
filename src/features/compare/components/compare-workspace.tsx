"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
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

  const sharedPlayerError =
    playerOneQuery.error ?? playerTwoQuery.error ?? null;

  useEffect(() => {
    if (!playerOne || !playerTwo) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      comparisonRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
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

  function retrySharedPlayers() {
    const requests: Promise<unknown>[] = [];

    if (playerOneId !== null && playerOneQuery.error) {
      requests.push(playerOneQuery.refetch());
    }

    if (playerTwoId !== null && playerTwoQuery.error) {
      requests.push(playerTwoQuery.refetch());
    }

    void Promise.all(requests);
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

      {!isRestoringSharedPlayers && sharedPlayerError && (
        <section
          role="alert"
          aria-labelledby="shared-profile-error-heading"
          className="flex flex-col items-center rounded-2xl border border-dashed border-red-500/30 p-6 text-center"
        >
          <AlertCircle className="size-8 text-red-500" aria-hidden="true" />

          <h2 id="shared-profile-error-heading" className="mt-3 font-semibold">
            Shared comparison could not be restored
          </h2>

          <p className="mt-1 max-w-lg text-sm break-words text-black/55 dark:text-white/55">
            One or more player profiles in this comparison link could not be
            loaded. Try restoring them again or remove the affected player and
            search manually.
          </p>

          <button
            type="button"
            onClick={retrySharedPlayers}
            className={[
              "mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 py-2",
              "text-sm font-medium text-white transition hover:bg-black/80",
              "focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:outline-none",
              "dark:bg-white dark:text-black dark:hover:bg-white/80",
              "dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-black",
            ].join(" ")}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </button>
        </section>
      )}

      {!isRestoringSharedPlayers &&
        !sharedPlayerError &&
        playerOne &&
        playerTwo && (
          <div ref={comparisonRef} className="scroll-mt-6">
            <PlayerComparisonPanel
              playerOne={playerOne}
              playerTwo={playerTwo}
              onSwap={swapPlayers}
            />
          </div>
        )}

      {!isRestoringSharedPlayers &&
        !sharedPlayerError &&
        (!playerOne || !playerTwo) && (
          <section
            aria-labelledby="comparison-empty-heading"
            className="rounded-2xl border border-dashed border-black/15 p-6 text-center sm:p-10 dark:border-white/15"
          >
            <h2 id="comparison-empty-heading" className="text-xl font-semibold">
              Select two players
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-black/55 dark:text-white/55">
              Choose two Age of Empires IV profiles to compare their underlying
              matchmaking ELO over the same period.
            </p>

            <p className="mx-auto mt-2 max-w-xl text-xs text-black/45 dark:text-white/45">
              The same profile cannot be selected in both positions.
            </p>
          </section>
        )}
    </div>
  );
}
