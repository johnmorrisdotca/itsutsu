-- The kept records become members like anybody else.
--
-- One identity mechanism across the site rather than a second, name-keyed
-- one preserved for ever as a special case for imports. Chibi and Kyokosan
-- get a row of the same shape as every other member, simply never signed in;
-- if either is ever claimed by a real person, a claim flow links a login to
-- the row that is already here.
--
-- Their ids are curated rather than drawn. The characters come from the words
-- and years John chose, with each character the alphabet forbids swapped for
-- the one it is banned for looking like — i for j, o for q, 1 for 7, 0 for q
-- — so the name survives at a glance and nothing ambiguous survives with it.
-- See idCharacters in src/lib/auth/memberId.ts.
--
-- The address is a placeholder and is meant to be. Member is still keyed by
-- email until the key moves to the id, and these people have no address; the
-- .invalid domain is reserved by RFC 2606 for exactly this, so it can never
-- collide with a real one or be mailed by accident.
INSERT INTO "Member" ("email", "id", "name", "picture", "invitedWith", "unclaimableBecause", "showOnline", "emailNotify")
VALUES
  ('chjb-jjac-k794-q84@kept.invalid', 'chjb-jjac-k794-q84', 'Chibi', '', 'kept-record', 'kept-record', false, false),
  ('kyqk-qsan-japa-n794-5@kept.invalid', 'kyqk-qsan-japa-n794-5', 'Kyokosan', '', 'kept-record', 'kept-record', false, false)
ON CONFLICT ("email") DO NOTHING;

-- Their ratings, if any are ever earned under those names, hang off the id.
UPDATE "Player" p SET "memberId" = m."id"
FROM "Member" m
WHERE p."memberId" IS NULL AND m."unclaimableBecause" = 'kept-record'
  AND lower(btrim(regexp_replace(m."name", '\s+', ' ', 'g'))) = p."key";

UPDATE "PlayerVariantRating" v SET "memberId" = m."id"
FROM "Member" m
WHERE v."memberId" IS NULL AND m."unclaimableBecause" = 'kept-record'
  AND lower(btrim(regexp_replace(m."name", '\s+', ' ', 'g'))) = v."key";
