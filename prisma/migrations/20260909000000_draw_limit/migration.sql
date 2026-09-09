-- The length two players may agree to: "none" plays a game out, "half" and
-- "threeQuarters" call it a draw at that share of the board's points with
-- nobody having won. Every game already recorded becomes "none", which is
-- exactly how it was played, so nothing in the record changes meaning.
ALTER TABLE "Game" ADD COLUMN "drawLimit" TEXT NOT NULL DEFAULT 'none';
