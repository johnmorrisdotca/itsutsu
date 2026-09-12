-- A member keeps their experience.
--
-- The foundation of the XP ladder: a ledger of what everybody has earned, and
-- the running total denormalised onto the member row so no page pays a query
-- per name to show a level. The design is docs/plans/xp/XP_DESIGN.md.
--
-- ADDITIVE ONLY. Two columns on Member and one new table; nothing is dropped,
-- renamed or rewritten, so an older worktree reading these rows sees a Member
-- exactly as it was. Nobody's XP is backfilled -- every member starts at zero,
-- which is honest for a ladder that did not exist yesterday, and a backfill is
-- its own ticket because replaying the 116 finished games has to go through
-- awardXp in chronological order or the totals mean nothing.
--
-- THE UNIQUE INDEX ON (memberId, type, subject) IS THE WHOLE DESIGN. The
-- subject says how often an award may happen -- the day key for a daily one,
-- the game id for a game, the variant for a first play, '' for a once-ever --
-- so a replayed request or a double-fired handler writes the row that is
-- already there and is refused by the database, rather than by a rule every
-- caller has to remember.
--
-- "subject" IS NOT NULLABLE FOR THAT REASON. Postgres does not consider two
-- nulls equal, so a nullable column would let a once-ever award be paid twice
-- with the index present and silently useless. '' is a real meaning here -- the
-- award is about the member and nothing else.
--
-- "xp" is a SUM and not a formula, which is what makes it safe to denormalise:
-- it can be recomputed from XpEvent and checked, and awardXp writes both halves
-- in one transaction. The LEVEL is deliberately not stored beside it -- the
-- curve is a table so it can be retuned with no migration behind it, and a
-- stored level would be a cached copy of a table that had just moved.

ALTER TABLE "Member" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Member" ADD COLUMN "xpFlash" JSONB;

CREATE INDEX "Member_xp_idx" ON "Member"("xp");

CREATE TABLE "XpEvent" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "dayKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "XpEvent_memberId_type_subject_key" ON "XpEvent"("memberId", "type", "subject");
CREATE INDEX "XpEvent_memberId_dayKey_idx" ON "XpEvent"("memberId", "dayKey");
CREATE INDEX "XpEvent_memberId_createdAt_idx" ON "XpEvent"("memberId", "createdAt");
