-- CreateEnum
CREATE TYPE "BacklogStatus" AS ENUM ('proposed', 'planned', 'building', 'done', 'dropped');

-- CreateEnum
CREATE TYPE "BacklogKind" AS ENUM ('feature', 'fix', 'chore');

-- CreateTable
CREATE TABLE "BacklogItem" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "kind" "BacklogKind" NOT NULL DEFAULT 'feature',
    "status" "BacklogStatus" NOT NULL DEFAULT 'proposed',
    "askedBy" TEXT NOT NULL DEFAULT '',
    "addedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BacklogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BacklogItem_key_key" ON "BacklogItem"("key");

-- CreateIndex
CREATE INDEX "BacklogItem_status_movedAt_idx" ON "BacklogItem"("status", "movedAt");

-- CreateIndex
CREATE INDEX "BacklogItem_createdAt_idx" ON "BacklogItem"("createdAt");
