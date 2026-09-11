-- A game remembers whose turn it is, so a list of them need not replay them.
--
-- Both columns are nullable with no default on purpose. Every game that exists
-- today gets NULL, which reads as "nothing has been written here" and sends the
-- reader back to the replay it already did. A default of 'black' would be a
-- judgement nobody made, written onto every row and indistinguishable from one
-- somebody's move had settled.
ALTER TABLE "Game" ADD COLUMN "settledStatus" TEXT;
ALTER TABLE "Game" ADD COLUMN "settledToPlay" TEXT;
