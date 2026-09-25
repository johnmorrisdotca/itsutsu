-- AlterTable
ALTER TABLE "PuzzleSolve" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "PuzzleSolve_kind_memberId_givens_idx" ON "PuzzleSolve"("kind", "memberId", "givens");

-- Every solve kept before points existed is scored once, by the rule in
-- src/lib/puzzles/puzzlePoints.ts: five for every cell the solver filled (every
-- cell of a Hidden Stones grid, the unprinted "." cells of the grid part of any
-- other), less fifty for every Check or Hint pressed, never below nought. A
-- solve kept before Check or Hint was counted used none.
UPDATE "PuzzleSolve"
SET "points" = GREATEST(
  0,
  5 * (CASE
         WHEN "kind" = 'hiddenStones' THEN "size" * "size"
         ELSE "size" * "size" - length(replace(substr("givens", 1, "size" * "size"), '.', ''))
       END)
  - 50 * (COALESCE("checksUsed", 0) + COALESCE("hintsUsed", 0))
);
