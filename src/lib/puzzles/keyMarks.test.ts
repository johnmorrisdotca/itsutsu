import { describe, expect, it } from "vitest";

import { kanaKeyMarks, letterKeyMarks, typedCounts } from "./keyMarks";
import { kanaBase } from "./wordDropKana/kanaMarks";

describe("what the keys of a word puzzle show", () => {
  it("counts each letter of the row being typed, empty places left out", () => {
    expect(typedCounts(["e", "e", "", "r", "e"])).toEqual(new Map([["e", 3], ["r", 1]]));
    expect(typedCounts(["", "", ""]).size).toBe(0);
  });

  it("counts a kana by its base, so ぱ and は are two of は", () => {
    expect(typedCounts(["ぱ", "は", "か"], kanaBase)).toEqual(new Map([["は", 2], ["か", 1]]));
  });

  it("colours a key by the best its letter has had, yellow included for kana", () => {
    expect(letterKeyMarks(["slate", "crane"], "crane").get("a")).toBe("hit");
    expect(kanaKeyMarks(["かめ"], "こい").get("か")).toBe("kin");
  });
});
