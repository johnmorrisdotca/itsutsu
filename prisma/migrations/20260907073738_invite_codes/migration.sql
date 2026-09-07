-- Invite codes.
--
-- Purely additive: a new table, no change to Game or Move, so an older client
-- against this schema keeps working exactly as before.

CREATE TABLE "InviteCode" (
    "code" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER NOT NULL DEFAULT 0,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT NOT NULL DEFAULT '',
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "InviteCode_pkey" PRIMARY KEY ("code")
);

CREATE INDEX "InviteCode_createdAt_idx" ON "InviteCode"("createdAt");
CREATE INDEX "InviteCode_revoked_expiresAt_idx" ON "InviteCode"("revoked", "expiresAt");
