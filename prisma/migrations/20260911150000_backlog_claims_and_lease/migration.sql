-- AlterTable
ALTER TABLE "BacklogItem"
  ADD COLUMN     "claimedBy" VARCHAR(80),
  ADD COLUMN     "claimedAt" TIMESTAMP(3),
  ADD COLUMN     "releasedAt" TIMESTAMP(3);

-- Move the current holders into the claim before the old column goes. A row
-- with no assignee moves nothing: claimedBy stays null, which is the honest
-- "nobody has it" rather than a hold with an empty name.
UPDATE "BacklogItem" SET "claimedBy" = "assignedTo", "claimedAt" = "movedAt"
  WHERE status = 'inProgress' AND "assignedTo" <> '';

-- AlterTable
ALTER TABLE "BacklogItem" DROP COLUMN "assignedTo";
