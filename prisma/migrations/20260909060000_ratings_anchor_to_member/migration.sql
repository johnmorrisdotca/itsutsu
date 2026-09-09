-- A rating is earned by a person, not by a spelling of their name, so it
-- hangs off the member's opaque id. Nullable and backfilled rather than
-- required: a name typed into a game at one screen belongs to nobody in
-- particular until somebody claims it, and inventing an identity for every
-- such name would be worse than leaving it open.
ALTER TABLE "Player" ADD COLUMN "memberId" TEXT;
ALTER TABLE "PlayerVariantRating" ADD COLUMN "memberId" TEXT;

-- Where a record already stands under a member's own name, it is theirs.
-- Names are compared folded, the way playerKey folds them: trimmed, lower
-- case, inner whitespace collapsed.
UPDATE "Player" p
SET "memberId" = m."id"
FROM "Member" m
WHERE p."memberId" IS NULL
  AND lower(btrim(regexp_replace(m."name", '\s+', ' ', 'g'))) = p."key";

UPDATE "PlayerVariantRating" v
SET "memberId" = m."id"
FROM "Member" m
WHERE v."memberId" IS NULL
  AND lower(btrim(regexp_replace(m."name", '\s+', ' ', 'g'))) = v."key";

CREATE INDEX "Player_memberId_idx" ON "Player"("memberId");
CREATE INDEX "PlayerVariantRating_memberId_idx" ON "PlayerVariantRating"("memberId");
