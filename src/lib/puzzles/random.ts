/**
 * A seeded random, so that one seed makes one puzzle in every browser.
 *
 * `Math.random` cannot be seeded, and a puzzle made from it exists only in
 * the tab that made it. A race (see docs/plans/numbers/NUM-05) hands two
 * people one seed and needs both browsers to derive the same grid; a solve
 * put in an address (`?seed=…`) needs the same again tomorrow.
 *
 * The generator (mulberry32), the seed range and the drawing around kept
 * blocks are Tane, the site's own open-source package (`packages/tane`),
 * which pins every number this has ever produced. What stays here is the
 * site's own: which block is kept, and for what.
 */
import { drawSeed, isSeed as isTaneSeed, mulberry32, SEED_MOST as TANE_SEED_MOST, shuffled as taneShuffled, type Random, type SeedBlock } from "@johnmorrisdotca/tane";

/** A number in [0, 1), like `Math.random`, from a stream a seed fixes. */
export type { Random };

export const seededRandom: (seed: number) => Random = mulberry32;

/** The most a seed can be: it travels in an address and a POST body as a plain integer. */
export const SEED_MOST = TANE_SEED_MOST;

/**
 * THE SEEDS KEPT FOR THE DAILY WORDS: a hundred million of them, from a
 * thousand million up, where a Gomoji's seed names a day rather than a draw
 * (`dailyWords/dailyDay.ts`). `freshSeed` never lands in it, so a word drawn
 * at random is never somebody's word of the day, early or late.
 */
export const DAILY_SEED_BLOCK = { from: 1_000_000_000, size: 100_000_000 } as const satisfies SeedBlock;

/** A new seed for a puzzle nobody asked for by number: anywhere in the range but the daily words' block. */
export function freshSeed(): number {
  return drawSeed(Math.random, { reserved: [DAILY_SEED_BLOCK] });
}

/** Whether a number read from an address or a body is a seed this can use. */
export function isSeed(value: unknown): value is number {
  return isTaneSeed(value);
}

/** A copy of the list in a random order (Fisher–Yates). */
export function shuffled<T>(items: readonly T[], random: Random): T[] {
  return taneShuffled(random, items);
}
