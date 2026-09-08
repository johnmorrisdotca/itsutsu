-- CreateTable
CREATE TABLE "AutoMatchRequest" (
    "id" TEXT NOT NULL,
    "member" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "moveTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoMatchRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutoMatchRequest_variant_moveTimeMs_createdAt_idx" ON "AutoMatchRequest"("variant", "moveTimeMs", "createdAt");

-- CreateIndex
CREATE INDEX "AutoMatchRequest_member_idx" ON "AutoMatchRequest"("member");
