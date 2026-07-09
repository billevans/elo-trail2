-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "aoe4Id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingSnapshot" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "leaderboard" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "rank" INTEGER,
    "wins" INTEGER,
    "losses" INTEGER,
    "games" INTEGER,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RatingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedPlayer" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSynced" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "message" TEXT,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_aoe4Id_key" ON "Player"("aoe4Id");

-- CreateIndex
CREATE INDEX "RatingSnapshot_playerId_idx" ON "RatingSnapshot"("playerId");

-- CreateIndex
CREATE INDEX "RatingSnapshot_capturedAt_idx" ON "RatingSnapshot"("capturedAt");

-- CreateIndex
CREATE INDEX "RatingSnapshot_playerId_leaderboard_capturedAt_idx" ON "RatingSnapshot"("playerId", "leaderboard", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedPlayer_playerId_key" ON "TrackedPlayer"("playerId");

-- AddForeignKey
ALTER TABLE "RatingSnapshot" ADD CONSTRAINT "RatingSnapshot_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedPlayer" ADD CONSTRAINT "TrackedPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
