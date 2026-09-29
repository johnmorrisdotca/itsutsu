-- The colour each seat chose for its pieces (src/lib/pieces/pieceColours.ts).
-- Additive only: three nullable columns, no index, no default. Null is "never
-- chose", drawn exactly as before, so every existing game and table is unchanged.

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "blackColour" TEXT,
ADD COLUMN     "whiteColour" TEXT;

-- AlterTable
ALTER TABLE "PartySeat" ADD COLUMN     "colour" TEXT;
