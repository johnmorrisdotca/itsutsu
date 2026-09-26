-- A countdown on any puzzle (Tortoise, Fox, Rabbit): nullable, so every row kept before it reads as none.
ALTER TABLE "PuzzleRun" ADD COLUMN "countdownMs" INTEGER;
ALTER TABLE "PuzzleSolve" ADD COLUMN "countdownMs" INTEGER;
