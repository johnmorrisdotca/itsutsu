import { SEED_MOST, seededRandom } from "../random";
import type { DailyPool, DayWord } from "./dailyWords.types";

/**
 * WHICH WORD A DAY GETS: every word of a pool once, in a shuffled order,
 * before any word comes round again.
 *
 * Day 0 is the epoch (`dailyDay.ts`). The days run through CYCLES: a cycle is
 * one pass through its pool in an order drawn from a seed of its own, so day
 * N of a cycle is the N-th word of that order, and no word repeats inside
 * one. When a cycle ends the next begins in a fresh order from a new seed, so
 * the words never run out.
 *
 * AND THE SEAM BETWEEN TWO CYCLES REPEATS NOTHING INSIDE A YEAR. A plain
 * reshuffle could open the new cycle on a word the old one closed with last
 * week. So a word the old cycle used in its last `repeatGap` days is held back
 * in the new one until that many days have passed since it was played: any
 * 365 days in a row are 365 different words, for every pool of more than 365;
 * for a smaller pool the gap is half its length.
 *
 * PINNED, SO A LIST CHANGE NEVER REWRITES A PAST DAY. A cycle reads the pool
 * version in force when it starts (`fromCycle`), never the live word list, and
 * a version once published is never edited — `dailyPools.test.ts` holds each
 * one to its hash. A new list becomes a new version from a later cycle, and
 * reaches no day before that cycle's first.
 *
 * Pure and deterministic: the same pools, key and day give the same word in
 * every browser and on the server. Orders are remembered per cycle, since an
 * archive page asks for hundreds of days of one cycle at a time.
 */

/** The fewest days between two plays of one word, across a cycle's seam. */
export const REPEAT_GAP_DAYS = 365;

/** The gap a pool of this many words keeps: a year when it holds more than a year's words, half of it when it does not. */
export function repeatGap(poolLength: number): number {
  return poolLength > REPEAT_GAP_DAYS ? REPEAT_GAP_DAYS : Math.floor(poolLength / 2);
}

/** 32-bit FNV-1a of a text: a cycle's seed, and the hash a published pool is pinned by. */
export function fnv1a(text: string): number {
  let value = 0x811c9dc5;
  for (const char of text) {
    value ^= char.codePointAt(0)!;
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value;
}

/** The seed cycle `cycle` of a pool is drawn with: one per language, length and cycle. */
export function cycleSeed(key: string, cycle: number): number {
  return (fnv1a(`itsutsu daily words ${key} cycle ${cycle}`) % SEED_MOST) + 1;
}

/** The pool version cycle `cycle` draws from: the latest that starts at or before it, or null before any does. */
export function poolOfCycle(versions: readonly DailyPool[], cycle: number): readonly string[] | null {
  let found: DailyPool | null = null;
  for (const version of versions) if (version.fromCycle <= cycle && (found === null || version.fromCycle > found.fromCycle)) found = version;
  return found === null || found.words.length === 0 ? null : found.words;
}

/**
 * One cycle's order, drawn a place at a time from the words open at that
 * place. Every word is open from the start except the previous cycle's last
 * `gap`, each opened at the place that puts `gap` days between its two plays.
 * One opens at every place up to `gap`, so there is always a word to draw.
 */
function drawOrder(key: string, pool: readonly string[], cycle: number, previous: readonly string[] | null): string[] {
  const random = seededRandom(cycleSeed(key, cycle));
  const gap = repeatGap(pool.length);
  const inPool = new Set(pool);
  const opensAt = new Map<string, number>();
  if (previous !== null) {
    for (let fromEnd = 1; fromEnd <= Math.min(gap, previous.length); fromEnd += 1) {
      const word = previous[previous.length - fromEnd]!;
      if (inPool.has(word)) opensAt.set(word, gap - fromEnd);
    }
  }
  const later: string[][] = Array.from({ length: gap }, () => []);
  for (const [word, at] of opensAt) later[at]!.push(word);
  const open = pool.filter((word) => !opensAt.has(word));
  const order: string[] = [];
  for (let place = 0; place < pool.length; place += 1) {
    if (place < gap) open.push(...later[place]!);
    const pick = Math.floor(random() * open.length);
    order.push(open[pick]!);
    open[pick] = open[open.length - 1]!;
    open.pop();
  }
  return order;
}

/** Remembered orders, per list of versions (by identity) and then per key and cycle. */
const ORDERS = new WeakMap<readonly DailyPool[], Map<string, readonly string[]>>();

/** The order of a cycle's words, each cycle drawn after the one before it; null for a cycle with no pool. */
export function cycleOrder(key: string, versions: readonly DailyPool[], cycle: number): readonly string[] | null {
  const remembered = ORDERS.get(versions) ?? new Map<string, readonly string[]>();
  ORDERS.set(versions, remembered);
  let previous: readonly string[] | null = null;
  for (let at = 0; at <= cycle; at += 1) {
    const memo = `${key}#${at}`;
    let order = remembered.get(memo) ?? null;
    if (order === null) {
      const pool = poolOfCycle(versions, at);
      if (pool === null) return null;
      order = drawOrder(key, pool, at, previous);
      remembered.set(memo, order);
    }
    previous = order;
  }
  return previous;
}

/**
 * The word of day `dayIndex` (0 = the epoch), with the cycle and place it has,
 * or null for a day before the epoch or a pool with no words — never a guess.
 * Walks the cycles from the first, each as long as its own pool; a pool of six
 * hundred words is ten cycles in sixteen years.
 */
export function wordOfDay(key: string, versions: readonly DailyPool[], dayIndex: number): DayWord | null {
  if (!Number.isInteger(dayIndex) || dayIndex < 0) return null;
  let cycle = 0;
  let start = 0;
  for (;;) {
    const pool = poolOfCycle(versions, cycle);
    if (pool === null) return null;
    if (dayIndex < start + pool.length) {
      const order = cycleOrder(key, versions, cycle)!;
      const place = dayIndex - start;
      return { word: order[place]!, cycle, place, cycleLength: order.length };
    }
    start += pool.length;
    cycle += 1;
  }
}
