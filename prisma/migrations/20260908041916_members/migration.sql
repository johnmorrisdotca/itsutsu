-- Members: Google accounts admitted by name, and the seats they hold.
--
-- Additive. A Member row is the whole of registration: Google proves the
-- address, the row says it is welcome. Game gains a member per seat, null for
-- every seat taken so far, since none of them was taken while signed in.

CREATE TABLE "Member" (
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "picture" TEXT NOT NULL DEFAULT '',
    "invitedWith" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("email")
);

ALTER TABLE "Game" ADD COLUMN "blackMember" TEXT;
ALTER TABLE "Game" ADD COLUMN "whiteMember" TEXT;

CREATE INDEX "Game_blackMember_idx" ON "Game"("blackMember");
CREATE INDEX "Game_whiteMember_idx" ON "Game"("whiteMember");
