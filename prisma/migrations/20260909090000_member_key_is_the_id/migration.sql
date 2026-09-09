-- The key moves off the address.
--
-- The last step of four. An address is how somebody signs in, not what they
-- are: it changes, it is personal, and it was never a good name for a row.
-- Everything that needed to point at a member — the ratings, the standings,
-- the seats — already points at the opaque id, so this is the change that is
-- finally safe to make.
ALTER TABLE "Member" DROP CONSTRAINT "Member_pkey";
ALTER TABLE "Member" ADD CONSTRAINT "Member_pkey" PRIMARY KEY ("id");

-- The primary key indexes the id now, so the unique index that stood in for
-- it while it was only a column is redundant.
DROP INDEX IF EXISTS "Member_id_key";

-- An address becomes optional, because a kept record has none.
ALTER TABLE "Member" ALTER COLUMN "email" DROP NOT NULL;

-- And the placeholders go. Chibi and Kyokosan never had an address; they were
-- given one at kept.invalid only because this table demanded it. Null is the
-- honest answer and it is now allowed.
UPDATE "Member" SET "email" = NULL WHERE "email" LIKE '%@kept.invalid';
