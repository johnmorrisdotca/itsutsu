-- A seat is held by a person, so it holds their opaque id rather than their
-- address. New columns rather than new contents in the old ones: renaming what
-- a column means leaves every reader compiling happily against the wrong
-- thing, and a member who silently stops recognising their own seat is the
-- worst way for that to show up.
ALTER TABLE "Game" ADD COLUMN "blackMemberId" TEXT;
ALTER TABLE "Game" ADD COLUMN "whiteMemberId" TEXT;

UPDATE "Game" g SET "blackMemberId" = m."id" FROM "Member" m WHERE g."blackMember" = m."email";
UPDATE "Game" g SET "whiteMemberId" = m."id" FROM "Member" m WHERE g."whiteMember" = m."email";

DROP INDEX IF EXISTS "Game_blackMember_idx";
DROP INDEX IF EXISTS "Game_whiteMember_idx";
ALTER TABLE "Game" DROP COLUMN "blackMember";
ALTER TABLE "Game" DROP COLUMN "whiteMember";

CREATE INDEX "Game_blackMemberId_idx" ON "Game"("blackMemberId");
CREATE INDEX "Game_whiteMemberId_idx" ON "Game"("whiteMemberId");
