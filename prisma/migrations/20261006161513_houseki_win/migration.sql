-- CreateTable
CREATE TABLE "HousekiWin" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "levelKey" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "marks" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "save" TEXT NOT NULL,
    "firstWonAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HousekiWin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HousekiWin_kind_finishedAt_idx" ON "HousekiWin"("kind", "finishedAt");

-- CreateIndex
CREATE INDEX "HousekiWin_memberId_finishedAt_idx" ON "HousekiWin"("memberId", "finishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HousekiWin_memberId_kind_levelKey_key" ON "HousekiWin"("memberId", "kind", "levelKey");
