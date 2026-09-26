-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "isTest" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Member_isTest_idx" ON "Member"("isTest");
