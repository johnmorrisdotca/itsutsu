-- Grading a row: how much it matters, and how much work it is.
--
-- Both nullable and neither defaulted. There are a hundred and eleven rows on
-- the board and none of them have been judged; giving them all "normal" and
-- "medium" would write a judgement nobody made onto every one, and afterwards
-- there would be no way to tell those from the ones somebody meant. Null says
-- "not graded", which is true, and it also shows how much of the board anybody
-- has actually looked at.
CREATE TYPE "BacklogPriority" AS ENUM ('high', 'normal', 'low');
CREATE TYPE "BacklogEffort" AS ENUM ('small', 'medium', 'large');

ALTER TABLE "BacklogItem" ADD COLUMN "priority" "BacklogPriority";
ALTER TABLE "BacklogItem" ADD COLUMN "effort" "BacklogEffort";
