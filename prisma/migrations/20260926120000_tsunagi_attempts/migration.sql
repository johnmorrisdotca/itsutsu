-- CreateTable
CREATE TABLE "TsunagiAttempt" (
    "memberId" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TsunagiAttempt_pkey" PRIMARY KEY ("memberId","size","level")
);

