import "server-only";

import { decodeCursor } from "@/lib/api/paging.cursor";
import { prisma } from "@/lib/prisma";
import type { RecordScope } from "@/lib/rating/recordScope";

import type { XpBoardRow, XpBoardSort } from "./xpBoard";
import { xpGainWindow, xpGainsFrom, xpGainsWhere, type XpGain } from "./xpGains";
import { xpTotalIn } from "./xpScope";

/**
 * THE XP BOARD'S TODAY, 7 DAYS AND BEHIND NEXT, READ.
 *
 * ONE QUERY FOR THE PAGE'S GAINS, never one per row — the `xpByMemberId` rule.
 * A single `groupBy` over `(memberId, dayKey)` for every member on the page,
 * each from the first of their own seven days (`xpGainsWhere`), on
 * `XpEvent_memberId_dayKey_idx`. Twenty-five members is at most 175 groups back,
 * and today and the week are both read out of them. Why the day is a day key
 * and not a `createdAt` range, and why imported credit is never a gain under
 * either scope, is `xpGains.ts`'s header.
 *
 * AND ONE PRIMARY-KEY READ PAST PAGE ONE, for Behind next on the page's first
 * row. The row directly above it is the last row of the page before, and the
 * cursor that opened this page names exactly that row by id — so its total is a
 * `findUnique`, whatever the sort. Nothing is carried in the address: a total
 * handed along in a link would be a figure somebody could type, and one that is
 * stale by the time it is read. Page one asks nothing, since its top row has
 * nobody above it.
 */

export async function fetchXpBoardGains({
  rows,
  now = new Date(),
}: {
  rows: readonly Pick<XpBoardRow, "id" | "timeZone">[];
  now?: Date;
}): Promise<Map<string, XpGain>> {
  if (rows.length === 0) return new Map();
  const windows = new Map(rows.map((row) => [row.id, xpGainWindow(now, row.timeZone)]));
  const sums = await prisma.xpEvent.groupBy({
    by: ["memberId", "dayKey"],
    where: xpGainsWhere(windows),
    _sum: { points: true },
  });
  return xpGainsFrom(
    windows,
    sums.map((sum) => ({ memberId: sum.memberId, dayKey: sum.dayKey, points: sum._sum.points ?? 0 })),
  );
}

/**
 * The total, in this scope, of the row directly above this page's first row —
 * or null on the first page, for a cursor that cannot be read (the board then
 * starts from the top, so its first row IS the top), and for a row that has
 * gone since. Null is drawn as nothing, never as a gap measured from nought.
 */
export async function fetchXpAboveTotal({
  cursor,
  sort,
  scope,
}: {
  cursor: string | null;
  sort: XpBoardSort;
  scope: RecordScope;
}): Promise<number | null> {
  if (cursor === null) return null;
  const after = decodeCursor(cursor, sort);
  if (after === null) return null;
  const row = await prisma.member.findUnique({
    where: { id: after.id },
    select: { xp: true, xpEverywhere: true },
  });
  return row === null ? null : xpTotalIn(row, scope);
}
