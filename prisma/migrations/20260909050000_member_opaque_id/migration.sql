-- A member's own name for the database: opaque, given once, never derived
-- from an address or a display name. Nothing points at it yet; this only
-- brings it into being so that ratings, records and seats can be moved onto
-- it one at a time afterwards.
ALTER TABLE "Member" ADD COLUMN "id" TEXT;

-- Existing members get one drawn here. Sixteen characters from the same
-- unambiguous alphabet the application draws from — no 0, 1, i, l or o — by
-- taking hex from a random uuid and moving its 0 and 1 out of the way.
-- gen_random_uuid() is volatile, so every row gets its own.
UPDATE "Member"
SET "id" = translate(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16), '01', 'wz')
WHERE "id" IS NULL;

ALTER TABLE "Member" ALTER COLUMN "id" SET NOT NULL;
CREATE UNIQUE INDEX "Member_id_key" ON "Member"("id");

-- Why a row may never be claimed by a real login. Null for everybody: no
-- reason it cannot be.
ALTER TABLE "Member" ADD COLUMN "unclaimableBecause" TEXT;
