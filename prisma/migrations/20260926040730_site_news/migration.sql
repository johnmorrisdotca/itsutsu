-- CreateTable
CREATE TABLE "SiteNews" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "memberId" TEXT,
    "variant" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL DEFAULT '',
    "gameId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteNews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteNews_createdAt_idx" ON "SiteNews"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SiteNews_kind_variant_subject_key" ON "SiteNews"("kind", "variant", "subject");

-- CreateIndex
CREATE INDEX "Game_variant_status_idx" ON "Game"("variant", "status");
