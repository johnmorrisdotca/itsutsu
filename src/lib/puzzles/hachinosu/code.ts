import type { WordListLanguage } from "../gomoji/wordData";

/**
 * HACHINOSU'S STRINGS. Givens are the hive and how many points finish it: the centre letter, the six round it, a
 * dot and the goal, `aelnrst.42`. What is played is the words found, comma after comma: `rain,train,trail`.
 * A hive's size is its language, the set-up's tile (`HIVE_LANGUAGES`), so one card holds all three, and a day's
 * hive and a table of fastest times stay apart underneath.
 */

export type Hive = { centre: string; letters: string; goal: number };

/** The language of each size. */
export const HIVE_LANGUAGES: Readonly<Record<number, WordListLanguage>> = { 1: "en", 2: "fr", 3: "de" };

/** The shortest word a hive takes, and the longest in Kotoba's lists. */
export const HIVE_SHORTEST = 4;
export const HIVE_LONGEST = 6;

export function encodeHive(hive: Hive): string {
  return `${hive.centre}${hive.letters}.${hive.goal}`;
}

/** The hive in givens, or null for anything but seven different letters and a goal. */
export function readHive(givens: string): Hive | null {
  if (typeof givens !== "string") return null;
  const match = /^([a-z])([a-z]{6})\.([1-9]\d{0,3})$/.exec(givens);
  if (match === null) return null;
  const every = match[1]! + match[2]!;
  if (new Set(every).size !== 7) return null;
  return { centre: match[1]!, letters: match[2]!, goal: Number(match[3]) };
}

/** A word's points: one for the shortest, and its length for a longer one. */
export function wordPoints(word: string): number {
  return word.length <= HIVE_SHORTEST ? 1 : word.length;
}

export function encodeFound(found: readonly string[]): string {
  return found.join(",");
}

/** The words in a string of them, or null for anything but different words of a hive's lengths, in small letters. */
export function readFound(code: string): string[] | null {
  if (typeof code !== "string") return null;
  if (code === "") return [];
  const words = code.split(",");
  if (new Set(words).size !== words.length) return null;
  return words.every((word) => /^[a-z]+$/.test(word) && word.length >= HIVE_SHORTEST && word.length <= HIVE_LONGEST) ? words : null;
}

/** Why a word typed is not taken, or null when the letters allow it: the list is asked after. */
export function lettersProblem(hive: Hive, word: string): "short" | "centre" | "letters" | null {
  if (word.length < HIVE_SHORTEST) return "short";
  if (!word.includes(hive.centre)) return "centre";
  const allowed = hive.centre + hive.letters;
  return [...word].every((letter) => allowed.includes(letter)) ? null : "letters";
}
