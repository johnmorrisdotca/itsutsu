-- A record keeps its streak.
--
-- Consecutive results of the same kind, most recent first, carried forward by
-- whoever records a result. A column rather than a query: reading a run back
-- from the games would mean a player's history per row on a page listing every
-- member, which is the fault taken off the landing page in 0.139.0 — it read
-- 2,508 move rows to draw eight games.
--
-- Three scopes on Player and two on PlayerVariantRating; `rating/streak.ts`
-- and the schema comments carry the reasoning. Every column is nullable or
-- defaulted, so this is additive: nothing already stored moves, and a row
-- nobody has backfilled reads as "no streak" rather than as a run of nought.
-- `scripts/backfill-streaks.ts` fills them in from the games, once.

ALTER TABLE "Player"
  ADD COLUMN "peopleStreakKind"    TEXT,
  ADD COLUMN "peopleStreakCount"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "computerStreakKind"  TEXT,
  ADD COLUMN "computerStreakCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "ratedStreakKind"     TEXT,
  ADD COLUMN "ratedStreakCount"    INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "PlayerVariantRating"
  ADD COLUMN "peopleStreakKind"    TEXT,
  ADD COLUMN "peopleStreakCount"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "computerStreakKind"  TEXT,
  ADD COLUMN "computerStreakCount" INTEGER NOT NULL DEFAULT 0;
