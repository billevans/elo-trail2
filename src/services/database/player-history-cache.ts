import type { Prisma } from "@prisma/client";

import type { Aoe4WorldGame } from "@/services/aoe4world/history-types";
import type { HistoryLeaderboard } from "@/types/history";

import {
  PLAYER_HISTORY_CACHE_TTL_MS,
  PLAYER_HISTORY_CACHE_VERSION,
  PLAYER_HISTORY_RETENTION_DAYS,
} from "./history-cache-constants";
import type {
  CachedHistoryGames,
  HistoryCacheKey,
  HistoryCacheMetadata,
} from "./history-cache-types";
import {
  getCachedGameId,
  getCachedGameStartedAt,
  isAoe4WorldGame,
} from "./history-cache-validation";
import { prisma } from "./prisma";

function toMetadata(record: {
  id: string;
  profileId: number;
  leaderboard: string;
  historyDays: number;
  refreshedAt: Date;
  expiresAt: Date;
  newestGameAt: Date | null;
  oldestGameAt: Date | null;
  gameCount: number;
  dataVersion: string;
}): HistoryCacheMetadata {
  return {
    id: record.id,
    profileId: record.profileId,
    leaderboard: record.leaderboard,
    historyDays: record.historyDays,
    refreshedAt: record.refreshedAt,
    expiresAt: record.expiresAt,
    newestGameAt: record.newestGameAt,
    oldestGameAt: record.oldestGameAt,
    gameCount: record.gameCount,
    dataVersion: record.dataVersion,
  };
}

function getCacheState(
  expiresAt: Date,
  dataVersion: string,
): "fresh" | "stale" {
  if (dataVersion !== PLAYER_HISTORY_CACHE_VERSION) {
    return "stale";
  }

  return expiresAt.getTime() > Date.now() ? "fresh" : "stale";
}

function normaliseKey(key: HistoryCacheKey): HistoryCacheKey {
  if (!Number.isSafeInteger(key.profileId) || key.profileId <= 0) {
    throw new Error("A valid positive player profile ID is required.");
  }

  if (
    !Number.isSafeInteger(key.historyDays) ||
    key.historyDays <= 0 ||
    key.historyDays > 180
  ) {
    throw new Error("History days must be between 1 and 180.");
  }

  return key;
}

export async function readCachedPlayerGames(
  key: HistoryCacheKey,
): Promise<CachedHistoryGames> {
  const normalised = normaliseKey(key);

  const cache = await prisma.playerHistoryCache.findUnique({
    where: {
      profileId_leaderboard_historyDays: {
        profileId: normalised.profileId,
        leaderboard: normalised.leaderboard,
        historyDays: normalised.historyDays,
      },
    },

    include: {
      games: {
        orderBy: {
          startedAt: "asc",
        },
      },
    },
  });

  if (!cache) {
    return {
      state: "miss",
      metadata: null,
      games: [],
    };
  }

  const games = cache.games.reduce<Aoe4WorldGame[]>((validGames, record) => {
    const value: unknown = record.data;

    if (isAoe4WorldGame(value)) {
      validGames.push(value);
    }

    return validGames;
  }, []);

  return {
    state: getCacheState(cache.expiresAt, cache.dataVersion),
    metadata: toMetadata(cache),
    games,
  };
}

export async function writeCachedPlayerGames(
  key: HistoryCacheKey,
  games: Aoe4WorldGame[],
): Promise<HistoryCacheMetadata> {
  const normalised = normaliseKey(key);

  const now = new Date();

  const expiresAt = new Date(now.getTime() + PLAYER_HISTORY_CACHE_TTL_MS);

  const retentionStart = new Date(now);

  retentionStart.setUTCDate(
    retentionStart.getUTCDate() - PLAYER_HISTORY_RETENTION_DAYS,
  );

  const validGames = games
    .map((game) => ({
      game,
      gameId: getCachedGameId(game),
      startedAt: getCachedGameStartedAt(game),
    }))
    .filter(
      (
        entry,
      ): entry is {
        game: Aoe4WorldGame;
        gameId: string;
        startedAt: Date;
      } => entry.startedAt !== null && entry.startedAt >= retentionStart,
    );

  const orderedGames = [...validGames].sort(
    (left, right) => left.startedAt.getTime() - right.startedAt.getTime(),
  );

  const oldestGameAt = orderedGames[0]?.startedAt ?? null;

  const newestGameAt = orderedGames.at(-1)?.startedAt ?? null;

  const cache = await prisma.$transaction(
    async (transaction) => {
      const record = await transaction.playerHistoryCache.upsert({
        where: {
          profileId_leaderboard_historyDays: {
            profileId: normalised.profileId,
            leaderboard: normalised.leaderboard,
            historyDays: normalised.historyDays,
          },
        },

        create: {
          profileId: normalised.profileId,
          leaderboard: normalised.leaderboard,
          historyDays: normalised.historyDays,
          refreshedAt: now,
          expiresAt,
          newestGameAt,
          oldestGameAt,
          gameCount: 0,
          dataVersion: PLAYER_HISTORY_CACHE_VERSION,
        },

        update: {
          refreshedAt: now,
          expiresAt,
          newestGameAt,
          oldestGameAt,
          gameCount: 0,
          dataVersion: PLAYER_HISTORY_CACHE_VERSION,
        },
      });

      /*
       * Batch 8B performs a full refresh whenever the
       * persistent cache is missing or stale. Replacing
       * the existing rows is substantially faster than
       * issuing one upsert query for every game.
       */
      await transaction.cachedPlayerGame.deleteMany({
        where: {
          cacheId: record.id,
        },
      });

      if (orderedGames.length > 0) {
        await transaction.cachedPlayerGame.createMany({
          data: orderedGames.map((entry) => ({
            cacheId: record.id,
            gameId: entry.gameId,
            profileId: normalised.profileId,
            leaderboard: normalised.leaderboard,
            startedAt: entry.startedAt,
            data: entry.game as unknown as Prisma.InputJsonValue,
          })),

          /*
           * getPlayerGames already deduplicates games, but
           * this safely ignores any remaining duplicate
           * cacheId/gameId combinations.
           */
          skipDuplicates: true,
        });
      }

      const actualGameCount = await transaction.cachedPlayerGame.count({
        where: {
          cacheId: record.id,
        },
      });

      return transaction.playerHistoryCache.update({
        where: {
          id: record.id,
        },

        data: {
          gameCount: actualGameCount,
          oldestGameAt,
          newestGameAt,
          refreshedAt: now,
          expiresAt,
          dataVersion: PLAYER_HISTORY_CACHE_VERSION,
        },
      });
    },
    {
      /*
       * Prisma defaults interactive transactions to five
       * seconds. The bulk strategy should finish well below
       * this, while 15 seconds provides a safe allowance for
       * a cold Supabase connection.
       */
      maxWait: 5_000,
      timeout: 15_000,
    },
  );

  return toMetadata(cache);
}

export async function touchPlayerHistoryCache(
  key: HistoryCacheKey,
): Promise<HistoryCacheMetadata | null> {
  const normalised = normaliseKey(key);

  const now = new Date();

  const expiresAt = new Date(now.getTime() + PLAYER_HISTORY_CACHE_TTL_MS);

  try {
    const cache = await prisma.playerHistoryCache.update({
      where: {
        profileId_leaderboard_historyDays: {
          profileId: normalised.profileId,
          leaderboard: normalised.leaderboard,
          historyDays: normalised.historyDays,
        },
      },

      data: {
        refreshedAt: now,
        expiresAt,
        dataVersion: PLAYER_HISTORY_CACHE_VERSION,
      },
    });

    return toMetadata(cache);
  } catch (error) {
    console.error("TOUCH CACHE FAILED", error);
    return null;
  }
}

export async function deletePlayerHistoryCache(
  key: HistoryCacheKey,
): Promise<void> {
  const normalised = normaliseKey(key);

  await prisma.playerHistoryCache.deleteMany({
    where: {
      profileId: normalised.profileId,
      leaderboard: normalised.leaderboard,
      historyDays: normalised.historyDays,
    },
  });
}

export function createHistoryCacheKey(
  profileId: number,
  leaderboard: HistoryLeaderboard,
  historyDays: number,
): HistoryCacheKey {
  return normaliseKey({
    profileId,
    leaderboard,
    historyDays,
  });
}
