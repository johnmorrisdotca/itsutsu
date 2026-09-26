-- Test players are the Test kind (unclaimableBecause = 'test'), not a column of their own.
-- Pushed only once the build that no longer names the column is live. Drops its index with it.
ALTER TABLE "Member" DROP COLUMN "isTest";
