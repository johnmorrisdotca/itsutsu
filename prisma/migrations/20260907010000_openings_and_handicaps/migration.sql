-- Openings and handicaps.
--
-- Both columns are additive. Every game recorded before this migration was
-- played under the free opening with no handicap, which is exactly what the
-- default and the null say, so no backfill is needed.

ALTER TABLE "Game" ADD COLUMN "opening" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "Game" ADD COLUMN "handicap" JSONB;
