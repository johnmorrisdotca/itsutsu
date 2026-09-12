import { describe, expect, it } from "vitest";

import { XP_DAY_STREAK_MILESTONES } from "./xp.constants";
import { xpDayKey } from "./xpDay";
import {
  XP_DAY_RUN_MAX,
  backFromAwayAward,
  dayRunEndingAt,
  dayStreakAward,
  isDayBefore,
  previousDayKey,
} from "./xpHabit";

/**
 * Turning up, as a list of days rather than a clock.
 *
 * The cases that matter are the boundaries a calendar has and a subtraction does
 * not: the first of a month, the first of a year, and a leap day. A run measured
 * by taking 86,400,000 off a timestamp gets all three wrong twice a year, in the
 * zones that keep summer time, and the symptom is somebody's streak ending on a
 * day they played.
 */

const utc = (at: string) => new Date(at);

describe("the day before", () => {
  it("steps over the end of a month, a year and February", () => {
    expect(previousDayKey("2026-09-12")).toBe("2026-09-11");
    expect(previousDayKey("2026-09-01")).toBe("2026-08-31");
    expect(previousDayKey("2026-01-01")).toBe("2025-12-31");
    expect(previousDayKey("2026-03-01")).toBe("2026-02-28");
    // 2028 is a leap year, which a 28-day assumption gets wrong once every four.
    expect(previousDayKey("2028-03-01")).toBe("2028-02-29");
  });

  it("answers whether one day is the day before another", () => {
    expect(isDayBefore("2026-09-11", "2026-09-12")).toBe(true);
    expect(isDayBefore("2026-09-10", "2026-09-12")).toBe(false);
    expect(isDayBefore("2026-09-12", "2026-09-12")).toBe(false);
    expect(isDayBefore("2026-09-13", "2026-09-12")).toBe(false);
  });
});

describe("the run of days ending today", () => {
  it("counts back through the days that are there", () => {
    const days = ["2026-09-12", "2026-09-11", "2026-09-10"];
    expect(dayRunEndingAt(days, "2026-09-12")).toBe(3);
  });

  it("stops at the first day missing", () => {
    const days = ["2026-09-12", "2026-09-11", "2026-09-09", "2026-09-08"];
    expect(dayRunEndingAt(days, "2026-09-12")).toBe(2);
  });

  it("is one for a day on its own", () => {
    expect(dayRunEndingAt(["2026-09-12"], "2026-09-12")).toBe(1);
  });

  it("is nought when today has no visit, which is not a run of nought", () => {
    // Nought means "this day is not recorded", so there is nothing for a run to
    // be the end of. A run of nought is not a thing, and a milestone would be
    // asked for on it if this returned 1.
    expect(dayRunEndingAt(["2026-09-11"], "2026-09-12")).toBe(0);
    expect(dayRunEndingAt([], "2026-09-12")).toBe(0);
  });

  it("does not care about order or repeats", () => {
    const days = ["2026-09-10", "2026-09-12", "2026-09-11", "2026-09-11"];
    expect(dayRunEndingAt(days, "2026-09-12")).toBe(3);
  });

  it("stops counting at the longest run anything is paid for", () => {
    // A run longer than a year has already earned every milestone there is, and
    // the cap is what keeps the read bounded.
    const days: string[] = [];
    let day = "2026-09-12";
    for (let step = 0; step < 500; step += 1) {
      days.push(day);
      day = previousDayKey(day);
    }
    expect(dayRunEndingAt(days, "2026-09-12")).toBe(XP_DAY_RUN_MAX);
  });
});

describe("a run's milestone", () => {
  it("pays at a week, a month, a hundred days and a year", () => {
    for (const { days, type } of XP_DAY_STREAK_MILESTONES) {
      expect(dayStreakAward(days, "2026-09-12"), `${days}`).toEqual({
        type,
        subject: "2026-09-12",
      });
    }
  });

  it("pays at nothing else, so the eighth day asks for nothing", () => {
    for (const run of [0, 1, 6, 8, 29, 31, 99, 101, 364, 366]) {
      expect(dayStreakAward(run, "2026-09-12"), `${run}`).toBeNull();
    }
  });

  it("keys it on the day, so a year kept up pays again", () => {
    // `dayStreak365` is priced to repeat — a year without missing a day is worth
    // repeating for — and a once-ever subject would quietly make it a one-off.
    expect(dayStreakAward(365, "2026-09-12")?.subject).toBe("2026-09-12");
    expect(dayStreakAward(365, "2027-09-12")?.subject).toBe("2027-09-12");
  });
});

describe("coming back from away", () => {
  const dayKeyOf = (at: Date) => xpDayKey(at, "UTC");

  it("pays on the first visit after the spell ends", () => {
    expect(
      backFromAwayAward({
        awayUntil: utc("2026-09-10T00:00:00Z"),
        lastSeenAt: utc("2026-09-01T09:00:00Z"),
        now: utc("2026-09-12T09:00:00Z"),
        dayKeyOf,
      }),
    ).toEqual({ type: "backFromAway", subject: "2026-09-10" });
  });

  it("pays nothing while they are still away", () => {
    // A member can perfectly well look in during their own time off, and that is
    // not coming back.
    expect(
      backFromAwayAward({
        awayUntil: utc("2026-09-20T00:00:00Z"),
        lastSeenAt: utc("2026-09-01T09:00:00Z"),
        now: utc("2026-09-12T09:00:00Z"),
        dayKeyOf,
      }),
    ).toBeNull();
  });

  it("pays nothing on the days after the welcome", () => {
    // THE CASE THAT DECIDES THE SHAPE. Without the `lastSeenAt` half, a member
    // who set away dates once would have an award attempted on the first visit
    // of every day for ever, refused each time by the index — which is leaning
    // on the index to keep a cost down.
    expect(
      backFromAwayAward({
        awayUntil: utc("2026-09-10T00:00:00Z"),
        lastSeenAt: utc("2026-09-11T09:00:00Z"),
        now: utc("2026-09-12T09:00:00Z"),
        dayKeyOf,
      }),
    ).toBeNull();
  });

  it("pays nothing for a member who has never been away", () => {
    expect(
      backFromAwayAward({
        awayUntil: null,
        lastSeenAt: utc("2026-09-01T09:00:00Z"),
        now: utc("2026-09-12T09:00:00Z"),
        dayKeyOf,
      }),
    ).toBeNull();
  });

  it("welcomes a second holiday, because it is keyed on the spell", () => {
    const first = backFromAwayAward({
      awayUntil: utc("2026-09-10T00:00:00Z"),
      lastSeenAt: utc("2026-09-01T09:00:00Z"),
      now: utc("2026-09-12T09:00:00Z"),
      dayKeyOf,
    });
    const second = backFromAwayAward({
      awayUntil: utc("2026-12-24T00:00:00Z"),
      lastSeenAt: utc("2026-12-20T09:00:00Z"),
      now: utc("2026-12-28T09:00:00Z"),
      dayKeyOf,
    });
    expect(first?.subject).not.toBe(second?.subject);
    expect(second?.subject).toBe("2026-12-24");
  });

  it("reads the spell in the member's own zone", () => {
    // The subject is a day somebody reads, so it has to be their day. The same
    // instant is the 9th in Vancouver and the 10th in Tokyo.
    const away = utc("2026-09-10T02:00:00Z");
    const asked = {
      awayUntil: away,
      lastSeenAt: utc("2026-09-01T09:00:00Z"),
      now: utc("2026-09-12T09:00:00Z"),
    };
    expect(backFromAwayAward({ ...asked, dayKeyOf: (at) => xpDayKey(at, "Asia/Tokyo") })?.subject).toBe(
      "2026-09-10",
    );
    expect(
      backFromAwayAward({ ...asked, dayKeyOf: (at) => xpDayKey(at, "America/Vancouver") })?.subject,
    ).toBe("2026-09-09");
  });
});
