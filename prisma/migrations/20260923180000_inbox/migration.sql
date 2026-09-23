-- The inbox: what happened while a member was away.
CREATE TABLE "InboxItem" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "gameId" TEXT,
    "variant" TEXT,
    "fromName" TEXT NOT NULL DEFAULT '',
    "fromMemberId" TEXT,
    "detail" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "InboxItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InboxItem_memberId_createdAt_idx" ON "InboxItem"("memberId", "createdAt");

ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
