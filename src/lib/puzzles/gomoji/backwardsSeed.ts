import { isDayKey, dayIndexOf } from "../dailyWords/dailyDay";
import { BACKWARDS_SEED_BLOCK } from "../random";

/**
 * THE SEEDS OF A GOMOJI SAKASA 逆さ, played backwards (`backwards.ts`).
 *
 * Sakasa is a way of playing every Gomoji, in every language, rather than a
 * puzzle of its own, so it lives where a way of playing can: in the seed. A
 * kept run, a solve and an address hold the kind, the size, the level and the
 * seed and nothing more, and a seed in `BACKWARDS_SEED_BLOCK` says "this one
 * is played backwards" to every one of them.
 *
 * The block is laid out as the daily words' is: a day's Sakasa is the block's
 * start plus the date (2026-10-03 → 1620261003), the same word for everybody
 * at each length; every other one is drawn from the block's upper half, which
 * no date reaches.
 */

/** Where drawn seeds start in the block: past every date's offset until the year 5000. */
const DRAWN_FROM = 50_000_000;

/** Whether a seed plays its word backwards. */
export function isBackwardsSeed(seed: number): boolean {
  const offset = seed - BACKWARDS_SEED_BLOCK.from;
  return Number.isInteger(offset) && offset >= 0 && offset < BACKWARDS_SEED_BLOCK.size;
}

/** A new Sakasa nobody asked for by number, drawn from the half of the block no day names. */
export function freshBackwardsSeed(): number {
  return BACKWARDS_SEED_BLOCK.from + DRAWN_FROM + Math.floor(Math.random() * (BACKWARDS_SEED_BLOCK.size - DRAWN_FROM));
}

/** The Sakasa everybody plays on a day, at every length: the block's start plus the date written as a number. */
export function backwardsDailySeed(day: string): number {
  return BACKWARDS_SEED_BLOCK.from + Number(day.replaceAll("-", ""));
}

/** The day a Sakasa's seed names, or null for a drawn one or any seed outside the block. */
export function dayOfBackwardsSeed(seed: number): string | null {
  if (!isBackwardsSeed(seed)) return null;
  const offset = seed - BACKWARDS_SEED_BLOCK.from;
  if (offset >= DRAWN_FROM) return null;
  const digits = String(offset).padStart(8, "0");
  const day = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  return isDayKey(day) && dayIndexOf(day) >= 0 ? day : null;
}

/**
 * WHAT A SAKASA'S GIVENS ARE: "^", its seed, ":" and the ordinary givens of
 * its word ("^1650000123:CRANE", "^1620261003:ネコ"). The check the server runs
 * is handed givens and never the seed, so they must say the word is played
 * backwards as well as which it is; and a kept solve has no seed of its own,
 * so the seed in its givens is how the day's Sakasa is found among a reader's
 * solves (`backwardsGivensPrefix`). A "^" is no letter and no kana, so no
 * ordinary Gomoji's givens read as a Sakasa's, nor a Sakasa's as theirs. Kept
 * here, away from the word lists, so a page that only asks "is this
 * backwards?" carries none of them.
 */
const MARK = "^";
const SPLIT = ":";

/** What every Sakasa's givens at this seed begin with, whatever its word. */
export function backwardsGivensPrefix(seed: number): string {
  return `${MARK}${seed}${SPLIT}`;
}

export function encodeBackwardsGivens(seed: number, inner: string): string {
  return `${backwardsGivensPrefix(seed)}${inner}`;
}

/** The ordinary givens inside a Sakasa's, or null for givens that are not a Sakasa's. */
export function innerBackwardsGivens(givens: string): string | null {
  if (typeof givens !== "string" || !givens.startsWith(MARK)) return null;
  const split = givens.indexOf(SPLIT);
  if (split === -1) return null;
  const seed = Number(givens.slice(MARK.length, split));
  const inner = givens.slice(split + SPLIT.length);
  return isBackwardsSeed(seed) && inner.length > 0 ? inner : null;
}

export function isBackwardsGivens(givens: string): boolean {
  return innerBackwardsGivens(givens) !== null;
}
