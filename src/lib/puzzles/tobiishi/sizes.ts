import { speaker, type Speaker } from "../../i18n/i18n";
import { DEFAULT_LOCALE, type PhraseKey } from "../../i18n/i18n.constants";
import type { PuzzleLevel } from "../puzzles.types";

/**
 * TOBIISHI'S SIZES, AS THE SITE KEEPS THEM. Every puzzle's `size` is one whole
 * number: a kept run, a solve, a race and an address all carry it. A peg puzzle
 * has no side to count, so its size is how long its shortest answer is, in
 * jumps, which is what the package's three difficulties are made of
 * (`@johnmorrisdotca/tobiishi`: easy is 3 jumps, medium 6, hard 9). The big
 * number on a size's tile is the number of jumps, and a size is one of the three
 * bands every puzzle is filed under (easy, medium, hard).
 *
 * `levels.test.ts` holds these to the package's own table.
 */
export const TOBIISHI_SIZES: readonly number[] = [3, 6, 9];

const BANDS: Readonly<Record<number, PuzzleLevel>> = { 3: "easy", 6: "medium", 9: "hard" };

const WORDS: Readonly<Record<number, PhraseKey>> = { 3: "puzzle.size.short", 6: "puzzle.size.medium", 9: "puzzle.size.long" };

/** Whether a number is one of the three lengths. */
export function isTobiishiSize(size: number): boolean {
  return Number.isInteger(size) && BANDS[size] !== undefined;
}

/** The easy, medium or hard a length is filed under; easy for a number that is none, which nothing here asks of one it has not checked. */
export function tobiishiBand(size: number): PuzzleLevel {
  return BANDS[size] ?? "easy";
}

/** What a page says of a length: "Short". */
export function tobiishiSizeLabel(size: number, say: Speaker = speaker(DEFAULT_LOCALE)): string {
  const word = WORDS[size];
  return word === undefined ? String(size) : say.say(word);
}

/** What a length is in jumps, as a sentence says it: "6 jumps". */
export function tobiishiJumpsWord(size: number, say: Speaker = speaker(DEFAULT_LOCALE)): string {
  return say.count("puzzle.count.jump", size);
}
