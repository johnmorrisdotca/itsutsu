import { describe, expect, it } from "vitest";

import { toKanji, toRoman, versionStamps } from "./version";

describe("the edition stamp", () => {
  it("writes zero as N and the rest in Roman", () => {
    expect(toRoman(0)).toBe("N");
    expect(toRoman(4)).toBe("IV");
    expect(toRoman(31)).toBe("XXXI");
    expect(toRoman(1994)).toBe("MCMXCIV");
  });

  it("writes everyday Japanese numerals", () => {
    expect(toKanji(0)).toBe("〇");
    expect(toKanji(5)).toBe("五");
    expect(toKanji(10)).toBe("十");
    expect(toKanji(31)).toBe("三十一");
    expect(toKanji(100)).toBe("百");
    expect(toKanji(214)).toBe("二百十四");
  });

  it("stamps a version three ways", () => {
    expect(versionStamps("0.31.0")).toEqual({ semver: "0.31.0", roman: "N・XXXI・N", kanji: "〇・三十一・〇" });
  });
});
