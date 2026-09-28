ALTER TABLE "PuzzleRun"
ADD COLUMN "language" TEXT NOT NULL DEFAULT 'english',
ADD COLUMN "gameLength" TEXT NOT NULL DEFAULT 'short',
ADD COLUMN "doubleSet" BOOLEAN NOT NULL DEFAULT false;

DROP INDEX "PuzzleRun_memberId_kind_size_level_seed_key";
CREATE UNIQUE INDEX "PuzzleRun_memberId_kind_size_language_gameLength_doubleSet_level_seed_key"
ON "PuzzleRun"("memberId", "kind", "size", "language", "gameLength", "doubleSet", "level", "seed");

ALTER TABLE "PuzzleRace"
ADD COLUMN "language" TEXT NOT NULL DEFAULT 'english',
ADD COLUMN "gameLength" TEXT NOT NULL DEFAULT 'short',
ADD COLUMN "doubleSet" BOOLEAN NOT NULL DEFAULT false;
