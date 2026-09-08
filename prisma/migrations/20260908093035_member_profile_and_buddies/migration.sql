-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "bio" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "city" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "country" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "emailNotify" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showOnline" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "Buddy" (
    "owner" TEXT NOT NULL,
    "buddy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Buddy_pkey" PRIMARY KEY ("owner","buddy")
);

-- CreateIndex
CREATE INDEX "Buddy_buddy_idx" ON "Buddy"("buddy");
