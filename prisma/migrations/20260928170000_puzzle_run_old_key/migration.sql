-- The kept-run key before Diagonals, left in place by 20260928160000 while the
-- code that upserted on it could still be live. 0.417.0 upserts on
-- "PuzzleRun_run_key" alone, so the old one goes.
DROP INDEX "PuzzleRun_memberId_kind_size_language_gameLength_doubleSet__key";
