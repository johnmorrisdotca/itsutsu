/**
 * Everything drawn from a stream: integers, floats, coin flips, picks,
 * shuffles, weighted choices and a bell curve. Each takes the `Random` first,
 * so the same code runs on `Math.random` or on a seeded stream, and each takes
 * exactly the draws its documentation says, so a seeded result never moves
 * between versions.
 */
import type { Random } from "./random.ts";

function checkInteger(name: string, value: number): void {
  if (!Number.isSafeInteger(value)) throw new RangeError(`tane: ${name} must be a safe integer, not ${value}`);
}

/** An integer in [0, n): one draw. */
export function below(random: Random, n: number): number {
  checkInteger("n", n);
  if (n < 1) throw new RangeError(`tane: cannot draw below ${n}`);
  return Math.floor(random() * n);
}

/** An integer from `min` to `max`, both included: one draw. */
export function int(random: Random, min: number, max: number): number {
  checkInteger("min", min);
  checkInteger("max", max);
  if (max < min) throw new RangeError(`tane: int(${min}, ${max}) has no integers`);
  return Math.floor(min + random() * (max - min + 1));
}

/** A number in [min, max): one draw. */
export function float(random: Random, min: number, max: number): number {
  return min + random() * (max - min);
}

/** True with probability `p`, from 0 (never) to 1 (always): one draw. */
export function chance(random: Random, p: number): boolean {
  return random() < p;
}

/** One item of a list, each as likely as the next: one draw. Throws on an empty list. */
export function pick<T>(random: Random, items: readonly T[]): T {
  if (items.length === 0) throw new RangeError("tane: cannot pick from an empty list");
  return items[Math.floor(random() * items.length)] as T;
}

/**
 * The list in place, in a random order (Fisher–Yates, from the end): one draw
 * for each item but the first. Returns the same array.
 */
export function shuffle<T>(random: Random, items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const kept = items[i] as T;
    items[i] = items[j] as T;
    items[j] = kept;
  }
  return items;
}

/** A shuffled copy; the list given is left alone. The same order `shuffle` would make. */
export function shuffled<T>(random: Random, items: readonly T[]): T[] {
  return shuffle(random, [...items]);
}

/**
 * `count` items of a list, no item twice, in the order drawn: a partial
 * Fisher–Yates, one draw each. Asking for more than the list holds gives the
 * whole list, shuffled.
 */
export function sample<T>(random: Random, items: readonly T[], count: number): T[] {
  checkInteger("count", count);
  const pool = [...items];
  const take = Math.max(0, Math.min(count, pool.length));
  for (let i = 0; i < take; i += 1) {
    const j = i + Math.floor(random() * (pool.length - i));
    const kept = pool[i] as T;
    pool[i] = pool[j] as T;
    pool[j] = kept;
  }
  return pool.slice(0, take);
}

/**
 * `count` different integers below `limit`, in the order drawn, by drawing
 * again whenever a number comes up twice. The draw count therefore depends on
 * the luck of the stream; prefer `sample` for new code, and keep this where a
 * stored seed already depends on it.
 */
export function distinctBelow(random: Random, count: number, limit: number): number[] {
  const drawn: number[] = [];
  while (drawn.length < Math.min(count, limit)) {
    const candidate = Math.floor(random() * limit);
    if (!drawn.includes(candidate)) drawn.push(candidate);
  }
  return drawn;
}

/**
 * An index into `weights`, each chosen in proportion to its weight: one draw.
 * Weights must not be negative; a list whose weights sum to nothing gives 0.
 */
export function weightedIndex(random: Random, weights: readonly number[]): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return 0;
  let roll = random() * total;
  for (let i = 0; i < weights.length; i += 1) {
    roll -= weights[i] as number;
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

/** One item, chosen by the matching weight: one draw. */
export function weightedPick<T>(random: Random, items: readonly T[], weights: readonly number[]): T {
  if (items.length === 0) throw new RangeError("tane: cannot pick from an empty list");
  return items[weightedIndex(random, weights)] as T;
}

/** A number from a normal distribution (Box–Muller): two draws. */
export function normal(random: Random, mean = 0, spread = 1): number {
  const u1 = Math.max(random(), Number.EPSILON);
  const u2 = random();
  return mean + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * spread;
}
