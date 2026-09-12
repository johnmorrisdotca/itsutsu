-- A member keeps the run over every game they have played.
--
-- The fourth scope, and the first one keyed to a member rather than to a
-- folded name. `Player` holds three runs — the ladder's pool, the computer
-- pool, and both pools together — and every one of them counts RATED games
-- only, because a rating row is what a rated game writes. The PLAYED column
-- beside them counts every finished game since 0.147.1, so none of the three
-- is the set a reader sees, and the members list and a member's own line
-- printed a dash rather than describe a rated run as a run over every game.
--
-- ON "Member" BECAUSE THE SET IS MEMBER-KEYED. The number this run sits beside
-- comes from `fetchPlayedTallies`, which matches on the seat's member id and
-- never on a name; `Player.key` is a folded name that does not move when
-- somebody renames, and a Player row only exists once a rated game has been
-- recorded. Neither of those can answer for a member's friendly games.
--
-- Additive: nullable kind, defaulted count. Nothing already stored moves, and
-- a row nobody has backfilled reads as "no run recorded" rather than as a run
-- of nought — see `rating/streak.ts`, which owns that distinction.
-- `src/lib/rating/backfillStreaks.play.test.ts` fills it in from the games,
-- and writes a member's run only where its own rebuild reproduces exactly what
-- `fetchPlayedTallies` reports for that member.

ALTER TABLE "Member"
  ADD COLUMN "playedStreakKind"  TEXT,
  ADD COLUMN "playedStreakCount" INTEGER NOT NULL DEFAULT 0;
