-- How a member likes a board dressed — the wood, the stones, the grid, the
-- coordinates — kept against the account so a phone and a laptop agree.
-- Null for everybody until they choose something, which reads as the same
-- defaults every board has always used.
ALTER TABLE "Member" ADD COLUMN "appearance" JSONB;
