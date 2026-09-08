-- Resigning as a per-game option, and seats anyone may take.
--
-- All additive. allowResign defaults on, which is what every existing game
-- has behaved like; openSeat and openedAt are null for every game so far,
-- since nothing was ever posted for anyone to pick up.

ALTER TABLE "Game" ADD COLUMN "allowResign" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Game" ADD COLUMN "openSeat" TEXT;
ALTER TABLE "Game" ADD COLUMN "openedAt" TIMESTAMP(3);

CREATE INDEX "Game_openSeat_openedAt_idx" ON "Game"("openSeat", "openedAt");
