-- CreateTable
CREATE TABLE "PuzzleSolve" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "givens" TEXT NOT NULL,
    "elapsedMs" INTEGER NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raceId" TEXT,

    CONSTRAINT "PuzzleSolve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PuzzleRace" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "givens" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "hostMemberId" TEXT NOT NULL,
    "hostName" TEXT NOT NULL DEFAULT '',
    "guestToken" TEXT NOT NULL,
    "guestMemberId" TEXT,
    "guestName" TEXT NOT NULL DEFAULT '',
    "hostStartedAt" TIMESTAMP(3),
    "hostFinishedAt" TIMESTAMP(3),
    "guestStartedAt" TIMESTAMP(3),
    "guestFinishedAt" TIMESTAMP(3),

    CONSTRAINT "PuzzleRace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PuzzleSolve_memberId_finishedAt_idx" ON "PuzzleSolve"("memberId", "finishedAt");

-- CreateIndex
CREATE INDEX "PuzzleSolve_kind_size_level_elapsedMs_idx" ON "PuzzleSolve"("kind", "size", "level", "elapsedMs");

-- CreateIndex
CREATE UNIQUE INDEX "PuzzleRace_guestToken_key" ON "PuzzleRace"("guestToken");

-- CreateIndex
CREATE INDEX "PuzzleRace_hostMemberId_createdAt_idx" ON "PuzzleRace"("hostMemberId", "createdAt");

-- CreateIndex
CREATE INDEX "PuzzleRace_guestMemberId_createdAt_idx" ON "PuzzleRace"("guestMemberId", "createdAt");
