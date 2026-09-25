-- AlterTable
ALTER TABLE "PuzzleRace" ADD COLUMN     "checksAllowed" INTEGER;

-- AlterTable
ALTER TABLE "PuzzleSolve" ADD COLUMN     "checksAllowed" INTEGER,
ADD COLUMN     "checksUsed" INTEGER,
ADD COLUMN     "pausedMs" INTEGER;
