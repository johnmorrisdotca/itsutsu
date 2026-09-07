-- The seed a game was created with.
--
-- Additive. Every game recorded before this had nothing random in it, which
-- is exactly what seed 0 means: the seed only matters to the variants that
-- scatter squares or draw pieces, and none of those existed yet.

ALTER TABLE "Game" ADD COLUMN "seed" INTEGER NOT NULL DEFAULT 0;
