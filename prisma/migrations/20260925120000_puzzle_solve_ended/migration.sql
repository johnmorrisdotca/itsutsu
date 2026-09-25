-- A word puzzle ended without its word is kept too, and a WordDrop keeps its guesses.
-- Additive: existing rows are solves (true) with no answer kept (null).
ALTER TABLE "PuzzleSolve" ADD COLUMN "solved" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PuzzleSolve" ADD COLUMN "answer" TEXT;
