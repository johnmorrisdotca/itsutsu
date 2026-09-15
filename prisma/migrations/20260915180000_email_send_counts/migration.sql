-- CreateTable
CREATE TABLE "EmailSendCount" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSendCount_pkey" PRIMARY KEY ("key")
);
