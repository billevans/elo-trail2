-- CreateTable
CREATE TABLE "OperationalEvent" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "route" TEXT,
    "statusCode" INTEGER,
    "durationMs" INTEGER,
    "profileId" INTEGER,
    "historyDays" INTEGER,
    "cacheSource" TEXT,
    "upstreamGames" INTEGER,
    "returnedGames" INTEGER,
    "errorCode" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OperationalEvent_createdAt_idx" ON "OperationalEvent"("createdAt");

-- CreateIndex
CREATE INDEX "OperationalEvent_eventName_createdAt_idx" ON "OperationalEvent"("eventName", "createdAt");

-- CreateIndex
CREATE INDEX "OperationalEvent_route_createdAt_idx" ON "OperationalEvent"("route", "createdAt");

-- CreateIndex
CREATE INDEX "OperationalEvent_profileId_createdAt_idx" ON "OperationalEvent"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "OperationalEvent_cacheSource_createdAt_idx" ON "OperationalEvent"("cacheSource", "createdAt");

-- CreateIndex
CREATE INDEX "OperationalEvent_errorCode_createdAt_idx" ON "OperationalEvent"("errorCode", "createdAt");
