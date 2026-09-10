-- The board's two new statuses.
--
-- Added on their own, and used only in the migration after this one: Postgres
-- will not let a value be added to an enum and then used inside the same
-- transaction, and Prisma runs each migration file in one. Splitting them is
-- not tidiness, it is the only way this runs at all.
ALTER TYPE "BacklogStatus" ADD VALUE IF NOT EXISTS 'open';
ALTER TYPE "BacklogStatus" ADD VALUE IF NOT EXISTS 'inProgress';
