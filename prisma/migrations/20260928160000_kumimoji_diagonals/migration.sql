-- Kumimoji's Diagonals: a set-up choice, part of a game's identity like its
-- language, length and tile set, so a kept run and a race carry it.
ALTER TABLE "PuzzleRun" ADD COLUMN "diagonals" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PuzzleRace" ADD COLUMN "diagonals" BOOLEAN NOT NULL DEFAULT false;

-- The run's key with Diagonals in it, under a short name of its own (Postgres
-- keeps 63 characters of a name). The key without it stays: the code live
-- before this deploy upserts on it, and a later migration drops it.
CREATE UNIQUE INDEX "PuzzleRun_run_key" ON "PuzzleRun"("memberId", "kind", "size", "language", "gameLength", "doubleSet", "diagonals", "level", "seed");
