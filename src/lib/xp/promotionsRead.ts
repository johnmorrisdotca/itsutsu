import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DIRECTORY_WHO, type DirectoryWho } from "@/lib/rating/directoryFilter";
import type { RecordScope } from "@/lib/rating/recordScope";

import { IMPORTED_XP_TYPES } from "./importedXp.constants";
import { LEVEL_THRESHOLDS, promotionOf, promotionsCursor, promotionsLeaveOut } from "./promotions";
import type { Promotion, PromotionBatch, PromotionsCursor, PromotionsPage } from "./promotions.types";
import { XP_WHO_DEFAULT } from "./xpWho";

/**
 * ONE PAGE OF RECENT PROMOTIONS, IN ONE QUERY.
 *
 * `promotions.ts` says what a promotion is; this is the read. From the inside
 * out:
 *
 * 1. **Batches.** The ledger grouped by `(memberId, createdAt)` — one award call,
 *    one transaction, one step of the total — less the types the scope leaves
 *    out: every imported type under Itsutsu only, nothing under Everywhere. Each
 *    batch says whether it carries imported credit, which only Everywhere sees.
 * 2. **Running totals.** A window per member in the order the batches were
 *    written gives the total before and after each one: the total as it actually
 *    moved, which is the scope's column — `Member.xp` or `Member.xpEverywhere` —
 *    at every point in its history.
 * 3. **Crossings.** `width_bucket` over the rungs the curve starts each level at
 *    reads the level either side, and only a batch that climbed is kept.
 * 4. **Who, order, cap.** The member is joined for their name and whether they
 *    are a program, the People / Computers narrowing is a condition on that row,
 *    and the newest first cut is taken in the same statement.
 *
 * BOTH SCOPES ARE ONE STATEMENT. The scope arrives as an array of types to leave
 * out, empty under Everywhere, so there is one query to read rather than two that
 * could drift, and `promotions.test.ts` pins what each scope hands it.
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
 */

/** A page of promotions, newest first, for everyone or the narrowing asked for, counted as the scope counts. */
export async function fetchPromotionsPage({
  who = XP_WHO_DEFAULT,
  scope,
  cursor,
  limit,
}: {
  who?: DirectoryWho;
  scope: RecordScope;
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
  const leftOut = [...promotionsLeaveOut(scope)];
  const imported = [...IMPORTED_XP_TYPES];

  const read = await prisma.$queryRaw<PromotionBatch[]>`
    SELECT p."memberId", p."at", p."dayKey", p."before", p."after", p."imported",
           m."name", m."botTier", m."timeZone"
    FROM (
      SELECT b."memberId", b."at", b."dayKey", b."imported",
             (SUM(b."points") OVER w - b."points")::int AS "before",
             (SUM(b."points") OVER w)::int AS "after"
      FROM (
        SELECT "memberId", "createdAt" AS "at", MIN("dayKey") AS "dayKey", SUM("points")::int AS "points",
               bool_or("type" = ANY(${imported}::text[])) AS "imported"
        FROM "XpEvent"
        WHERE NOT ("type" = ANY(${leftOut}::text[]))
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
