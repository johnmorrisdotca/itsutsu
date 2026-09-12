-- The members directory sorts by what it shows.
--
-- ─────────────────────────────────────────────────────────────────────────
-- WHY THESE ARE COLUMNS
-- ─────────────────────────────────────────────────────────────────────────
--
-- /players was the one list on this site that could not sort or page, and the
-- reason was written in the source where its headings are drawn: its rows were
-- a composite of four reads. `fetchDirectory` gave the two hundred most
-- recently seen members; the programs and the kept records were fetched beside
-- it, because neither is ever "seen"; and the played/won/lost/drawn figures
-- came from `fetchPlayedTallies`, a pass over the GAMES table keyed by member
-- id. There was no single query whose ORDER BY a heading could reach.
--
-- Counting a tally per page is cheap and was the right answer while the
-- directory was one capped list. ORDERING by it is a different question, and
-- the difference is not a matter of degree: the order has to be decided before
-- the page is chosen, so a figure that lives in another table cannot decide it
-- without joining and aggregating the whole of `Game` on every page turn --
-- and no index can order a `SUM`. Sorting the assembled array instead would
-- have said "best played" and meant "best played OF THE TWO HUNDRED MOST
-- RECENTLY SEEN", which is the fault the whole sorting convention exists to
-- remove, wearing a control.
--
-- So the four numbers move onto the row they are about. `recordPlayed` in
-- `src/lib/rating/playedRun.ts` already runs at all four of the endings where a
-- game is decided -- a move, a claimed timeout, a position with no legal turn,
-- and a resignation -- and already carries `playedStreakKind` forward there,
-- in a transaction, from the row it has just read. The tally rides that same
-- write: one UPDATE per finished game per bound seat, no read per page, and the
-- run and the tally beside it cannot disagree about the game that just ended.
--
-- ─────────────────────────────────────────────────────────────────────────
-- WHAT "PLAYED" MEANS, EXACTLY, AND WHY THIS FILE HAS TO RESTATE IT
-- ─────────────────────────────────────────────────────────────────────────
--
-- The backfill below and `fetchPlayedTallies` must agree on every member, or
-- the directory contradicts a player's own page by numbers a reader can see.
-- So the three rules `playedRun.ts` states are restated here as SQL, and
-- `playedTally.test.ts` checks the two against the same games:
--
--   1. A GAME COUNTS WHEN IT IS FINISHED AND ITS RESULT IS NOT `abandoned`.
--      Called off before the first stone is not a result.
--   2. BY MEMBER ID ONLY, never by name. Production carries a decided game
--      between "Meijin" and "Hidemasa Tamenoki" with both seats' ids null,
--      recorded before those member rows existed; a name fallback would pull it
--      into a total it was never bound to.
--   3. A GAME AGAINST YOURSELF IS ONE GAME, counted from the black seat. Both
--      seats carry the one id and a naive pass over the seats counts it twice.
--      John has played himself; that game is why his record reads 14 played.
--
-- And one rule that is `playedSides`' rather than `fetchPlayedTallies`':
-- A ROW WHOSE WINNER CANNOT BE READ MOVES NOBODY'S TALLY. `winner` is a plain
-- TEXT column, so `black`, `white` and NULL are the three values it is allowed
-- to hold and the only three it does hold -- checked on both databases on
-- 2026-09-11 -- but a fourth would be counted as a LOSS for black by the
-- arithmetic below if it were let through. A rule that cannot measure must not
-- fire, so the filter names the values it understands rather than excluding the
-- ones it does not.
--
-- ─────────────────────────────────────────────────────────────────────────
-- FILLED HERE, IN SQL, AND NOT BY A RUNNER
-- ─────────────────────────────────────────────────────────────────────────
--
-- One `UPDATE ... FROM` over an aggregate of `Game`. The alternative -- a
-- `.play.test.ts` backfill, which is how the streak columns beside these were
-- filled -- is a second step somebody has to remember on every database, and a
-- column that is nought because nobody ran the second step is indistinguishable
-- from a member who has played nothing. There is no such window here: the
-- column and its contents arrive together, in one transaction, and a database
-- that has this migration has the numbers.
--
-- Additive throughout. Nothing already stored moves, no column is dropped, and
-- a database that has not got here yet reads the old way.

ALTER TABLE "Member"
  ADD COLUMN "played" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "won"    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lost"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "drawn"  INTEGER NOT NULL DEFAULT 0;

WITH decided AS (
  SELECT "blackMemberId", "whiteMemberId", "winner"
    FROM "Game"
   WHERE "status" = 'finished'
     AND "result" <> 'abandoned'
     -- Rule 4: the values this arithmetic can read, named rather than excluded.
     AND ("winner" IS NULL OR "winner" IN ('black', 'white'))
),
sides AS (
  -- The black seat, wherever it is bound to a member.
  SELECT "blackMemberId"                                     AS "memberId",
         (CASE WHEN "winner" = 'black' THEN 1 ELSE 0 END)    AS "won",
         (CASE WHEN "winner" = 'white' THEN 1 ELSE 0 END)    AS "lost",
         (CASE WHEN "winner" IS NULL  THEN 1 ELSE 0 END)     AS "drawn"
    FROM decided
   WHERE "blackMemberId" IS NOT NULL
  UNION ALL
  -- The white seat, unless it is the same member as the black one: rule 3.
  SELECT "whiteMemberId"                                     AS "memberId",
         (CASE WHEN "winner" = 'white' THEN 1 ELSE 0 END)    AS "won",
         (CASE WHEN "winner" = 'black' THEN 1 ELSE 0 END)    AS "lost",
         (CASE WHEN "winner" IS NULL  THEN 1 ELSE 0 END)     AS "drawn"
    FROM decided
   WHERE "whiteMemberId" IS NOT NULL
     AND ("blackMemberId" IS NULL OR "whiteMemberId" <> "blackMemberId")
),
tally AS (
  SELECT "memberId",
         SUM("won")   AS "won",
         SUM("lost")  AS "lost",
         SUM("drawn") AS "drawn"
    FROM sides
   GROUP BY "memberId"
)
UPDATE "Member" AS m
   SET "played" = t."won" + t."lost" + t."drawn",
       "won"    = t."won",
       "lost"   = t."lost",
       "drawn"  = t."drawn"
  FROM tally AS t
 WHERE m."id" = t."memberId";

-- The directory's default order, which runs on every visit to /players whether
-- or not anybody pressed a heading. It has been a scan and a sort of the whole
-- table since the page existed.
CREATE INDEX "Member_lastSeenAt_idx" ON "Member"("lastSeenAt");

-- The five headings a reader can press. `Joined` is one the directory can offer
-- and the ladder cannot: a join date is a `Member` column, and the ladder's rows
-- come from `Player`.
CREATE INDEX "Member_createdAt_idx" ON "Member"("createdAt");
CREATE INDEX "Member_name_idx" ON "Member"("name");
CREATE INDEX "Member_played_idx" ON "Member"("played");
CREATE INDEX "Member_won_idx" ON "Member"("won");
CREATE INDEX "Member_lost_idx" ON "Member"("lost");
CREATE INDEX "Member_drawn_idx" ON "Member"("drawn");
