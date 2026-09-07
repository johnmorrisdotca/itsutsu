-- Live games and seat tokens.
--
-- The new columns are required, but existing rows predate them, so each one is
-- added nullable, backfilled, and only then made NOT NULL. Games that already
-- exist are finished games, and are given tokens so every row has the same
-- shape even though nobody will ever play them again.

CREATE TYPE "GameLifecycle" AS ENUM ('active', 'finished');

ALTER TABLE "Game" ADD COLUMN "status" "GameLifecycle" NOT NULL DEFAULT 'finished';
ALTER TABLE "Game" ADD COLUMN "updatedAt" TIMESTAMP(3);
ALTER TABLE "Game" ADD COLUMN "blackToken" TEXT;
ALTER TABLE "Game" ADD COLUMN "whiteToken" TEXT;

-- Backfill. `playedAt` is the best record we have of when a finished game last
-- changed, and gen_random_uuid() gives the existing rows unguessable tokens.
UPDATE "Game" SET "updatedAt" = "playedAt" WHERE "updatedAt" IS NULL;
UPDATE "Game" SET "blackToken" = gen_random_uuid()::text WHERE "blackToken" IS NULL;
UPDATE "Game" SET "whiteToken" = gen_random_uuid()::text WHERE "whiteToken" IS NULL;

ALTER TABLE "Game" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "Game" ALTER COLUMN "blackToken" SET NOT NULL;
ALTER TABLE "Game" ALTER COLUMN "whiteToken" SET NOT NULL;

CREATE UNIQUE INDEX "Game_blackToken_key" ON "Game"("blackToken");
CREATE UNIQUE INDEX "Game_whiteToken_key" ON "Game"("whiteToken");
CREATE INDEX "Game_status_updatedAt_idx" ON "Game"("status", "updatedAt");
