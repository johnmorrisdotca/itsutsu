import { describe, expect, it } from "vitest";

import { LEVEL_THRESHOLDS, paidLater, promotionOf, promotionsCursor, readPromotionsCursor } from "./promotions";
import type { PromotionBatch } from "./promotions.types";
import { XP_LEVELS, xpForLevel, xpLevelFor } from "./xpCurve";

/**
 * WHO WENT UP A LEVEL, READ FROM THE LEDGER.
 *
 * The running totals are summed in SQL (`promotionsRead.ts`), and the browser
 * spec seeds a ledger and reads the page to hold that half. What is here is the
 * half that decides what a crossing IS: the rungs the query is handed, the line a
 * batch becomes — an ordinary crossing, one over several rungs, one a backfill
 * paid, one by a program — and the cursor between pages.
 */

/** A batch with the totals either side of it, at 2026-09-14 12:00 UTC unless said otherwise. */
function batch(before: number, after: number, extra: Partial<PromotionBatch> = {}): PromotionBatch {
  return {
    memberId: "m_climber",
    at: new Date("2026-09-14T12:00:00.000Z"),
    dayKey: "2026-09-14",
    before,
    after,
    name: "Climber",
    botTier: null,
    timeZone: "",
    ...extra,
  };
}

/** What `width_bucket(total, rungs) + 1` answers: how many rungs start at or below the total, plus one. */
function levelByRungs(total: number): number {
  return LEVEL_THRESHOLDS.filter((rung) => rung <= total).length + 1;
}

describe("the rungs the query reads levels from", () => {
  it("are where each level from 2 to the top begins, in ascending order", () => {
    expect(LEVEL_THRESHOLDS).toHaveLength(XP_LEVELS - 1);
    LEVEL_THRESHOLDS.forEach((rung, index) => expect(rung).toBe(xpForLevel(index + 2)));
    for (let index = 1; index < LEVEL_THRESHOLDS.length; index += 1) {
      expect(LEVEL_THRESHOLDS[index]).toBeGreaterThan(LEVEL_THRESHOLDS[index - 1]);
    }
  });

  /*
   * The SQL and every badge on the site must agree about what level a total is,
   * or the page would list a promotion the member's badge does not show. So the
   * bucket arithmetic is held to `xpLevelFor` either side of every boundary.
   */
  it("give the same level as xpLevelFor on, just under and past every boundary", () => {
    for (const total of [0, 1, 49, 50, 51]) expect(levelByRungs(total)).toBe(xpLevelFor(total));
    for (let level = 2; level <= XP_LEVELS; level += 1) {
      const floor = xpForLevel(level);
      for (const total of [floor - 1, floor, floor + 1]) expect(levelByRungs(total)).toBe(xpLevelFor(total));
    }
  });
});

describe("the line a crossing becomes", () => {
  it("is from the rung stood on to the rung reached, for an ordinary crossing", () => {
    // 40 XP is level 1; 60 is past level 2's 50.
    expect(promotionOf(batch(40, 60))).toEqual({
      memberId: "m_climber",
      name: "Climber",
      computer: false,
      from: 1,
      to: 2,
      at: new Date("2026-09-14T12:00:00.000Z"),
      paidLater: null,
    });
  });

  /*
   * One award over several rungs is ONE line, from where they started to where
   * they arrived — the moment was one moment, and two lines would claim a stop on
   * the middle rung nobody made.
   */
  it("is one line over several rungs, from where they started to where they arrived", () => {
    const leap = promotionOf(batch(xpForLevel(3), xpForLevel(5) + 10));
    expect(leap?.from).toBe(3);
    expect(leap?.to).toBe(5);
  });

  it("is nothing for a batch that stayed on its rung, or landed exactly short of the next", () => {
    expect(promotionOf(batch(60, 140))).toBeNull();
    expect(promotionOf(batch(60, xpForLevel(3) - 1))).toBeNull();
  });

  it("is a program's like anyone's, and says it is a program so the filters can keep it apart", () => {
    const program = promotionOf(batch(140, 160, { memberId: "kyu", name: "Kyu", botTier: "kyu" }));
    expect(program).toMatchObject({ computer: true, from: 2, to: 3 });
    expect(promotionOf(batch(140, 160))?.computer).toBe(false);
  });
});

describe("a crossing a backfill paid", () => {
  /*
   * The 2026-09-13 backfill filed each award under the day of the game it paid
   * for, and the row's `createdAt` says when the replay inserted it. Such a
   * promotion carries the day of the play, so the page does not date it by the
   * replay as though it had been earned that day.
   */
  it("carries the day of the play it paid for", () => {
    const replayed = promotionOf(
      batch(40, 60, { at: new Date("2026-09-13T09:30:00.000Z"), dayKey: "2025-08-02" }),
    );
    expect(replayed).toMatchObject({ from: 1, to: 2, paidLater: "2025-08-02" });
  });

  it("carries nothing for an award filed under the day it was written", () => {
    expect(paidLater(new Date("2026-09-14T12:00:00.000Z"), "2026-09-14", "")).toBeNull();
  });

  /*
   * The day is the member's own. At 20:00 UTC it is already tomorrow in Tokyo, so
   * an award there is filed under tomorrow — later than the UTC date, never
   * earlier — and is not taken for a replay.
   */
  it("reads the day in the member's own zone, so a zone ahead of UTC is not a replay", () => {
    expect(paidLater(new Date("2026-09-14T20:00:00.000Z"), "2026-09-15", "Asia/Tokyo")).toBeNull();
    // And in Los Angeles the same moment is still the 14th, filed under the 14th.
    expect(paidLater(new Date("2026-09-15T02:00:00.000Z"), "2026-09-14", "America/Los_Angeles")).toBeNull();
  });
});

describe("the cursor between pages", () => {
  it("reads back the moment and the member it was written from", () => {
    const at = new Date("2026-09-14T14:21:27.446Z");
    const read = readPromotionsCursor(promotionsCursor({ at, memberId: "m_ab12-cd" }));
    expect(read).toEqual({ at, memberId: "m_ab12-cd" });
  });

  it("is nothing for anything that is not one, so a stale or typed address starts at the newest", () => {
    for (const raw of [undefined, "", "abc", "123", ".m1", "123.", "-5.m1", "1.5.m1", "12.m 1", ["1.m1"]]) {
      expect(readPromotionsCursor(raw as string | string[] | undefined)).toBeNull();
    }
  });
});
