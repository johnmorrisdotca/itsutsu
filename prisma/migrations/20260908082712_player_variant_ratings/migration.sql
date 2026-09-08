-- CreateTable
CREATE TABLE "PlayerVariantRating" (
    "key" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "rating" INTEGER NOT NULL DEFAULT 1600,
    "ratedGames" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerVariantRating_pkey" PRIMARY KEY ("key","variant")
);

-- CreateIndex
CREATE INDEX "PlayerVariantRating_variant_rating_idx" ON "PlayerVariantRating"("variant", "rating");

-- CreateIndex
CREATE INDEX "PlayerVariantRating_key_idx" ON "PlayerVariantRating"("key");
