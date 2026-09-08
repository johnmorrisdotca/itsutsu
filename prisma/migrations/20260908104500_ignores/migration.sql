-- CreateTable
CREATE TABLE "Ignore" (
    "owner" TEXT NOT NULL,
    "ignored" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ignore_pkey" PRIMARY KEY ("owner","ignored")
);

-- CreateIndex
CREATE INDEX "Ignore_ignored_idx" ON "Ignore"("ignored");
