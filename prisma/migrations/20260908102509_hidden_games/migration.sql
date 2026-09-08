-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "hiddenByBlack" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hiddenByWhite" BOOLEAN NOT NULL DEFAULT false;
