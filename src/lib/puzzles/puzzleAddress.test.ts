import { describe, expect, it } from "vitest";

import { keptRunAsked, puzzleAsked, puzzleQuery } from "./puzzleAddress";

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
    expect(puzzleAsked("numberPlace", query)).toEqual({ size: 6, level: "hard", seed: 7, checks: 1, hints: false, strict: false, headStart: false });
  });
});

describe("hints in a puzzle's address", () => {
  it("are on only when the address says hints=1, and written only when on", () => {
    expect(puzzleAsked("numberPlace", { hints: "1" }).hints).toBe(true);
    expect(puzzleAsked("numberPlace", {}).hints).toBe(false);
    expect(puzzleAsked("numberPlace", { hints: "yes" }).hints).toBe(false);
    expect(puzzleQuery({ size: 9, level: "easy", seed: 5, hints: true })).toBe("?size=9&level=easy&seed=5&hints=1");
    expect(puzzleQuery({ size: 9, level: "easy", seed: 5, hints: false })).toBe("?size=9&level=easy&seed=5");
    // Gomoji's Strict, the same way: in the address when chosen, and read back.
    expect(puzzleQuery({ size: 5, level: "easy", seed: 5, strict: true })).toBe("?size=5&level=easy&seed=5&strict=1");
    expect(puzzleAsked("gomoji", { size: "5", level: "easy", strict: "1" }).strict).toBe(true);
    expect(puzzleAsked("gomoji", { size: "5", level: "easy" }).strict).toBe(false);
  });
});

describe("Gomoji's Head start in a puzzle's address", () => {
  it("is on only at easy, only when the address says head-start=1, and written only then", () => {
    expect(puzzleAsked("gomoji", { size: "5", level: "easy", "head-start": "1" }).headStart).toBe(true);
    expect(puzzleAsked("gomojiKana", { size: "4", level: "easy", "head-start": "1" }).headStart).toBe(true);
    expect(puzzleAsked("gomoji", { size: "5", level: "easy" }).headStart).toBe(false);
    expect(puzzleAsked("gomoji", { size: "5", level: "medium", "head-start": "1" }).headStart).toBe(false);
    expect(puzzleAsked("gomojiWort", { size: "5", level: "hard", "head-start": "1" }).headStart).toBe(false);
    expect(puzzleAsked("numberPlace", { level: "easy", "head-start": "1" }).headStart).toBe(false);
    expect(puzzleQuery({ size: 5, level: "easy", seed: 5, headStart: true })).toBe("?size=5&level=easy&seed=5&head-start=1");
    expect(puzzleQuery({ size: 5, level: "medium", seed: 5, headStart: true })).toBe("?size=5&level=medium&seed=5");
  });

  it("comes back from a kept word run's hint columns, and a grid's hints stay hints", () => {
    const run = { size: 5, level: "easy", seed: 9, checksAllowed: null, hintsAllowed: true, strict: false };
    expect(keptRunAsked("gomojiMot", run)).toMatchObject({ headStart: true, hints: false });
    expect(puzzleQuery(keptRunAsked("gomojiMot", run))).toBe("?size=5&level=easy&seed=9&head-start=1");
    expect(keptRunAsked("numberPlace", { ...run, size: 9 })).toMatchObject({ headStart: false, hints: true });
    expect(keptRunAsked("gomoji", { ...run, hintsAllowed: false })).toMatchObject({ headStart: false, hints: false });
  });
});
