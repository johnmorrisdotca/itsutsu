-- CreateTable
CREATE TABLE "PuzzleRun" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "checksAllowed" INTEGER,
    "checksUsed" INTEGER NOT NULL DEFAULT 0,
    "progress" TEXT NOT NULL,
    "elapsedMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PuzzleRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PuzzleRun_memberId_updatedAt_idx" ON "PuzzleRun"("memberId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PuzzleRun_memberId_kind_size_level_seed_key" ON "PuzzleRun"("memberId", "kind", "size", "level", "seed");
