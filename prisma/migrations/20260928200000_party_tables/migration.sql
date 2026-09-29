-- Party tables played on several devices (docs/plans/party-online/README.md).
-- Additive only: three new tables, every index, unique and foreign key named
-- short and explicitly in the schema (`map:`), so Postgres and Prisma agree.

-- CreateTable
CREATE TABLE "PartyTable" (
    "id" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "state" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'playing',
    "toPlay" INTEGER,
    "winners" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "moveCount" INTEGER NOT NULL DEFAULT 0,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hostMemberId" TEXT,
    "endedByMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "PartyTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartySeat" (
    "tableId" TEXT NOT NULL,
    "seat" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "memberId" TEXT,
    "name" TEXT NOT NULL DEFAULT '',
    "token" TEXT,
    "joinedAt" TIMESTAMP(3),

    CONSTRAINT "PartySeat_pkey" PRIMARY KEY ("tableId","seat")
);

-- CreateTable
CREATE TABLE "PartyAction" (
    "tableId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "seat" INTEGER NOT NULL,
    "move" TEXT NOT NULL,
    "byMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartyAction_pkey" PRIMARY KEY ("tableId","index")
);

-- CreateIndex
CREATE INDEX "PartyTable_status_moved_idx" ON "PartyTable"("status", "movedAt");

-- CreateIndex
CREATE INDEX "PartySeat_member_idx" ON "PartySeat"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "PartySeat_token_key" ON "PartySeat"("token");

-- AddForeignKey
ALTER TABLE "PartySeat" ADD CONSTRAINT "PartySeat_table_fkey" FOREIGN KEY ("tableId") REFERENCES "PartyTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyAction" ADD CONSTRAINT "PartyAction_table_fkey" FOREIGN KEY ("tableId") REFERENCES "PartyTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

