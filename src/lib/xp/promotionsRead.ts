import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DIRECTORY_WHO, type DirectoryWho } from "@/lib/rating/directoryFilter";

import { LEVEL_THRESHOLDS, promotionOf, promotionsCursor } from "./promotions";
import type { Promotion, PromotionBatch, PromotionsCursor, PromotionsPage } from "./promotions.types";
import { XP_WHO_DEFAULT } from "./xpWho";

/**
 * ONE PAGE OF RECENT PROMOTIONS, IN ONE QUERY.
 *
 * `promotions.ts` says what a promotion is; this is the read. From the inside
 * out:
 *
 * 1. **Batches.** The ledger grouped by `(memberId, createdAt)` — one award call,
 *    one transaction, one step of the total.
 * 2. **Running totals.** A window per member in the order the batches were
 *    written gives the total before and after each one: the total as it actually
 *    moved, which is `Member.xp` at every point in its history.
 * 3. **Crossings.** `width_bucket` over the rungs the curve starts each level at
 *    reads the level either side, and only a batch that climbed is kept.
 * 4. **Who, order, cap.** The member is joined for their name and whether they
 *    are a program, the People / Computers narrowing is a condition on that row,
 *    and the newest first cut is taken in the same statement.
 *
 * SO THE CAP IS ON PROMOTIONS, NEVER ON ROWS FILTERED AFTERWARDS. Reading the
 * newest fifty ledger rows and looking for crossings among them would page a list
 * the reader is not looking at, and the fifty-first promotion could be anywhere.
 *
 * WHAT IT COSTS. One statement per page, whatever the page holds — no read per
 * member. It reads the whole ledger to rebuild the running totals, because a
 * total at any point depends on every row before it and nothing stores one; on
 * the development database's 3,786 rows that is about 11 ms. A stored running
 * total would be the first thing to add if the ledger ever grows past being
 * cheap to scan, and it would be a second copy of `Member.xp` to keep in step,
 * which is why it is not added before it is needed.
 *
 * IMPORTED EXPERIENCE (PR #14, not yet merged) is written to this same ledger
 * under its own types and kept out of `Member.xp`. Promotions are read from the
 * Itsutsu total, so when it lands this reads `type NOT IN IMPORTED_XP_TYPES`, and
 * an Everywhere view would be a second running total including them.
 */

/** A page of promotions, newest first, for everyone or the narrowing asked for. */
export async function fetchPromotionsPage({
  who = XP_WHO_DEFAULT,
  cursor,
  limit,
}: {
  who?: DirectoryWho;
  cursor: PromotionsCursor | null;
  limit: number;
}): Promise<PromotionsPage> {
  const narrowing =
    who === DIRECTORY_WHO.people
      ? Prisma.sql`AND m."botTier" IS NULL`
      : who === DIRECTORY_WHO.computers
        ? Prisma.sql`AND m."botTier" IS NOT NULL`
        : Prisma.empty;
  /*
   * Strictly older than the last line of the page before. `createdAt` is a
   * timestamp with no zone holding UTC, so the moment goes in as UTC text and is
   * read as that column's own kind rather than converted through the session's zone.
   */
  const older =
    cursor === null
      ? Prisma.empty
      : Prisma.sql`AND (p."at", p."memberId") < (${cursor.at.toISOString().replace("Z", "")}::timestamp(3), ${cursor.memberId})`;
  const rungs = [...LEVEL_THRESHOLDS];

  const read = await prisma.$queryRaw<PromotionBatch[]>`
    SELECT p."memberId", p."at", p."dayKey", p."before", p."after",
           m."name", m."botTier", m."timeZone"
    FROM (
      SELECT b."memberId", b."at", b."dayKey",
             (SUM(b."points") OVER w - b."points")::int AS "before",
             (SUM(b."points") OVER w)::int AS "after"
      FROM (
        SELECT "memberId", "createdAt" AS "at", MIN("dayKey") AS "dayKey", SUM("points")::int AS "points"
        FROM "XpEvent"
        GROUP BY "memberId", "createdAt"
      ) b
      WINDOW w AS (PARTITION BY b."memberId" ORDER BY b."at" ROWS UNBOUNDED PRECEDING)
    ) p
    JOIN "Member" m ON m."id" = p."memberId"
    WHERE width_bucket(p."after", ${rungs}::int[]) > width_bucket(p."before", ${rungs}::int[])
      ${narrowing}
      ${older}
    ORDER BY p."at" DESC, p."memberId" DESC
    LIMIT ${limit + 1}
  `;

  // One further than the page, so "is there more" needs no second query.
  const page = read.slice(0, limit);
  const items = page.map(promotionOf).filter((one): one is Promotion => one !== null);
  const last = page[page.length - 1];
  return {
    items,
    next: read.length > limit && last !== undefined ? promotionsCursor(last) : null,
  };
}
