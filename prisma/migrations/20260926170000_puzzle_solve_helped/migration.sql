-- How a solve was helped, or NULL for none: "cheated", "explosionsSoft" or
-- "explosionsOff" (`solveHelp.ts`). A helped solve counts as solved, scores no
-- points and stays off the fastest tables; one with explosions off does not
-- open the next block. Every solve kept before this column was unhelped, which
-- NULL says truly. Nullable with no default: no rewrite of the table.
ALTER TABLE "PuzzleSolve" ADD COLUMN "helped" TEXT;
