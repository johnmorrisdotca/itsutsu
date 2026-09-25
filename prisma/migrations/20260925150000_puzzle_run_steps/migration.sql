-- A kept puzzle keeps its steps, so the scrubber has them when it is picked up again.
-- Additive: a run kept before this has none, and opens with the one step it has.
ALTER TABLE "PuzzleRun" ADD COLUMN "steps" TEXT;
