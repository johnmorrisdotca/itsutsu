-- The kept-run key without the clock, left in place by 20260928180000 while the
-- code that upserted on it could still be live. Since 0.420.0 every write goes
-- through "PuzzleRun_run_clock_key", so the old one goes, and the same grid may
-- be kept once on each clock.
DROP INDEX "PuzzleRun_run_key";
