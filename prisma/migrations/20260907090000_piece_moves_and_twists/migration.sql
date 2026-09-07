-- Piece moves and quadrant twists.
--
-- Four nullable columns on Move. A stone placed in a game without pieces or
-- twists leaves all four null, which is every move recorded so far.

ALTER TABLE "Move" ADD COLUMN "fromRow" INTEGER;
ALTER TABLE "Move" ADD COLUMN "fromCol" INTEGER;
ALTER TABLE "Move" ADD COLUMN "twistQuadrant" INTEGER;
ALTER TABLE "Move" ADD COLUMN "twistClockwise" BOOLEAN;
