import { describe, expect, it } from "vitest";

import { monthBounds, monthOf, monthWords, readMonth } from "@/lib/history/recordMonth";

import { puzzleRecordAsked, puzzleRecordHref } from "./puzzleRecordAddress";

describe("a puzzle's record, as an address", () => {
  it("is the puzzle's history, with nothing asked", () => {
    expect(puzzleRecordHref("hiddenStones")).toBe("/games/hidden-stones/history");
    expect(puzzleRecordAsked("hiddenStones", {})).toEqual({ member: null, size: null, level: null, month: null, sort: "newest", page: 1 });
  });

  it("carries who by id, and the size, level, month and order a board counted", () => {
    const href = puzzleRecordHref("hiddenStones", { member: "m-ann", size: 5, level: "easy", month: "2026-09", sort: "fastest", page: 2 });
    expect(href).toBe("/games/hidden-stones/history?member=m-ann&size=5&level=easy&month=2026-09&sort=fastest&page=2");
    const query = Object.fromEntries(new URL(`https://x${href}`).searchParams);
    expect(puzzleRecordAsked("hiddenStones", query)).toEqual({ member: "m-ann", size: 5, level: "easy", month: "2026-09", sort: "fastest", page: 2 });
  });

  it("leaves the defaults out, so one set has one address", () => {
    expect(puzzleRecordHref("numberPlace", { member: null, size: null, level: null, month: null, sort: "newest", page: 1 })).toBe("/games/number-place/history");
  });

  it("drops a filter that names nothing this puzzle has, rather than claiming a narrowing it did not make", () => {
    const asked = puzzleRecordAsked("numberPlace", { size: "7", level: "impossible", month: "2026-13", sort: "slowest", page: "0", member: "x".repeat(65) });
    expect(asked).toEqual({ member: null, size: null, level: null, month: null, sort: "newest", page: 1 });
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
