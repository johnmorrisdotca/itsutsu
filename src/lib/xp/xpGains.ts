import type { Prisma } from "@prisma/client";

import { countText } from "@/lib/rating/figures";

import { IMPORTED_XP_TYPES } from "./importedXp.constants";
import { xpDayKey, type DayKey } from "./xpDay";

/**
 * WHAT A ROW ON THE XP BOARD GAINED, AND HOW FAR IT TRAILS THE ROW ABOVE.
 *
 * John, 2026-09-14: "XP tables aren't useful if they don't tell us how much you
 * went up each day... and how far you are behind the next person." Three
 * columns on `/xp`: Today, 7 days, and Behind next. This is their arithmetic,
 * pure and database-free; `xpBoardGains.ts` is the read.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * "TODAY" IS EACH MEMBER'S OWN DAY, BY `dayKey` — NOT A SLICE OF `createdAt`
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Every award already carries the day it was earned in the earner's own zone
 * (`XpEvent.dayKey`, written by `xpDayKey`). That is the unit the ledger counts
 * in — the day's allowance is a count of one day key, a streak is a run of
 * them, and a player's XP history groups by it — so Today here is the same
 * number the history shows for today on that player's page. A `createdAt`
 * window would have to choose one zone's midnight for the whole board, which is
 * `xpDay.ts`'s warning about ending somebody's day in the afternoon, or be a
 * rolling 24 hours, which is not "today" for anybody. And a day key is on an
 * index (`XpEvent_memberId_dayKey_idx`) where a per-member instant range is not.
 *
 * Today is the member's current day key, read in their zone now; 7 days is that
 * day and the six before it. A key later than today — an award earned under a
 * zone that runs ahead of the one they hold now — is recent by definition, and
 * counts in the seven days but not in today, which is a day it did not fall on.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * A GAIN IS WHAT SOMEBODY EARNED HERE — NEVER CREDIT IMPORTED FROM ELSEWHERE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Under BOTH scopes. The Everywhere total still includes another site's credit,
 * and ranks by it; the two gain columns do not. John's question was how much
 * somebody went up by playing, and imported credit is paid in one go on the day
 * a kept record is imported — the pay that landed on 2026-09-14 would have shown
 * Chibi +1,008,863 in Today and then in 7 days for a week, for no game played.
 * So the ledger read leaves `IMPORTED_XP_TYPES` out whatever the scope, and
 * nothing here takes a scope at all.
 */

/** How many days the second column counts, today included. */
export const XP_GAIN_DAYS = 7;

/** What one member gained, in the board's scope. */
export type XpGain = { today: number; week: number };

/** One member's two windows, as day keys in their own zone. */
export type XpGainWindow = { today: DayKey; from: DayKey };

/** Today, and the first day of the seven, for a member in this zone at this instant. */
export function xpGainWindow(now: Date, timeZone?: string | null): XpGainWindow {
  const today = xpDayKey(now, timeZone);
  // Arithmetic on the day itself, read back as UTC midnight, so it is about the
  // member's calendar and not about the server's.
  const first = new Date(`${today}T00:00:00Z`);
  first.setUTCDate(first.getUTCDate() - (XP_GAIN_DAYS - 1));
  return { today, from: first.toISOString().slice(0, 10) };
}

/**
 * The ledger rows one read must cover for a page of the board: each member from
 * the first of their own seven days, and none of the credit imported from
 * another site, under either scope — see the header.
 */
export function xpGainsWhere(windows: ReadonlyMap<string, XpGainWindow>): Prisma.XpEventWhereInput {
  return {
    OR: [...windows].map(([memberId, window]) => ({ memberId, dayKey: { gte: window.from } })),
    type: { notIn: [...IMPORTED_XP_TYPES] },
  };
}

/**
 * Each member's gains from the read's per-day sums.
 *
 * Every member the read covered gets an answer, and nought is a real one: the
 * ledger was asked about them and holds nothing in the window. A member the read
 * did not cover gets none, so the table can say it does not know rather than
 * print a nought nobody measured.
 */
export function xpGainsFrom(
  windows: ReadonlyMap<string, XpGainWindow>,
  sums: readonly { memberId: string; dayKey: string; points: number }[],
): Map<string, XpGain> {
  const gains = new Map<string, XpGain>([...windows.keys()].map((id) => [id, { today: 0, week: 0 }]));
  for (const sum of sums) {
    const window = windows.get(sum.memberId);
    const gain = gains.get(sum.memberId);
    if (window === undefined || gain === undefined || sum.dayKey < window.from) continue;
    gain.week += sum.points;
    if (sum.dayKey === window.today) gain.today += sum.points;
  }
  return gains;
}

/**
 * How far each row trails the row directly above it, in the order shown.
 *
 * `above` is the total of the row above this page's first — the last row of the
 * page before — or null on the first page, where the top row has nobody above
 * it and the answer is nothing rather than nought. Under the board's own order a
 * gap is never negative; sorted by name or by last earned it can be, and a
 * negative gap is a row AHEAD of the one above, which the table says as such.
 */
export function xpGapsFor(totals: readonly number[], above: number | null): (number | null)[] {
  return totals.map((total, at) => {
    const over = at === 0 ? above : totals[at - 1];
    return over === null ? null : over - total;
  });
}

/** A gain as the board prints it: "+45", "0", or a dash for a member the read did not cover. */
export function xpGainText(points: number | undefined): string {
  if (points === undefined) return "—";
  return points > 0 ? `+${countText(points)}` : "0";
}

/** A gap as the board prints it: blank at the top, a dash for a row ahead of the one above. */
export function xpBehindText(gap: number | null): string {
  if (gap === null) return "";
  return gap < 0 ? "—" : countText(gap);
}
