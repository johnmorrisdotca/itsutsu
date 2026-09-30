-- Race a chosen opponent: the host may offer the guest seat to a buddy by
-- name, who is told in their inbox and may sit without the link. One
-- nullable column and its index; every race before it is by link only, as it was.
ALTER TABLE "PuzzleRace" ADD COLUMN "offeredToMemberId" TEXT;

CREATE INDEX "PuzzleRace_offeredToMemberId_createdAt_idx" ON "PuzzleRace"("offeredToMemberId", "createdAt");
