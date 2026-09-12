-- The ladder sorts by what it shows.
--
-- A second migration rather than an edit to the one before it, because that one
-- is already applied and Prisma checksums the file: editing it would break
-- `migrate status` on every database that has it. Two migrations for one feature
-- is the cost of that, and it is the right cost.
--
-- WHY A COLUMN AND NOT AN AGGREGATE. The XP leaderboard is sortable, and one of
-- its columns is when somebody last earned something. `max("createdAt") group by
-- "memberId"` answers that, and as a SORT it is either a query per row -- the
-- fault taken off the landing page in 0.139.0, where 2,508 move rows were read
-- to draw eight games -- or a grouped subquery that no index can order, which is
-- a full scan of XpEvent every time a reader clicks the heading. Written by
-- awardXp in the same UPDATE that increments "xp", so it costs nothing at all.
--
-- NULLABLE, AND NEVER A STAND-IN DATE. "Has never earned anything" is a real
-- state the leaderboard shows differently from "earned something in 1970".
-- Backfilling "createdAt" here would put a plausible date on every member who
-- has never earned a point, which is the shape AGENTS.md warns about: a value in
-- range that also means nothing was said.
--
-- So it is added without a backfill. Every existing member reads as never having
-- earned, which is exactly true -- the ledger was created minutes ago and holds
-- no rows.

ALTER TABLE "Member" ADD COLUMN "xpLastAt" TIMESTAMP(3);

CREATE INDEX "Member_xpLastAt_idx" ON "Member"("xpLastAt");
