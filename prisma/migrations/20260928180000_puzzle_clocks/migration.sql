-- A puzzle's countdown (none, tortoise, fox, rabbit): part of what a solve and
-- a kept run were, like the size and level. Every row before this had none.
ALTER TABLE "PuzzleSolve" ADD COLUMN "clock" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "PuzzleRun" ADD COLUMN "clock" TEXT NOT NULL DEFAULT 'none';

-- The fastest table reads each clock on its own.
CREATE INDEX "PuzzleSolve_clock_fastest_idx" ON "PuzzleSolve"("kind", "size", "level", "clock", "elapsedMs");

-- The run's key with the clock in it, under a short name of its own (Postgres
-- keeps 63 characters of a name). The key without it, "PuzzleRun_run_key",
-- stays: the code live before this deploy upserts on it, and a later
-- migration drops it.
CREATE UNIQUE INDEX "PuzzleRun_run_clock_key" ON "PuzzleRun"("memberId", "kind", "size", "language", "gameLength", "doubleSet", "diagonals", "clock", "level", "seed");
