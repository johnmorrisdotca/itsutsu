-- How long a finished game stays in a member's own list, in days; 0 keeps
-- them all, which is what everybody has until they change it. It hides games
-- from that one list and from nowhere else: the record keeps every game, the
-- ratings are untouched, and each game stays at its own address.
ALTER TABLE "Member" ADD COLUMN "keepFinishedDays" INTEGER NOT NULL DEFAULT 0;
