/**
 * A seeded random, so that one seed makes one puzzle in every browser.
 *
 * `Math.random` cannot be seeded, and a puzzle made from it exists only in
 * the tab that made it. A race (see docs/plans/numbers/NUM-05) hands two
 * people one seed and needs both browsers to derive the same grid; a solve
 * put in an address (`?seed=…`) needs the same again tomorrow. mulberry32
 * is small, fast and good enough for shuffling — nothing here is a
 * credential.
 */

/** A number in [0, 1), like `Math.random`, from a stream a seed fixes. */
export type Random = () => number;

export function seededRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The most a seed can be: it travels in an address and a POST body as a plain integer. */
export const SEED_MOST = 2 ** 31 - 1;

/**
 * THE SEEDS KEPT FOR THE DAILY WORDS: a hundred million of them, from a
 * thousand million up, where a Gomoji's seed names a day rather than a draw
 * (`dailyWords/dailyDay.ts`). `freshSeed` never lands in it, so a word drawn
 * at random is never somebody's word of the day, early or late.
 */
export const DAILY_SEED_BLOCK = { from: 1_000_000_000, size: 100_000_000 } as const;

/**
 * THE SEEDS KEPT FOR A GOMOJI PLAYED ANOTHER WAY, a hundred million a way,
 * where the seed says how the word is played as well as which. Gomoji Sakasa
 * 逆さ, played backwards (`gomoji/backwardsSeed.ts`), from sixteen hundred
 * million. A kept run, a solve and an address carry nothing but the seed, so
 * the seed is where the way of playing has to live; `freshSeed` never lands in
 * a block, so an ordinary word is never mistaken for one played another way.
 */
export const BACKWARDS_SEED_BLOCK = { from: 1_600_000_000, size: 100_000_000 } as const;

/** Every block `freshSeed` keeps out of, lowest first. */
const KEPT_SEED_BLOCKS: readonly { from: number; size: number }[] = [DAILY_SEED_BLOCK, BACKWARDS_SEED_BLOCK];

/** A new seed for a puzzle nobody asked for by number: anywhere in the range but the kept blocks. */
export function freshSeed(): number {
  let drawn = Math.floor(Math.random() * (SEED_MOST - KEPT_SEED_BLOCKS.reduce((sum, block) => sum + block.size, 0))) + 1;
  for (const block of KEPT_SEED_BLOCKS) if (drawn >= block.from) drawn += block.size;
  return drawn;
}

/** Whether a number read from an address or a body is a seed this can use. */
export function isSeed(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= SEED_MOST;
}

/** A copy of the list in a random order (Fisher–Yates). */
export function shuffled<T>(items: readonly T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
