-- CreateTable
CREATE TABLE "OperatorAction" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorMemberId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "OperatorAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OperatorAction_at_idx" ON "OperatorAction"("at");

-- CreateIndex
CREATE INDEX "OperatorAction_subjectId_at_idx" ON "OperatorAction"("subjectId", "at");
