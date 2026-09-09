-- Where a new game starts for this member: board size, the switches under
-- Advanced, the clock, whether it counts. A starting point only — a game
-- already under way is never touched by it. Null for everybody until they
-- choose, which reads as the same defaults every new game has always had.
ALTER TABLE "Member" ADD COLUMN "gameDefaults" JSONB;
