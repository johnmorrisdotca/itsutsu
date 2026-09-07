-- CreateEnum
CREATE TYPE "GameResult" AS ENUM ('black', 'white', 'draw', 'abandoned');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blackName" TEXT NOT NULL DEFAULT '',
    "whiteName" TEXT NOT NULL DEFAULT '',
    "size" INTEGER NOT NULL,
    "winLength" INTEGER NOT NULL,
    "variant" TEXT NOT NULL,
    "obstacles" TEXT NOT NULL,
    "opener" TEXT NOT NULL,
    "result" "GameResult" NOT NULL,
    "winner" TEXT,
    "moveCount" INTEGER NOT NULL,
    "durationMs" INTEGER,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Move" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "stone" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'place',

    CONSTRAINT "Move_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Game_playedAt_idx" ON "Game"("playedAt");

-- CreateIndex
CREATE INDEX "Game_result_playedAt_idx" ON "Game"("result", "playedAt");

-- CreateIndex
CREATE INDEX "Game_size_playedAt_idx" ON "Game"("size", "playedAt");

-- CreateIndex
CREATE INDEX "Move_gameId_number_idx" ON "Move"("gameId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Move_gameId_number_key" ON "Move"("gameId", "number");

-- AddForeignKey
ALTER TABLE "Move" ADD CONSTRAINT "Move_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
