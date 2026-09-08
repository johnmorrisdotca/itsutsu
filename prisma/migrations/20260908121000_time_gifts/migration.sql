-- CreateTable
CREATE TABLE "TimeGift" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "giver" TEXT NOT NULL,
    "givenMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeGift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeGift_gameId_idx" ON "TimeGift"("gameId");

-- AddForeignKey
ALTER TABLE "TimeGift" ADD CONSTRAINT "TimeGift_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
