import { describe, expect, it } from "vitest";

import { puzzleAsked, puzzleQuery } from "./puzzleAddress";

describe("the Check allowance in a puzzle's address", () => {
  it("reads 3 and 1, and no limit for anything else or nothing", () => {
    expect(puzzleAsked("numberPlace", { checks: "3" }).checks).toBe(3);
    expect(puzzleAsked("numberPlace", { checks: "1" }).checks).toBe(1);
    expect(puzzleAsked("numberPlace", {}).checks).toBeNull();
    expect(puzzleAsked("numberPlace", { checks: "2" }).checks).toBeNull();
    expect(puzzleAsked("numberPlace", { checks: "" }).checks).toBeNull();
    expect(puzzleAsked("numberPlace", { checks: "0" }).checks).toBeNull();
  });

  it("writes an allowance, and leaves no limit out of the address", () => {
    expect(puzzleQuery({ size: 9, level: "easy", seed: 5, checks: 3 })).toBe("?size=9&level=easy&seed=5&checks=3");
    expect(puzzleQuery({ size: 9, level: "easy", seed: 5, checks: null })).toBe("?size=9&level=easy&seed=5");
    expect(puzzleQuery({ size: 9, level: "easy", seed: null })).toBe("?size=9&level=easy");
  });

  it("reads back what it writes", () => {
    const query = Object.fromEntries(new URLSearchParams(puzzleQuery({ size: 6, level: "hard", seed: 7, checks: 1 }).slice(1)));
    expect(puzzleAsked("numberPlace", query)).toEqual({ size: 6, level: "hard", seed: 7, checks: 1 });
  });
});
