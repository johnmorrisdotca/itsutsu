-- WordDrop is Gomoji (John, 2026-09-25: "It's ok to break internal. No backwards compatibility",
-- then "yes you can delete the games, or just migrate them"). Migrated, so every word, score and
-- kept run stays the player's. Every place a puzzle's kind is written is renamed in one go:
-- the three puzzle tables, the inbox, and the XP ledger's subjects, so nothing earned points at a
-- kind that no longer exists and no "first of this puzzle" is paid a second time under the new name.
-- The longer name first: 'wordDropKana' also begins with 'wordDrop'.

UPDATE "PuzzleSolve" SET "kind" = 'gomojiKana' WHERE "kind" = 'wordDropKana';
UPDATE "PuzzleSolve" SET "kind" = 'gomoji' WHERE "kind" = 'wordDrop';

UPDATE "PuzzleRun" SET "kind" = 'gomojiKana' WHERE "kind" = 'wordDropKana';
UPDATE "PuzzleRun" SET "kind" = 'gomoji' WHERE "kind" = 'wordDrop';

UPDATE "PuzzleRace" SET "kind" = 'gomojiKana' WHERE "kind" = 'wordDropKana';
UPDATE "PuzzleRace" SET "kind" = 'gomoji' WHERE "kind" = 'wordDrop';

UPDATE "InboxItem" SET "variant" = 'gomojiKana' WHERE "variant" = 'wordDropKana';
UPDATE "InboxItem" SET "variant" = 'gomoji' WHERE "variant" = 'wordDrop';

-- The tour's "first of this puzzle", keyed on the kind itself.
UPDATE "XpEvent" SET "subject" = 'gomojiKana' WHERE "type" = 'firstOfVariant' AND "subject" = 'wordDropKana';
UPDATE "XpEvent" SET "subject" = 'gomoji' WHERE "type" = 'firstOfVariant' AND "subject" = 'wordDrop';

-- A solve or a word played out, keyed on "kind:size:hash of the givens".
UPDATE "XpEvent" SET "subject" = 'gomojiKana:' || substring("subject" from 14)
  WHERE "type" IN ('puzzleSolved', 'puzzleEnded') AND "subject" LIKE 'wordDropKana:%';
UPDATE "XpEvent" SET "subject" = 'gomoji:' || substring("subject" from 10)
  WHERE "type" IN ('puzzleSolved', 'puzzleEnded') AND "subject" LIKE 'wordDrop:%';
