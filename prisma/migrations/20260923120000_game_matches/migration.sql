-- Paired games: several games made at once between the same two players.
ALTER TABLE "Game" ADD COLUMN "matchId" TEXT;
ALTER TABLE "Game" ADD COLUMN "matchIndex" INTEGER;
ALTER TABLE "Game" ADD COLUMN "matchSize" INTEGER;
CREATE INDEX "Game_matchId_idx" ON "Game"("matchId");
