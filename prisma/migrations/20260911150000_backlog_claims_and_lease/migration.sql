-- AlterTable
ALTER TABLE "BacklogItem"
  ADD COLUMN     "claimedBy" VARCHAR(80),
  ADD COLUMN     "claimedAt" TIMESTAMP(3),
  ADD COLUMN     "releasedAt" TIMESTAMP(3);

-- Every row that was ever assigned keeps that history rather than losing it
-- when the old column is dropped below.
--
-- The first cut of this migration named "inProgress" in the WHERE clause and
-- moved nothing on production: the vocabulary is demonstrably split
-- (BacklogStatus carries "proposed"/"planned"/"building" alongside
-- "open"/"inProgress"/"done"/"dropped", see the enum's own comment and
-- LEGACY_STATUSES in backlog.constants.ts), and every row production
-- actually holds "in progress" under is spelled "building". Naming a value
-- here will always be one release behind whichever rows have not been
-- touched since the vocabulary last changed. "done" and "dropped" are the
-- only two states with no legacy synonym, so testing what a row is NOT
-- reaches every live spelling of "still open" or "still held" without
-- enumerating them, and keeps working if another synonym ever turns up.
-- Read this before renaming it back to a named status; that was the bug.
--
-- A row not yet finished or declined keeps its claim live: releasedAt stays
-- null, exactly as a row picked up today would. A row already done or
-- dropped reads instead as a claim that WAS held and has SINCE been
-- released, at the moment it last moved — which is true of it, and distinct
-- from never having had one. `heldNow`/`leaseExpired` need no change for
-- this: they still answer only from claimedBy/claimedAt, and the board only
-- ever asks them about a row whose status is inProgress right now (see the
-- status guard in BacklogRow.tsx's HoldLine) — so a finished row's preserved
-- claimedBy never surfaces as "held" or "stale" on the board, whatever its
-- claimedAt says.
UPDATE "BacklogItem"
SET "claimedBy" = "assignedTo",
    "claimedAt" = "movedAt",
    "releasedAt" = CASE WHEN status NOT IN ('done', 'dropped') THEN NULL ELSE "movedAt" END
WHERE "assignedTo" <> '';

-- AlterTable
ALTER TABLE "BacklogItem" DROP COLUMN "assignedTo";
