import { isDayKey, dayIndexOf } from "../dailyWords/dailyDay";
import { DODGE_SEED_BLOCK } from "../random";

/**
 * THE SEEDS OF A GOMOJI NIGE 逃げ, the word that dodges (`dodge.ts`).
 *
 * Nige is a way of playing every Gomoji, in every language, rather than a
 * puzzle of its own, so it lives where a way of playing can: in the seed. A
 * kept run, a solve and an address hold the kind, the size, the level and the
 * seed and nothing more, and a seed in `DODGE_SEED_BLOCK` says "this one
 * dodges" to every one of them.
 *
 * The block is laid out as the daily words' is: a day's dodger is the block's
 * start plus the date (2026-10-03 → 1520261003), the same for everybody at
 * each length; every other dodger is drawn from the block's upper half, which
 * no date reaches.
 */

/** Where drawn dodgers start in the block: past every date's offset until the year 5000. */
const DRAWN_FROM = 50_000_000;

/** Whether a seed plays its word as a dodger. */
export function isDodgeSeed(seed: number): boolean {
  const offset = seed - DODGE_SEED_BLOCK.from;
  return Number.isInteger(offset) && offset >= 0 && offset < DODGE_SEED_BLOCK.size;
}

/** A new dodger nobody asked for by number, drawn from the half of the block no day names. */
export function freshDodgeSeed(): number {
  return DODGE_SEED_BLOCK.from + DRAWN_FROM + Math.floor(Math.random() * (DODGE_SEED_BLOCK.size - DRAWN_FROM));
}

/** The dodger everybody plays on a day, at every length: the block's start plus the date written as a number. */
export function dodgeDailySeed(day: string): number {
  return DODGE_SEED_BLOCK.from + Number(day.replaceAll("-", ""));
}

/** The day a dodger's seed names, or null for a drawn one or any seed outside the block. */
export function dayOfDodgeSeed(seed: number): string | null {
  if (!isDodgeSeed(seed)) return null;
  const offset = seed - DODGE_SEED_BLOCK.from;
  if (offset >= DRAWN_FROM) return null;
  const digits = String(offset).padStart(8, "0");
  const day = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  return isDayKey(day) && dayIndexOf(day) >= 0 ? day : null;
}

/**
 * WHAT A DODGER'S GIVENS ARE: "~" and the seed ("~1550000123"). Nothing is
 * hidden, so there is no word to write down; the seed is what decides every
 * tie (`dodge.ts`), and the check the server runs is handed givens and never
 * the seed, so the seed is written into them. A "~" is no letter and no kana,
 * so no ordinary Gomoji's givens can be read as a dodger's, nor a dodger's as
 * theirs. Kept here, beside the seeds and away from the word lists, so a page
 * that only asks "is this a dodger?" carries none of them.
 */
const MARK = "~";

export function encodeDodgeGivens(seed: number): string {
  return `${MARK}${seed}`;
}

/** The seed a dodger's givens carry, or null for givens that are not a dodger's. */
export function decodeDodgeGivens(givens: string): number | null {
  if (typeof givens !== "string" || !givens.startsWith(MARK)) return null;
  const digits = givens.slice(MARK.length);
  const seed = Number(digits);
  return Number.isInteger(seed) && isDodgeSeed(seed) && String(seed) === digits ? seed : null;
}

export function isDodgeGivens(givens: string): boolean {
  return decodeDodgeGivens(givens) !== null;
}
