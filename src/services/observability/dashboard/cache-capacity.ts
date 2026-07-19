const DEFAULT_DATABASE_ALLOWANCE_BYTES = 500 * 1024 * 1024;

interface CacheRelationSizeRecord {
  cacheTableBytes: bigint;
  gameTableBytes: bigint;
}

export interface CacheCapacitySource {
  cacheCount: number;
  cachedGameCount: number;
  declaredGameCount: number;

  cacheTableBytes: number;
  gameTableBytes: number;

  oldestRefreshedAt: Date | null;
  newestRefreshedAt: Date | null;
}

export interface CacheCapacitySnapshot {
  cacheCount: number;
  cachedGameCount: number;
  declaredGameCount: number;

  cacheTableBytes: number;
  gameTableBytes: number;
  totalBytes: number;

  databaseAllowanceBytes: number;
  utilisationRate: number;

  averageBytesPerCache: number | null;
  averageBytesPerGame: number | null;

  oldestRefreshedAt: string | null;
  newestRefreshedAt: string | null;
}

function divideOrNull(numerator: number, denominator: number): number | null {
  if (denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

function parsePositiveInteger(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function getConfiguredDatabaseAllowanceBytes(): number {
  return (
    parsePositiveInteger(process.env.OBSERVABILITY_DATABASE_ALLOWANCE_BYTES) ??
    DEFAULT_DATABASE_ALLOWANCE_BYTES
  );
}

export function buildCacheCapacitySnapshot({
  source,
  databaseAllowanceBytes = getConfiguredDatabaseAllowanceBytes(),
}: {
  source: CacheCapacitySource;
  databaseAllowanceBytes?: number;
}): CacheCapacitySnapshot {
  const totalBytes = source.cacheTableBytes + source.gameTableBytes;

  return {
    cacheCount: source.cacheCount,
    cachedGameCount: source.cachedGameCount,
    declaredGameCount: source.declaredGameCount,

    cacheTableBytes: source.cacheTableBytes,
    gameTableBytes: source.gameTableBytes,
    totalBytes,

    databaseAllowanceBytes,
    utilisationRate: totalBytes / databaseAllowanceBytes,

    averageBytesPerCache: divideOrNull(totalBytes, source.cacheCount),

    averageBytesPerGame: divideOrNull(
      source.gameTableBytes,
      source.cachedGameCount,
    ),

    oldestRefreshedAt: source.oldestRefreshedAt?.toISOString() ?? null,

    newestRefreshedAt: source.newestRefreshedAt?.toISOString() ?? null,
  };
}

export async function getCacheCapacitySnapshot(): Promise<CacheCapacitySnapshot> {
  const { prisma } = await import("@/services/database");
  const [cacheAggregate, cachedGameCount, relationSizes] = await Promise.all([
    prisma.playerHistoryCache.aggregate({
      _count: {
        _all: true,
      },

      _sum: {
        gameCount: true,
      },

      _min: {
        refreshedAt: true,
      },

      _max: {
        refreshedAt: true,
      },
    }),

    prisma.cachedPlayerGame.count(),

    prisma.$queryRaw<CacheRelationSizeRecord[]>`
        SELECT
          pg_total_relation_size(
            '"PlayerHistoryCache"'
          )::bigint AS "cacheTableBytes",

          pg_total_relation_size(
            '"CachedPlayerGame"'
          )::bigint AS "gameTableBytes"
      `,
  ]);

  const relationSize = relationSizes[0];

  if (!relationSize) {
    throw new Error(
      "PostgreSQL did not return player-history cache relation sizes.",
    );
  }

  return buildCacheCapacitySnapshot({
    source: {
      cacheCount: cacheAggregate._count._all,
      cachedGameCount,
      declaredGameCount: cacheAggregate._sum.gameCount ?? 0,

      cacheTableBytes: Number(relationSize.cacheTableBytes),
      gameTableBytes: Number(relationSize.gameTableBytes),

      oldestRefreshedAt: cacheAggregate._min.refreshedAt,
      newestRefreshedAt: cacheAggregate._max.refreshedAt,
    },
  });
}
