-- Three computer players, and a rating pool of their own.
--
-- A computer player is a member like any other: it holds a seat, it appears in
-- the record, and its rating moves when somebody beats it. `botTier` is the
-- only thing that says it is not a person — which the clock needs to know,
-- because a computer is never late, and the directory needs to show.
ALTER TABLE "Member" ADD COLUMN "botTier" TEXT;
CREATE INDEX "Member_botTier_idx" ON "Member"("botTier");

-- The second pool.
--
-- Games against the computer are rated, symmetrically, on both sides — but in
-- a pool of their own. With one pool every rating on the site would drift
-- towards wherever the three graded players settled, because a computer is
-- always available and always willing, and a ladder of people would quietly
-- stop being a ladder of people. The existing columns keep their meaning
-- exactly: `rating` is, and stays, the rating earned against other people, so
-- every page that already shows one shows the same number tomorrow.
ALTER TABLE "Player" ADD COLUMN "computerRating" INTEGER NOT NULL DEFAULT 1600;
ALTER TABLE "Player" ADD COLUMN "computerRatedGames" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Player" ADD COLUMN "computerWins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Player" ADD COLUMN "computerLosses" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Player" ADD COLUMN "computerDraws" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "Player_computerRating_idx" ON "Player"("computerRating");

ALTER TABLE "PlayerVariantRating" ADD COLUMN "computerRating" INTEGER NOT NULL DEFAULT 1600;
ALTER TABLE "PlayerVariantRating" ADD COLUMN "computerRatedGames" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PlayerVariantRating" ADD COLUMN "computerWins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PlayerVariantRating" ADD COLUMN "computerLosses" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PlayerVariantRating" ADD COLUMN "computerDraws" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "PlayerVariantRating_variant_computerRating_idx" ON "PlayerVariantRating"("variant", "computerRating");
