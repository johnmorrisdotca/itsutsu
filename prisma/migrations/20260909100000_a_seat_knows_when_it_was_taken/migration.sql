-- A seat records when its link was first used.
--
-- The seat token is the whole credential: POST /api/games/:id/moves plays the
-- seat the token names, with no cookie and no account. The invite panel was
-- rendering both seats' links to whoever held either seat, so each player was
-- shown the other's credential. A link is only shown while its seat is still
-- to be given out, and this is how that is known — nothing already stored
-- answers it, because an anonymous seat has no member id and "has that seat
-- moved yet" leaves a gap between sitting down and moving that can last a day.
ALTER TABLE "Game" ADD COLUMN "blackClaimedAt" TIMESTAMP(3);
ALTER TABLE "Game" ADD COLUMN "whiteClaimedAt" TIMESTAMP(3);

-- Existing games: assume both seats are taken unless the seat is still posted
-- on the noticeboard. That errs towards hiding a link that could have been
-- shown rather than showing one that should be hidden, which is the safe
-- direction for a credential.
UPDATE "Game"
SET "blackClaimedAt" = COALESCE("openedAt", "playedAt"),
    "whiteClaimedAt" = COALESCE("openedAt", "playedAt");

UPDATE "Game" SET "blackClaimedAt" = NULL WHERE "openSeat" = 'black';
UPDATE "Game" SET "whiteClaimedAt" = NULL WHERE "openSeat" = 'white';
