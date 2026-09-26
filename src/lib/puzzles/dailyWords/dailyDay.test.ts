import { afterEach, describe, expect, it, vi } from "vitest";

import { DAILY_SEED_BLOCK, freshSeed, isSeed } from "../random";
import { DAILY_WORDS_EPOCH, dailyWordSeed, dayAfter, dayIndexOf, dayKeyAt, dayKeyOf, dayLabel, dayOfDailyWordSeed, isDayKey, mondayOf, monthLabel } from "./dailyDay";

describe("the days of the daily words", () => {
  afterEach(() => vi.restoreAllMocks());

  it("turn at midnight UTC, the same instant for everybody", () => {
    expect(dayKeyOf(new Date("2026-10-03T00:00:00Z"))).toBe("2026-10-03");
    expect(dayKeyOf(new Date("2026-10-03T23:59:59Z"))).toBe("2026-10-03");
    expect(dayKeyOf(new Date("2026-10-04T00:00:00Z"))).toBe("2026-10-04");
    // Evening in Vancouver on the 3rd is already the 4th's word.
    expect(dayKeyOf(new Date("2026-10-03T18:30:00-07:00"))).toBe("2026-10-04");
  });

  it("count from the epoch, both ways", () => {
    expect(dayIndexOf(DAILY_WORDS_EPOCH)).toBe(0);
    expect(dayIndexOf(dayAfter(DAILY_WORDS_EPOCH, 400))).toBe(400);
    expect(dayKeyAt(400)).toBe(dayAfter(DAILY_WORDS_EPOCH, 400));
    expect(dayIndexOf(dayAfter(DAILY_WORDS_EPOCH, -1))).toBe(-1);
  });

  it("know a real date from a date-shaped string", () => {
    expect(isDayKey("2026-10-03")).toBe(true);
    expect(isDayKey("2026-02-30")).toBe(false);
    expect(isDayKey("2026-10-3")).toBe(false);
    expect(isDayKey("tomorrow")).toBe(false);
  });

  it("are printed the same by every server and browser, and grouped Monday to Sunday", () => {
    expect(dayLabel("2026-10-03")).toBe("Sat 3 Oct 2026");
    expect(dayLabel("2026-10-03", false)).toBe("Sat 3 Oct");
    expect(monthLabel("2026-10")).toBe("October 2026");
    expect(mondayOf("2026-10-03")).toBe("2026-09-28");
    expect(mondayOf("2026-09-28")).toBe("2026-09-28");
    expect(mondayOf("2026-10-04")).toBe("2026-09-28");
  });

  it("have seeds that read as the date and are ordinary seeds", () => {
    const seed = dailyWordSeed("2026-10-03");
    expect(seed).toBe(1_020_261_003);
    expect(isSeed(seed)).toBe(true);
    expect(dayOfDailyWordSeed(seed)).toBe("2026-10-03");
  });

  it("name no day for any other seed", () => {
    expect(dayOfDailyWordSeed(20261003)).toBeNull(); // every other puzzle's daily seed
    expect(dayOfDailyWordSeed(123_456)).toBeNull();
    expect(dayOfDailyWordSeed(DAILY_SEED_BLOCK.from + 20260230)).toBeNull(); // not a date
    expect(dayOfDailyWordSeed(dailyWordSeed(dayAfter(DAILY_WORDS_EPOCH, -1)))).toBeNull(); // before the first daily word
    expect(dayOfDailyWordSeed(DAILY_SEED_BLOCK.from + DAILY_SEED_BLOCK.size)).toBeNull();
  });

  it("are never drawn by a fresh seed, at either edge of the draw", () => {
    for (const draw of [0, 0.4656, 0.4657, 0.5, 0.999_999_999]) {
      vi.spyOn(Math, "random").mockReturnValue(draw);
      const seed = freshSeed();
      expect(isSeed(seed), `${draw} → ${seed}`).toBe(true);
      expect(seed >= DAILY_SEED_BLOCK.from && seed < DAILY_SEED_BLOCK.from + DAILY_SEED_BLOCK.size, `${draw} → ${seed}`).toBe(false);
    }
  });
});
