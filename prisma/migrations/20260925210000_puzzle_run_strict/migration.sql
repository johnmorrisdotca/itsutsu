-- Gomoji's Strict becomes a set-up choice (John, 2026-09-25: "have an option strict mode… right now
-- there are no real options for the game"), kept with an unfinished run so Continue opens it Strict.
-- Until now Strict was hard itself, so every run kept before this reads as it was played: Strict
-- exactly when it was a hard Gomoji.
ALTER TABLE "PuzzleRun" ADD COLUMN "strict" BOOLEAN NOT NULL DEFAULT false;
UPDATE "PuzzleRun" SET "strict" = true WHERE "level" = 'hard' AND "kind" IN ('gomoji', 'gomojiKana');
