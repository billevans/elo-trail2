-- CreateTable
CREATE TABLE "PlayerHistoryCache" (
    "id" TEXT NOT NULL,
    "profileId" INTEGER NOT NULL,
    "leaderboard" TEXT NOT NULL,
    "historyDays" INTEGER NOT NULL,
    "refreshedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "newestGameAt" TIMESTAMP(3),
    "oldestGameAt" TIMESTAMP(3),
    "gameCount" INTEGER NOT NULL DEFAULT 0,
    "dataVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerHistoryCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CachedPlayerGame" (
    "id" TEXT NOT NULL,
    "cacheId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "profileId" INTEGER NOT NULL,
    "leaderboard" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CachedPlayerGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerHistoryCache_expiresAt_idx" ON "PlayerHistoryCache"("expiresAt");

-- CreateIndex
CREATE INDEX "PlayerHistoryCache_refreshedAt_idx" ON "PlayerHistoryCache"("refreshedAt");

-- CreateIndex
CREATE INDEX "PlayerHistoryCache_profileId_leaderboard_idx" ON "PlayerHistoryCache"("profileId", "leaderboard");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerHistoryCache_profileId_leaderboard_historyDays_key" ON "PlayerHistoryCache"("profileId", "leaderboard", "historyDays");

-- CreateIndex
CREATE INDEX "CachedPlayerGame_cacheId_startedAt_idx" ON "CachedPlayerGame"("cacheId", "startedAt");

-- CreateIndex
CREATE INDEX "CachedPlayerGame_profileId_leaderboard_startedAt_idx" ON "CachedPlayerGame"("profileId", "leaderboard", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CachedPlayerGame_cacheId_gameId_key" ON "CachedPlayerGame"("cacheId", "gameId");

-- AddForeignKey
ALTER TABLE "CachedPlayerGame" ADD CONSTRAINT "CachedPlayerGame_cacheId_fkey" FOREIGN KEY ("cacheId") REFERENCES "PlayerHistoryCache"("id") ON DELETE CASCADE ON UPDATE CASCADE;
