import { TAB_PARAM, type Tab } from "@/lib/ui/tabs";

import { isImportedXpType } from "./importedXp.constants";
import type { XpHistoryDay, XpLedgerRow } from "./xpHistory.types";

/**
 * A PLAYER'S XP HISTORY, BY DAY — THE PURE HALF.
 *
 * John, 2026-09-14, on his own player page: "there is NO indication how I got my
 * XP. where is the XP history!!!!!" The ledger was already readable — `/me`'s XP
 * tab has drawn it since XP-09 — but only to its owner, one award per line, with
 * nothing saying how a day went or where the total stood. This is what turns a
 * page of that ledger into a history: days, each day's total, and the running
 * total beside every award.
 *
 * Pure and database-free, like `xpHistory.ts` beside it, so the arithmetic is
 * tested as arithmetic. `playerXpHistory.ts` is the read that feeds it.
 */

/**
 * A screenful of a player's history. Fewer than `/me`'s twenty-five: this sits
 * on a page about the whole player, and a day's heading is a row too.
 */
export const XP_HISTORY_PAGE = 15;

/**
 * The player page's own cursor parameter. Not `cursor`: a player's page carries
 * other lists' state in its address, and a bare `cursor` would be read by
 * whichever of them asked first.
 */
export const XP_HISTORY_CURSOR_PARAM = "xp-cursor";

/** The tab on a player's page that holds the history. */
export const XP_HISTORY_TAB = "xp";

/** That tab, as the player page's tab row draws it. */
export const XP_HISTORY_TAB_ENTRY: Tab = { key: XP_HISTORY_TAB, label: "XP", kanji: "経験" };

/** Where on the page the history starts, so "older" lands on it. */
export const XP_HISTORY_ANCHOR = "xp-history";

/**
 * A page of ledger rows as days, with the running total on every award.
 *
 * `olderThanPage` is the sum of every award further down the ledger than the
 * last row on this page — nought on the last page — which is what makes the
 * running total continuous across pages: the bottom award here is that sum plus
 * its own points, and each award above it adds its own. Newest first in, newest
 * first out.
 *
 * Days are CONSECUTIVE runs, not a bucket per key. A member who moves zone can
 * earn two runs under one key with another day between them in time, and
 * merging those would reorder the ledger to make the grouping tidy. Each run
 * reports the whole day's total, which is the true figure for both.
 */
export function xpHistoryDays(
  rows: readonly XpLedgerRow[],
  read: { olderThanPage: number; dayTotals: ReadonlyMap<string, number> },
): XpHistoryDay[] {
  const running: number[] = new Array<number>(rows.length);
  let sum = read.olderThanPage;
  for (let at = rows.length - 1; at >= 0; at -= 1) {
    sum += rows[at].points;
    running[at] = sum;
  }

  const days: XpHistoryDay[] = [];
  rows.forEach((row, at) => {
    const entry = { ...row, runningTotal: running[at], elsewhere: isImportedXpType(row.type) };
    const open = days[days.length - 1];
    if (open !== undefined && open.dayKey === row.dayKey) {
      open.entries.push(entry);
      return;
    }
    days.push({ dayKey: row.dayKey, total: read.dayTotals.get(row.dayKey) ?? null, entries: [entry] });
  });
  return days;
}

/**
 * The address of a page of the history: on the XP tab, at the history, with
 * everything else the address held kept — the record scope above all — and the
 * cursor set, or taken off for the newest page.
 */
export function xpHistoryHref(at: string, params: URLSearchParams, cursor: string | null): string {
  const next = new URLSearchParams(params.toString());
  next.set(TAB_PARAM, XP_HISTORY_TAB);
  if (cursor === null) next.delete(XP_HISTORY_CURSOR_PARAM);
  else next.set(XP_HISTORY_CURSOR_PARAM, cursor);
  return `${at}?${next.toString()}#${XP_HISTORY_ANCHOR}`;
}
