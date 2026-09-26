/**
 * A small, seeded, deterministic random source for the player-journey
 * projection (`journeys.ts`). Never `Math.random`: the same seed must produce
 * the same 1000 players and the same twelve months, run after run, so the
 * page renders the same numbers on every request and the unit tests can
 * assert exact values.
 *
 * Mulberry32, a well-known 32-bit generator that is small, fast and good
 * enough for a projection — this is not cryptography and not game fairness,
 * it is a spreadsheet standing in for one.
 */
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A number in [min, max). */
export function uniform(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** An integer in [min, max]. */
export function uniformInt(rng: Rng, min: number, max: number): number {
  return Math.floor(uniform(rng, min, max + 1));
}

/** True with probability `p` (0 to 1). */
export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

/** A normal (Gaussian) draw via Box-Muller, from two uniform draws of the same seeded source. */
export function normal(rng: Rng, mean: number, spread: number): number {
  const u1 = Math.max(rng(), Number.EPSILON);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * spread;
}

/** One index from `weights`, chosen proportionally. Every weight must be >= 0 and at least one > 0. */
export function weightedIndex(rng: Rng, weights: readonly number[]): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return 0;
  let roll = rng() * total;
  for (let i = 0; i < weights.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

/** One element of `items`, chosen by the matching entry in `weights`. */
export function weightedPick<T>(rng: Rng, items: readonly T[], weights: readonly number[]): T {
  return items[weightedIndex(rng, weights)];
}
