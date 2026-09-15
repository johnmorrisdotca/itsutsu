import "server-only";

import { isRefusal, parseSort } from "@/lib/api/paging";
import { keysetWhere } from "@/lib/api/paging.cursor";
import { prisma } from "@/lib/prisma";

import { XP_LEDGER_SORT } from "./xpHistory.sort";
import { XP_HISTORY_PAGE, xpHistoryDays } from "./xpHistoryDays";
import { xpLedgerPage } from "./xpHistoryPage";
import type { XpHistoryDay, XpLedgerSkips } from "./xpHistory.types";

/**
 * ONE PAGE OF A PLAYER'S XP HISTORY, READ.
 *
 * The page of awards is `xpLedgerPage` — the same read, the same cursor and the
 * same game lookup `/me`'s ledger uses, rather than a second idea of what a
 * page of the ledger is. What this adds is the two figures a history needs and a
 * ledger does not, each one query for the page and never one per row:
 *
 *  - **where the total stood below the page**, one `aggregate` over the awards
 *    further down the ledger than the page's last row, through the very
 *    `keysetWhere` the cursor uses — so "below this page" and "the next page"
 *    are one definition and cannot disagree about a tie. Every award at a game's
 *    end lands in one transaction with one timestamp, so the page boundary falls
 *    inside a tie routinely.
 *  - **each day's whole total**, one `groupBy` over the page's day keys, on
 *    `XpEvent_memberId_dayKey_idx`. A day split by the page boundary reports the
 *    whole day on both pages.
 *
 * Nothing here asks what kind of member it is reading. A program's awards are
 * rows like anyone's, and its history reads exactly as a person's does.
 *
 * Always newest first: the sort is not taken from the address, because the
 * running total is a statement about the ledger's order and the history is read
 * down from today.
 *
 * A row this deploy cannot explain (`XpLedgerSkips`) is still in the ledger's
 * sum wherever it sits below the page; one sitting between two shown rows is
 * not added to the rows above it. It should never exist, and the page says so
 * when it does.
 */

export type PlayerXpHistory = {
  days: XpHistoryDay[];
  /** The cursor for older awards, or null when this page reaches the first. */
  next: string | null;
  skipped: XpLedgerSkips;
};

export async function playerXpHistory({
  memberId,
  cursor,
}: {
  memberId: string;
  cursor: string | null;
}): Promise<PlayerXpHistory> {
  const params = new URLSearchParams({ limit: String(XP_HISTORY_PAGE) });
  if (cursor !== null) params.set("cursor", cursor);
  const sort = parseSort(XP_LEDGER_SORT, new URLSearchParams());
  const page = await xpLedgerPage({ memberId, params });
  /*
   * Neither can be refused — no sort is asked for, so the ledger's own fallback
   * is used — and a refusal here would be a change to `XP_LEDGER_SORT` that
   * broke this reader. Loud, where it was made, rather than a history with no
   * rows and no reason.
   */
  if (isRefusal(sort) || isRefusal(page)) {
    throw new Error("The XP ledger refused its own default order; see XP_LEDGER_SORT.");
  }

  const last = page.items[page.items.length - 1];
  if (last === undefined) return { days: [], next: page.next, skipped: page.skipped };

  const dayKeys = [...new Set(page.items.map((row) => row.dayKey))];
  const [below, perDay] = await Promise.all([
    prisma.xpEvent.aggregate({
      where: {
        memberId,
        ...keysetWhere(XP_LEDGER_SORT, sort, {
          value: last.earnedAt,
          id: last.id,
          sort: { param: sort.column.param, direction: sort.direction },
        }),
      },
      _sum: { points: true },
    }),
    prisma.xpEvent.groupBy({
      by: ["dayKey"],
      where: { memberId, dayKey: { in: dayKeys } },
      _sum: { points: true },
    }),
  ]);

  return {
    days: xpHistoryDays(page.items, {
      olderThanPage: below._sum.points ?? 0,
      dayTotals: new Map(perDay.map((day) => [day.dayKey, day._sum.points ?? 0])),
    }),
    next: page.next,
    skipped: page.skipped,
  };
}
