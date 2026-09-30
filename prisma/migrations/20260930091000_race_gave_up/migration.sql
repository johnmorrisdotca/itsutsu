-- A race seat whose word ran out of guesses says so at once, rather than
-- leaving the other player to wait out the two-hour sitting. Two nullable
-- stamps; every race before them reads as it did.
ALTER TABLE "PuzzleRace" ADD COLUMN "hostGaveUpAt" TIMESTAMP(3),
ADD COLUMN "guestGaveUpAt" TIMESTAMP(3);
