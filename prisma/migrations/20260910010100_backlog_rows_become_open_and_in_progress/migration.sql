-- Every row said in the board's new words.
--
--   proposed -> open        asked for, nobody on it
--   planned  -> open        the same thing: there is no gap here between
--                           agreeing to something and starting it, which is
--                           why this column was empty every day it existed
--   building -> inProgress  somebody has it right now
--
-- Reversible, and the reverse is in the ticket: inProgress -> building, and
-- open -> proposed, which loses only a distinction that never held anything.
UPDATE "BacklogItem" SET "status" = 'open'       WHERE "status" IN ('proposed', 'planned');
UPDATE "BacklogItem" SET "status" = 'inProgress' WHERE "status" = 'building';

-- A row arriving with nothing said about it is open, not proposed.
ALTER TABLE "BacklogItem" ALTER COLUMN "status" SET DEFAULT 'open';
