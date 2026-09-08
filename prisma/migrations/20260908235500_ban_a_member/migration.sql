-- Shutting an account: when, and the operator's own note on why.
ALTER TABLE "Member" ADD COLUMN "bannedAt" TIMESTAMP(3);
ALTER TABLE "Member" ADD COLUMN "bannedNote" TEXT NOT NULL DEFAULT '';
