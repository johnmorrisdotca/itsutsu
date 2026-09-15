-- THE BUDDY LIST, THE IGNORE LIST AND APPLAUSE, KEPT BY MEMBER ID RATHER THAN BY ADDRESS.
--
-- All three were keyed by a member's folded email address. A member who joins
-- with an invite code has no address, so they could not keep a buddy, ignore
-- anybody, be ignored, or leave a mark. An id is who somebody is; an address is
-- only how some members sign in.
--
-- Every existing row is carried across by matching its address to the member
-- who holds it. A row whose address has NO member row cannot be carried — there
-- is nobody on that end — and it is SET ASIDE into "SocialRowWithoutMember"
-- rather than dropped, so nothing anybody chose disappears without a trace.
--
-- Before running this against production, count what will be set aside:
--
--   SELECT 'buddy' AS kind, count(*) FROM "Buddy" b
--     WHERE NOT EXISTS (SELECT 1 FROM "Member" m WHERE m."email" = b."owner")
--        OR NOT EXISTS (SELECT 1 FROM "Member" m WHERE m."email" = b."buddy")
--   UNION ALL
--   SELECT 'ignore', count(*) FROM "Ignore" i
--     WHERE NOT EXISTS (SELECT 1 FROM "Member" m WHERE m."email" = i."owner")
--        OR NOT EXISTS (SELECT 1 FROM "Member" m WHERE m."email" = i."ignored")
--   UNION ALL
--   SELECT 'applause', count(*) FROM "Applause" a
--     WHERE NOT EXISTS (SELECT 1 FROM "Member" m WHERE m."email" = a."member");

-- CreateTable
CREATE TABLE "SocialRowWithoutMember" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "setAsideAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialRowWithoutMember_pkey" PRIMARY KEY ("id")
);

-- ── Buddy ────────────────────────────────────────────────────────────────────
ALTER TABLE "Buddy" ADD COLUMN "ownerId" TEXT, ADD COLUMN "buddyId" TEXT;
UPDATE "Buddy" b SET "ownerId" = m."id" FROM "Member" m WHERE m."email" = b."owner";
UPDATE "Buddy" b SET "buddyId" = m."id" FROM "Member" m WHERE m."email" = b."buddy";
INSERT INTO "SocialRowWithoutMember" ("id", "kind", "owner", "target", "createdAt")
  SELECT gen_random_uuid()::text, 'buddy', "owner", "buddy", "createdAt"
  FROM "Buddy" WHERE "ownerId" IS NULL OR "buddyId" IS NULL;
DELETE FROM "Buddy" WHERE "ownerId" IS NULL OR "buddyId" IS NULL;

ALTER TABLE "Buddy" DROP CONSTRAINT "Buddy_pkey";
DROP INDEX "Buddy_buddy_idx";
ALTER TABLE "Buddy" DROP COLUMN "owner", DROP COLUMN "buddy";
ALTER TABLE "Buddy" ALTER COLUMN "ownerId" SET NOT NULL, ALTER COLUMN "buddyId" SET NOT NULL;
ALTER TABLE "Buddy" ADD CONSTRAINT "Buddy_pkey" PRIMARY KEY ("ownerId", "buddyId");
CREATE INDEX "Buddy_buddyId_idx" ON "Buddy"("buddyId");
ALTER TABLE "Buddy" ADD CONSTRAINT "Buddy_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Buddy" ADD CONSTRAINT "Buddy_buddyId_fkey" FOREIGN KEY ("buddyId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Ignore ───────────────────────────────────────────────────────────────────
ALTER TABLE "Ignore" ADD COLUMN "ownerId" TEXT, ADD COLUMN "ignoredId" TEXT;
UPDATE "Ignore" i SET "ownerId" = m."id" FROM "Member" m WHERE m."email" = i."owner";
UPDATE "Ignore" i SET "ignoredId" = m."id" FROM "Member" m WHERE m."email" = i."ignored";
INSERT INTO "SocialRowWithoutMember" ("id", "kind", "owner", "target", "createdAt")
  SELECT gen_random_uuid()::text, 'ignore', "owner", "ignored", "createdAt"
  FROM "Ignore" WHERE "ownerId" IS NULL OR "ignoredId" IS NULL;
DELETE FROM "Ignore" WHERE "ownerId" IS NULL OR "ignoredId" IS NULL;

ALTER TABLE "Ignore" DROP CONSTRAINT "Ignore_pkey";
DROP INDEX "Ignore_ignored_idx";
ALTER TABLE "Ignore" DROP COLUMN "owner", DROP COLUMN "ignored";
ALTER TABLE "Ignore" ALTER COLUMN "ownerId" SET NOT NULL, ALTER COLUMN "ignoredId" SET NOT NULL;
ALTER TABLE "Ignore" ADD CONSTRAINT "Ignore_pkey" PRIMARY KEY ("ownerId", "ignoredId");
CREATE INDEX "Ignore_ignoredId_idx" ON "Ignore"("ignoredId");
ALTER TABLE "Ignore" ADD CONSTRAINT "Ignore_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Ignore" ADD CONSTRAINT "Ignore_ignoredId_fkey" FOREIGN KEY ("ignoredId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Applause ─────────────────────────────────────────────────────────────────
ALTER TABLE "Applause" ADD COLUMN "memberId" TEXT;
UPDATE "Applause" a SET "memberId" = m."id" FROM "Member" m WHERE m."email" = a."member";
INSERT INTO "SocialRowWithoutMember" ("id", "kind", "owner", "target", "createdAt")
  SELECT gen_random_uuid()::text, 'applause', "member", "gameId" || ':' || "emoji", "createdAt"
  FROM "Applause" WHERE "memberId" IS NULL;
DELETE FROM "Applause" WHERE "memberId" IS NULL;

DROP INDEX "Applause_gameId_member_key";
ALTER TABLE "Applause" DROP COLUMN "member";
ALTER TABLE "Applause" ALTER COLUMN "memberId" SET NOT NULL;
CREATE UNIQUE INDEX "Applause_gameId_memberId_key" ON "Applause"("gameId", "memberId");
ALTER TABLE "Applause" ADD CONSTRAINT "Applause_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
