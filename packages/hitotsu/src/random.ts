/** A source of numbers in [0, 1): `Math.random`, or a seeded one so a deal can be made again. */
export type Random = () => number;

/** A seeded generator (mulberry32): the same seed gives the same numbers, on every machine. */
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

/** Two numbers mixed into one seed, so each hand of a game is shuffled from its own. */
export function mixSeed(seed: number, salt: number): number {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (salt + 0x7f4a7c15), 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** A shuffled copy (Fisher–Yates); the list given is left as it was. */
export function shuffled<T>(items: readonly T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** The largest seed a deal takes: a whole number that travels in an address or a request as it is. */
export const SEED_MOST = 2 ** 31 - 1;

/** A fresh seed for a new deal. */
export function freshSeed(random: Random = Math.random): number {
  return 1 + Math.floor(random() * (SEED_MOST - 1));
}
