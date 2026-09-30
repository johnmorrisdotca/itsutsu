import { describe, expect, it } from "vitest";

import { addDays, dailySeed, dayKey, dayOfSeed, daySeed, daysBetween, isDayKey, nextDayStart } from "./daily.ts";

const BLOCK = { from: 1_000_000_000, size: 100_000_000 };

describe("dayKey and dailySeed in UTC", () => {
  it("is the UTC date, and the same number all day", () => {
    expect(dayKey(new Date("2026-09-30T23:59:59.999Z"))).toBe("2026-09-30");
    expect(dailySeed(new Date("2026-09-30T00:00:00Z"))).toBe(20260930);
    expect(dailySeed(new Date("2026-09-30T23:59:59.999Z"))).toBe(20260930);
    expect(dailySeed(new Date("2026-10-01T00:00:00Z"))).toBe(20261001);
  });

  it("pads small years", () => {
    expect(dayKey(new Date("0999-01-02T00:00:00Z"))).toBe("0999-01-02");
  });

  it("refuses an invalid date", () => {
    expect(() => dayKey(new Date("nope"))).toThrow(RangeError);
  });
});

describe("dayKey and dailySeed in a time zone", () => {
  it("turns at the zone's own midnight", () => {
    // 03:30 UTC on 1 October is still 30 September in Toronto (UTC−4 in daylight time).
    const at = new Date("2026-10-01T03:30:00Z");
    expect(dayKey(at)).toBe("2026-10-01");
    expect(dayKey(at, "America/Toronto")).toBe("2026-09-30");
    expect(dailySeed(at, "America/Toronto")).toBe(20260930);
    expect(dayKey(new Date("2026-09-30T15:30:00Z"), "Asia/Tokyo")).toBe("2026-10-01");
  });

  it("handles half-hour and quarter-hour zones", () => {
    expect(dayKey(new Date("2026-09-30T18:29:00Z"), "Asia/Kolkata")).toBe("2026-09-30");
    expect(dayKey(new Date("2026-09-30T18:30:00Z"), "Asia/Kolkata")).toBe("2026-10-01");
    expect(dayKey(new Date("2026-09-30T18:15:00Z"), "Asia/Kathmandu")).toBe("2026-10-01");
  });

  it("refuses an unknown zone", () => {
    expect(() => dayKey(new Date(), "Mars/Olympus")).toThrow(RangeError);
  });
});

describe("isDayKey", () => {
  it("takes real dates only", () => {
    expect(isDayKey("2026-09-30")).toBe(true);
    expect(isDayKey("2028-02-29")).toBe(true);
    for (const text of ["2026-02-29", "2026-13-01", "2026-9-30", "20260930", "", "2026-09-30T00:00"]) expect(isDayKey(text)).toBe(false);
  });
});

describe("addDays and daysBetween", () => {
  it("count calendar days across months, years and leap days", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
    expect(daysBetween("2026-09-26", "2026-10-03")).toBe(7);
    expect(daysBetween("2026-10-03", "2026-09-26")).toBe(-7);
    expect(daysBetween("2026-01-01", "2027-01-01")).toBe(365);
  });

  it("refuse a day that is not one", () => {
    expect(() => addDays("2026-02-30", 1)).toThrow(RangeError);
  });
});

describe("nextDayStart", () => {
  it("is the next midnight in UTC", () => {
    expect(nextDayStart(new Date("2026-09-30T12:00:00Z")).toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(nextDayStart(new Date("2026-09-30T00:00:00Z")).toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });

  it("is the zone's midnight, also across a change of clocks", () => {
    expect(nextDayStart(new Date("2026-09-30T12:00:00Z"), "America/Toronto").toISOString()).toBe("2026-10-01T04:00:00.000Z");
    // Toronto leaves daylight time early on 1 November 2026; that day is 25 hours long.
    expect(nextDayStart(new Date("2026-11-01T05:00:00Z"), "America/Toronto").toISOString()).toBe("2026-11-02T05:00:00.000Z");
    expect(nextDayStart(new Date("2026-09-30T12:00:00Z"), "Asia/Kolkata").toISOString()).toBe("2026-09-30T18:30:00.000Z");
  });
});

describe("daySeed and dayOfSeed", () => {
  it("put a day's date after a block's first seed, and read it back", () => {
    expect(daySeed("2026-10-03", BLOCK)).toBe(1_020_261_003);
    expect(dayOfSeed(1_020_261_003, BLOCK)).toBe("2026-10-03");
  });

  it("round-trip every day of a year", () => {
    let day = "2028-01-01";
    for (let i = 0; i < 366; i += 1) {
      expect(dayOfSeed(daySeed(day, BLOCK), BLOCK)).toBe(day);
      day = addDays(day, 1);
    }
  });

  it("name no day for a seed outside the block or not a date", () => {
    expect(dayOfSeed(999_999_999, BLOCK)).toBeNull();
    expect(dayOfSeed(1_100_000_000, BLOCK)).toBeNull();
    expect(dayOfSeed(1_020_260_230, BLOCK)).toBeNull();
    expect(dayOfSeed(1.5, BLOCK)).toBeNull();
  });

  it("refuse a day the block has no room for", () => {
    expect(() => daySeed("2026-10-03", { from: 1, size: 1000 })).toThrow(RangeError);
    expect(() => daySeed("2026-02-30", BLOCK)).toThrow(RangeError);
  });
});
