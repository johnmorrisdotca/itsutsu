import { version as PACKAGE_VERSION } from "../../package.json";

/** The site's version, from package.json at build time. */
export const VERSION: string = PACKAGE_VERSION;

/** Where the site is in its life. The number reads as alpha by the letter of semver; the word is the truth. */
export const STAGE = "Beta";

const ROMAN: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

/** A whole number in Roman numerals. Zero is N, for nulla, as the medieval computists wrote it. */
export function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 0) return String(n);
  if (n === 0) return "N";
  let left = n;
  let out = "";
  for (const [value, glyph] of ROMAN) {
    while (left >= value) {
      out += glyph;
      left -= value;
    }
  }
  return out;
}

const KANJI_DIGITS = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const KANJI_UNITS: [number, string][] = [[1000, "千"], [100, "百"], [10, "十"]];

/**
 * A whole number in everyday Japanese numerals, the ones beside 五目 on the
 * site: 〇 for zero, 三十一 for thirty-one, 百 for a hundred.
 */
export function toKanji(n: number): string {
  if (!Number.isInteger(n) || n < 0) return String(n);
  if (n === 0) return KANJI_DIGITS[0];
  let left = n;
  let out = "";
  for (const [value, glyph] of KANJI_UNITS) {
    const count = Math.floor(left / value);
    if (count > 0) {
      out += (count === 1 ? "" : KANJI_DIGITS[count]) + glyph;
      left -= count * value;
    }
  }
  if (left > 0) out += KANJI_DIGITS[left];
  return out;
}

/** The version as an edition stamp in three numeral systems, each part separated by ・. */
export function versionStamps(version: string = VERSION): { semver: string; roman: string; kanji: string } {
  const parts = version.split(".").map((part) => Number.parseInt(part, 10));
  return {
    semver: version,
    roman: parts.map(toRoman).join("・"),
    kanji: parts.map(toKanji).join("・"),
  };
}
