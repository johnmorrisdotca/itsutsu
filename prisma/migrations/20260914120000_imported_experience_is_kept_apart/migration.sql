-- Imported experience is kept apart from experience earned here.
--
-- John, 2026-09-14: people imported from other sites "should get that XP! but
-- of course, we will show filters, that show worldwide XP ... and the Itsutsu
-- only XP as well". So there are two totals, and both must be sortable.
--
-- "xp" stays exactly what it was: every point earned on Itsutsu. "xpImported" is
-- the credit for play on another site, written only by the importer. And
-- "xpEverywhere" is their sum, a column rather than an expression in a query,
-- because the XP board pages by cursor over an indexed column, a level's page
-- reads a range over one, and a rank is a count of the rows above a value --
-- none of which "xp" + "xpImported" can answer with an index.
--
-- ADDITIVE. Nothing is dropped, renamed or rewritten. Every existing member has
-- imported nothing, so "xpImported" is 0 and "xpEverywhere" is their "xp",
-- which this fills in the same migration so the three agree from the first
-- moment. Nothing is paid here: the importer is a separate run.
--
-- BEFORE PRODUCTION: take a Neon branch first. See AGENTS.md, "Back It Up
-- Before You Migrate It".

ALTER TABLE "Member" ADD COLUMN "xpImported" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Member" ADD COLUMN "xpEverywhere" INTEGER NOT NULL DEFAULT 0;

UPDATE "Member" SET "xpEverywhere" = "xp";

CREATE INDEX "Member_xpEverywhere_idx" ON "Member"("xpEverywhere");
