import { describe, expect, it } from "vitest";

import { monthBounds, monthOf, monthWords, readMonth, readWeek, weekBounds, weekOf, weekWords } from "@/lib/history/recordMonth";

import { puzzleRecordAsked, puzzleRecordHref } from "./puzzleRecordAddress";

describe("a puzzle's record, as an address", () => {
  it("is the puzzle's history, with nothing asked", () => {
    expect(puzzleRecordHref("hiddenStones")).toBe("/games/hidden-stones/history");
    expect(puzzleRecordAsked("hiddenStones", {})).toEqual({ member: null, size: null, level: null, month: null, week: null, sort: "newest", page: 1 });
  });

  it("carries who by id, and the size, level, month and order a board counted", () => {
    const href = puzzleRecordHref("hiddenStones", { member: "m-ann", size: 5, level: "easy", month: "2026-09", week: null, sort: "fastest", page: 2 });
    expect(href).toBe("/games/hidden-stones/history?member=m-ann&size=5&level=easy&month=2026-09&sort=fastest&page=2");
    const query = Object.fromEntries(new URL(`https://x${href}`).searchParams);
    expect(puzzleRecordAsked("hiddenStones", query)).toEqual({ member: "m-ann", size: 5, level: "easy", month: "2026-09", week: null, sort: "fastest", page: 2 });
  });

  it("leaves the defaults out, so one set has one address", () => {
    expect(puzzleRecordHref("numberPlace", { member: null, size: null, level: null, month: null, week: null, sort: "newest", page: 1 })).toBe("/games/number-place/history");
  });

  it("drops a filter that names nothing this puzzle has, rather than claiming a narrowing it did not make", () => {
    const asked = puzzleRecordAsked("numberPlace", { size: "7", level: "impossible", month: "2026-13", week: "2026-09-22", sort: "slowest", page: "0", member: "x".repeat(65) });
    expect(asked).toEqual({ member: null, size: null, level: null, month: null, week: null, sort: "newest", page: 1 });
  });
});

describe("a month in an address", () => {
  it("reads only a real month", () => {
    expect(readMonth("2026-09")).toBe("2026-09");
    expect(readMonth(" 2026-12 ")).toBe("2026-12");
    for (const wrong of ["2026-00", "2026-13", "2026-9", "September", "", null, undefined]) expect(readMonth(wrong)).toBeNull();
  });

  it("is bounded in UTC from its first moment to the next month's, as the monthly boards count", () => {
    expect(monthBounds("2026-09")).toEqual({ start: new Date("2026-09-01T00:00:00Z"), end: new Date("2026-10-01T00:00:00Z") });
    expect(monthBounds("2026-12").end).toEqual(new Date("2027-01-01T00:00:00Z"));
    expect(monthOf(new Date("2026-09-30T23:59:59Z"))).toBe("2026-09");
    expect(monthOf(new Date("2026-10-01T00:00:00Z"))).toBe("2026-10");
  });

  it("says itself in words for the chip", () => {
    expect(monthWords("2026-09")).toBe("September 2026");
  });
});

describe("a week in an address", () => {
  it("reads only a real date that is a Monday", () => {
    expect(readWeek("2026-09-21")).toBe("2026-09-21");
    // A Tuesday, a date that rolls over, and a month are none of them a week.
    expect(readWeek("2026-09-22")).toBeNull();
    expect(readWeek("2026-02-30")).toBeNull();
    expect(readWeek("2026-09")).toBeNull();
    expect(readWeek("")).toBeNull();
  });

  it("is seven days from Monday 00:00 UTC, as the weekly boards count", () => {
    expect(weekBounds("2026-09-21")).toEqual({ start: new Date("2026-09-21T00:00:00Z"), end: new Date("2026-09-28T00:00:00Z") });
    // A Sunday late at night is still the week that began six days before; a Monday is its own week's first day.
    expect(weekOf(new Date("2026-09-27T23:59:59Z"))).toBe("2026-09-21");
    expect(weekOf(new Date("2026-09-28T00:00:00Z"))).toBe("2026-09-28");
    // Across a month and a year.
    expect(weekOf(new Date("2027-01-01T12:00:00Z"))).toBe("2026-12-28");
    expect(weekWords("2026-09-21")).toBe("the week of 21 September 2026");
  });

  it("carries a weekly board's figure to exactly that week's solves", () => {
    const href = puzzleRecordHref("hiddenStones", { member: "m-ann", week: "2026-09-21" });
    expect(href).toBe("/games/hidden-stones/history?member=m-ann&week=2026-09-21");
    expect(puzzleRecordAsked("hiddenStones", { member: "m-ann", week: "2026-09-21" }).week).toBe("2026-09-21");
  });
});
