-- A GAME PROPOSED TO A PERSON IS AN OFFER UNTIL THEY ACCEPT IT.
--
-- Four nullable columns and one index. Additive: nothing is dropped, nothing
-- is renamed, no column becomes NOT NULL, and every existing row reads
-- exactly as it did before — all four are NULL on all of them, which is the
-- honest answer for a game nobody was asked to play.
--
-- WHY COLUMNS AND NOT A NEW `GameLifecycle` VALUE, which was the obvious
-- alternative and was weighed:
--
--  * `status` is the column every reader asks FIRST — "a row filed as
--    anything but active is over" (myGames.ts) — and `{ status: "finished" }`
--    is the predicate that means "in the record" in eight separate queries. A
--    third value would have to be subtracted from all eight, and an enum
--    value nobody has heard of is the one thing that cannot fail safely: the
--    readers that forget it show an offer as a game.
--  * An enum change is also the worst kind of change to make to a database
--    four worktrees share. `prisma generate` rewrites the client on disk
--    while every running `next dev` keeps the old one in memory, and the
--    failure names the NEW value as though it were the invalid one — see
--    AGENTS.md, "A stale dev server lies both ways". Four columns that are
--    NULL everywhere cost nobody a restart.
--  * And the offer is genuinely not a lifecycle state. The game is active:
--    it exists, it has rules, it has a board, and one person is sitting at
--    it. What is unsettled is whose the other SEAT is, which is a fact about
--    a seat.
--
-- WHY FOUR AND NOT TWO. `offeredToMemberId` and `offeredAt` are the offer.
-- `declinedAt` and `withdrawnAt` are how an offer ended without being played,
-- and they are two columns because they are two different things to tell
-- somebody: "Hanachan declined" is news to the offerer, and "you took it
-- back" is not. One timestamp would mean both, which is the shape AGENTS.md
-- names — a value that is in range and stands in for two answers.
--
-- An offer that is ACCEPTED clears the first two, so an accepted game is
-- byte-for-byte the bound game it would have been before this migration.
-- That is what keeps every other query on the site out of it.

ALTER TABLE "Game" ADD COLUMN "offeredToMemberId" TEXT;
ALTER TABLE "Game" ADD COLUMN "offeredAt" TIMESTAMP(3);
ALTER TABLE "Game" ADD COLUMN "declinedAt" TIMESTAMP(3);
ALTER TABLE "Game" ADD COLUMN "withdrawnAt" TIMESTAMP(3);

-- The offers waiting on one person, which is the third way a game is theirs.
-- `fetchMyGames` already reads the two seat indexes on one query; this is the
-- third branch of the same OR, so the queue costs no extra round trip.
CREATE INDEX "Game_offeredToMemberId_idx" ON "Game"("offeredToMemberId");
