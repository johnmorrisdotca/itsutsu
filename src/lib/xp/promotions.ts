import { XP_LEVELS, xpForLevel, xpLevelFor } from "./xpCurve";
import { xpDayKey } from "./xpDay";
import type { Promotion, PromotionBatch, PromotionsCursor } from "./promotions.types";

/**
 * WHO WENT UP A LEVEL, DERIVED FROM THE LEDGER AND STORED NOWHERE.
 *
 * John, looking at /xp and a level's page: "BUG: Where is the recent promotions
 * page?" There was none, and nothing recorded a level-up to build one from — the
 * toast is a courtesy that is replaced by the next award, and a level is read
 * from `Member.xp` rather than kept beside it (`xpCurve.ts` says why: a stored
 * level is a cached copy of a table that is meant to be retuned).
 *
 * The ledger is enough, and nothing new is stored. `XpEvent.points` is what was
 * paid at the time and `Member.xp` is their sum, so the running total per member
 * in the order the rows were written is the total as it actually moved, and a
 * promotion is a batch after which that total stands on a higher rung than it
 * did before. The query does the running sum and the crossing test in SQL, so the
 * newest-first cap is applied to promotions and not to rows filtered afterwards —
 * see `promotionsRead.ts`. This module is what is pure about it: the rungs the
 * query is handed, the line a crossing becomes, and the page cursor.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ONE AWARD OVER SEVERAL RUNGS IS ONE LINE: "Lv 3 → Lv 5"
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A single batch can carry somebody over more than one level — the ramp at the
 * bottom is 50 XP a rung and a won game against a person pays more than that.
 * It is shown as one promotion from where they stood to where they arrived,
 * rather than as two lines at the same moment, because it was one moment: the
 * toast said the same (`levelCrossed` reports `from` and `to`), and two rows
 * would claim a stop on the middle rung that nobody made.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * A PROMOTION A BACKFILL PAID IS SAID TO BE ONE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The XP backfill replayed production's games on 2026-09-13 through `awardXp`
 * with each game's own moment as `now`. That files every row under the day of
 * the play (`dayKey`), and `createdAt` — the column's default — says when the
 * replay inserted it. So a backfilled batch is one whose day is EARLIER than the
 * day it was written, in the member's own zone, and that is what `paidLater`
 * reads. A promotion it produced is not presented as earned on the day of the
 * replay: the page gives the replay's date as when the total crossed and the day
 * of the play beside it.
 *
 * Any later replay or pay run that files an award under an earlier day is marked
 * the same way, with nothing to add here. Two edges, both named rather than
 * hidden: a member who has moved to a zone further east since an award can have
 * a live one read as a day late, and so can an award whose request began a few
 * milliseconds before midnight and whose transaction began after it. Both are a
 * day out, and both err towards saying "for play on" about a real day's play.
 */

/** How many promotions one page shows. */
export const PROMOTIONS_PAGE = 50;

/**
 * THE XP AT WHICH EACH RUNG FROM LEVEL 2 UP BEGINS, ascending — handed to the
 * query, whose `width_bucket(total, rungs) + 1` is the level a total stands on.
 *
 * Read off `xpForLevel` rather than written again, so a retune of the curve moves
 * the promotions page with everything else and there is no second table to keep
 * in step. `promotions.test.ts` holds the bucket arithmetic to `xpLevelFor` at
 * every boundary.
 */
export const LEVEL_THRESHOLDS: readonly number[] = Array.from({ length: XP_LEVELS - 1 }, (_, index) =>
  xpForLevel(index + 2),
);

/**
 * The day of the play this batch paid for, where a replay filed it under a day
 * earlier than the day it was written — or null for an award earned when it was
 * written. See the header for what that reads and its two edges.
 */
export function paidLater(at: Date, dayKey: string, timeZone: string): string | null {
  return dayKey < xpDayKey(at, timeZone) ? dayKey : null;
}

/**
 * The line a batch becomes, or null where it crossed nothing.
 *
 * Null is not expected from the query, which only returns batches that crossed —
 * but the levels here come from `xpLevelFor`, the one reading of the curve every
 * badge on the site uses, and a batch this cannot see a crossing in is left out
 * rather than drawn as a promotion from a level to itself.
 */
export function promotionOf(batch: PromotionBatch): Promotion | null {
  const from = xpLevelFor(batch.before);
  const to = xpLevelFor(batch.after);
  if (to <= from) return null;
  return {
    memberId: batch.memberId,
    name: batch.name,
    computer: batch.botTier !== null,
    from,
    to,
    at: batch.at,
    paidLater: paidLater(batch.at, batch.dayKey, batch.timeZone),
  };
}

/**
 * THE CURSOR FOR THE PAGE AFTER A PROMOTION: its moment and its member.
 *
 * `(at, memberId)` is unique — two batches for one member in one millisecond
 * would have been one transaction — so a page never repeats or skips a line. The
 * moment is written as milliseconds, which is the precision the column holds, and
 * `.` separates it from the id, since neither a number nor a member id holds one.
 */
export function promotionsCursor(promotion: Pick<Promotion, "at" | "memberId">): string {
  return `${promotion.at.getTime()}.${promotion.memberId}`;
}

/** A cursor read back, or null for anything that is not one — which starts at the newest. */
export function readPromotionsCursor(raw: string | string[] | undefined): PromotionsCursor | null {
  if (typeof raw !== "string") return null;
  const dot = raw.indexOf(".");
  if (dot <= 0 || dot === raw.length - 1) return null;
  const ms = Number(raw.slice(0, dot));
  const memberId = raw.slice(dot + 1);
  if (!Number.isSafeInteger(ms) || ms < 0 || memberId.length > 64 || !/^[A-Za-z0-9_-]+$/.test(memberId)) return null;
  return { at: new Date(ms), memberId };
}
