import type { Prisma } from "@prisma/client";

import type { Aoe4WorldGame } from "@/services/aoe4world/history-types";
import type { HistoryLeaderboard } from "@/types/history";

import {
  PLAYER_HISTORY_CACHE_TTL_MS,
  PLAYER_HISTORY_CACHE_VERSION,
  PLAYER_HISTORY_REFRESH_LEASE_MS,
  PLAYER_HISTORY_RETENTION_DAYS,
  PLAYER_HISTORY_UNUSED_CACHE_DAYS,
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
          refreshLeaseUntil: null,
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

export async function mergeCachedPlayerGames(
  key: HistoryCacheKey,
  refreshedGames: Aoe4WorldGame[],
): Promise<HistoryCacheMetadata> {
  const normalised = normaliseKey(key);

  const now = new Date();

  const expiresAt = new Date(now.getTime() + PLAYER_HISTORY_CACHE_TTL_MS);

  const retentionStart = new Date(now);

  retentionStart.setUTCDate(
    retentionStart.getUTCDate() - PLAYER_HISTORY_RETENTION_DAYS,
  );

  const validGames = refreshedGames
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

  const cache = await prisma.$transaction(
    async (transaction) => {
      const record = await transaction.playerHistoryCache.findUnique({
        where: {
          profileId_leaderboard_historyDays: {
            profileId: normalised.profileId,
            leaderboard: normalised.leaderboard,
            historyDays: normalised.historyDays,
          },
        },
      });

      if (!record) {
        throw new Error(
          "Cannot incrementally refresh a missing player history cache.",
        );
      }

      const refreshedGameIds = validGames.map((entry) => entry.gameId);

      /*
       * Delete overlapping rows before inserting the
       * refreshed representation. AoE4World game data
       * can occasionally gain additional fields after
       * the initial result is observed.
       */
      if (refreshedGameIds.length > 0) {
        await transaction.cachedPlayerGame.deleteMany({
          where: {
            cacheId: record.id,
            gameId: {
              in: refreshedGameIds,
            },
          },
        });

        await transaction.cachedPlayerGame.createMany({
          data: validGames.map((entry) => ({
            cacheId: record.id,
            gameId: entry.gameId,
            profileId: normalised.profileId,
            leaderboard: normalised.leaderboard,
            startedAt: entry.startedAt,
            data: entry.game as unknown as Prisma.InputJsonValue,
          })),
          skipDuplicates: true,
        });
      }

      await transaction.cachedPlayerGame.deleteMany({
        where: {
          cacheId: record.id,
          startedAt: {
            lt: retentionStart,
          },
        },
      });

      const aggregate = await transaction.cachedPlayerGame.aggregate({
        where: {
          cacheId: record.id,
        },
        _count: {
          _all: true,
        },
        _min: {
          startedAt: true,
        },
        _max: {
          startedAt: true,
        },
      });

      return transaction.playerHistoryCache.update({
        where: {
          id: record.id,
        },
        data: {
          refreshedAt: now,
          expiresAt,
          oldestGameAt: aggregate._min.startedAt,
          newestGameAt: aggregate._max.startedAt,
          gameCount: aggregate._count._all,
          refreshLeaseUntil: null,
          dataVersion: PLAYER_HISTORY_CACHE_VERSION,
        },
      });
    },
    {
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

export async function acquirePlayerHistoryRefreshLease(
  key: HistoryCacheKey,
): Promise<boolean> {
  const normalised = normaliseKey(key);

  const now = new Date();

  const refreshLeaseUntil = new Date(
    now.getTime() + PLAYER_HISTORY_REFRESH_LEASE_MS,
  );

  const existingLease = await prisma.playerHistoryCache.updateMany({
    where: {
      profileId: normalised.profileId,
      leaderboard: normalised.leaderboard,
      historyDays: normalised.historyDays,

      OR: [
        {
          refreshLeaseUntil: null,
        },
        {
          refreshLeaseUntil: {
            lt: now,
          },
        },
      ],
    },

    data: {
      refreshLeaseUntil,
    },
  });

  if (existingLease.count === 1) {
    return true;
  }

  const existingCache = await prisma.playerHistoryCache.findUnique({
    where: {
      profileId_leaderboard_historyDays: {
        profileId: normalised.profileId,
        leaderboard: normalised.leaderboard,
        historyDays: normalised.historyDays,
      },
    },

    select: {
      id: true,
    },
  });

  if (existingCache) {
    return false;
  }

  /*
   * Create a placeholder cache row for a first-time
   * bootstrap. If another request creates it first, this
   * request treats the refresh lease as unavailable.
   */
  try {
    await prisma.playerHistoryCache.create({
      data: {
        profileId: normalised.profileId,
        leaderboard: normalised.leaderboard,
        historyDays: normalised.historyDays,

        refreshedAt: new Date(0),
        expiresAt: new Date(0),

        refreshLeaseUntil,

        newestGameAt: null,
        oldestGameAt: null,
        gameCount: 0,

        dataVersion: PLAYER_HISTORY_CACHE_VERSION,
      },
    });

    return true;
  } catch {
    const cacheCreatedByAnotherRequest =
      await prisma.playerHistoryCache.findUnique({
        where: {
          profileId_leaderboard_historyDays: {
            profileId: normalised.profileId,
            leaderboard: normalised.leaderboard,
            historyDays: normalised.historyDays,
          },
        },

        select: {
          id: true,
        },
      });

    if (cacheCreatedByAnotherRequest) {
      return false;
    }

    throw new Error("Unable to acquire player-history refresh lease.");
  }
}

export async function releasePlayerHistoryRefreshLease(
  key: HistoryCacheKey,
): Promise<void> {
  const normalised = normaliseKey(key);

  await prisma.playerHistoryCache.updateMany({
    where: {
      profileId: normalised.profileId,
      leaderboard: normalised.leaderboard,
      historyDays: normalised.historyDays,
    },

    data: {
      refreshLeaseUntil: null,
    },
  });
}

export async function deleteUnusedPlayerHistoryCaches(): Promise<{
  deletedCaches: number;
}> {
  const cutoff = new Date();

  cutoff.setUTCDate(cutoff.getUTCDate() - PLAYER_HISTORY_UNUSED_CACHE_DAYS);

  const result = await prisma.playerHistoryCache.deleteMany({
    where: {
      refreshedAt: {
        lt: cutoff,
      },

      OR: [
        {
          refreshLeaseUntil: null,
        },
        {
          refreshLeaseUntil: {
            lt: new Date(),
          },
        },
      ],
    },
  });

  return {
    deletedCaches: result.count,
  };
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
