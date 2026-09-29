-- Postgres keeps 63 characters of a name, so the index 20260928140000 created
-- was cut to "…_leve", while Prisma names it by its own shortening. The deploy's
-- drift check refused the difference; this gives the index Prisma's name.
ALTER INDEX "PuzzleRun_memberId_kind_size_language_gameLength_doubleSet_leve" RENAME TO "PuzzleRun_memberId_kind_size_language_gameLength_doubleSet__key";
