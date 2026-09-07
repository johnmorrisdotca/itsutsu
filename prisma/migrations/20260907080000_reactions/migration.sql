-- Reactions: emoji sent between the players of a shared game.
--
-- Additive: a new table, cascading with its game, and nothing else changes.

CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "stone" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "moveNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Reaction_gameId_createdAt_idx" ON "Reaction"("gameId", "createdAt");

ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
