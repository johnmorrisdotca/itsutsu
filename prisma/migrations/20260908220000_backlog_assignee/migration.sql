-- Who has picked an item up. Free text, like askedBy, and empty for most rows.
ALTER TABLE "BacklogItem" ADD COLUMN "assignedTo" TEXT NOT NULL DEFAULT '';
