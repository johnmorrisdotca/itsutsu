-- AlterTable
ALTER TABLE "PuzzleRun" ADD COLUMN     "hintsAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hintsUsed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PuzzleSolve" ADD COLUMN     "hintsUsed" INTEGER;
