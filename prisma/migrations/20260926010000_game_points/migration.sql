-- IP, Itsutsu Points: what each seat won by a finished game, written once when it is decided
-- (src/lib/points/gamePoints.ts). Null until priced: the games decided before this are priced by
-- the backfill runner, run locally, so a null always means "not priced yet" and never "won nothing".
ALTER TABLE "Game" ADD COLUMN "blackPoints" INTEGER;
ALTER TABLE "Game" ADD COLUMN "whitePoints" INTEGER;
