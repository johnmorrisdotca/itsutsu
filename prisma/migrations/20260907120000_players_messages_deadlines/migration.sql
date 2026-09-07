-- Players with ratings and records, messages with moves, and deadlines.
--
-- All additive. Game gains the per-move deadline columns with defaults that
-- mean "no clock" and "no forfeits"; Reaction gains an optional text; Player
-- is a new table keyed by the folded name, since names are the only identity.

ALTER TABLE "Game" ADD COLUMN "moveTimeMs" INTEGER;
ALTER TABLE "Game" ADD COLUMN "timeoutPenalty" TEXT NOT NULL DEFAULT 'turn';
ALTER TABLE "Game" ADD COLUMN "lastMoveAt" TIMESTAMP(3);
ALTER TABLE "Game" ADD COLUMN "blackForfeits" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Game" ADD COLUMN "whiteForfeits" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Reaction" ADD COLUMN "text" TEXT;

CREATE TABLE "Player" (
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1600,
    "ratedGames" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "Player_rating_idx" ON "Player"("rating");
