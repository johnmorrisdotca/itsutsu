import { describe, expect, it } from "vitest";

import { cycleOrder, poolOfCycle, repeatGap, wordOfDay } from "./dailyCycle";
import type { DailyPool } from "./dailyWords.types";

const words = (count: number, prefix = "w") => Array.from({ length: count }, (_, at) => `${prefix}${String(at).padStart(4, "0")}`);

/** The fewest days between two plays of one word over the first `days` days. */
function closestRepeat(key: string, versions: readonly DailyPool[], days: number): number {
  const last = new Map<string, number>();
  let closest = Infinity;
  for (let day = 0; day < days; day += 1) {
    const { word } = wordOfDay(key, versions, day)!;
    const before = last.get(word);
    if (before !== undefined) closest = Math.min(closest, day - before);
    last.set(word, day);
  }
  return closest;
}

describe("a day's word from its cycle", () => {
  const pool: DailyPool[] = [{ fromCycle: 0, words: words(1000) }];

  it("is the same word for the same day, however often and from however fresh a copy it is asked", () => {
    const again: DailyPool[] = [{ fromCycle: 0, words: words(1000) }];
    for (const day of [0, 1, 364, 999, 1000, 5000]) {
      expect(wordOfDay("en:5", pool, day)).toEqual(wordOfDay("en:5", pool, day));
      expect(wordOfDay("en:5", again, day)).toEqual(wordOfDay("en:5", pool, day));
    }
  });

  it("repeats no word in 365 consecutive days when the pool holds more than 365", () => {
    const seen = new Set<string>();
    for (let day = 0; day < 365; day += 1) seen.add(wordOfDay("en:5", pool, day)!.word);
    expect(seen.size).toBe(365);
  });

  it("uses every word of the pool once before any comes round again", () => {
    const first = new Set(Array.from({ length: 1000 }, (_, day) => wordOfDay("en:5", pool, day)!.word));
    expect(first.size).toBe(1000);
    expect([...first].sort()).toEqual(words(1000));
  });

  it("turns the cycle on the day after the pool's last word, with a fresh order that is still every word once", () => {
    expect(wordOfDay("en:5", pool, 999)).toMatchObject({ cycle: 0, place: 999, cycleLength: 1000 });
    expect(wordOfDay("en:5", pool, 1000)).toMatchObject({ cycle: 1, place: 0 });
    const second = Array.from({ length: 1000 }, (_, at) => wordOfDay("en:5", pool, 1000 + at)!.word);
    expect([...second].sort()).toEqual(words(1000));
    expect(second).not.toEqual(Array.from({ length: 1000 }, (_, day) => wordOfDay("en:5", pool, day)!.word));
  });

  it("repeats nothing inside a year across the seams either, for ten cycles", () => {
    expect(closestRepeat("en:5", pool, 10_000)).toBeGreaterThanOrEqual(365);
    // A pool only just over a year still keeps the year: the tightest case for the drawing.
    const tight: DailyPool[] = [{ fromCycle: 0, words: words(366) }];
    expect(closestRepeat("fr:4", tight, 366 * 6)).toBeGreaterThanOrEqual(365);
  });

  it("keeps half its length between plays for a pool smaller than a year, and never runs out", () => {
    const small: DailyPool[] = [{ fromCycle: 0, words: words(10) }];
    expect(repeatGap(10)).toBe(5);
    expect(closestRepeat("de:4", small, 500)).toBeGreaterThanOrEqual(5);
    expect(wordOfDay("de:4", small, 100_000)).not.toBeNull();
  });

  it("orders each language and length its own way", () => {
    expect(cycleOrder("en:5", pool, 0)).not.toEqual(cycleOrder("fr:5", pool, 0));
  });

  it("has nothing before the first day, and nothing from an empty pool", () => {
    expect(wordOfDay("en:5", pool, -1)).toBeNull();
    expect(wordOfDay("en:5", [{ fromCycle: 0, words: [] }], 0)).toBeNull();
    expect(wordOfDay("en:5", [{ fromCycle: 1, words: words(5) }], 0)).toBeNull();
  });

  it("never rewrites a past day when a new list arrives: the new version starts at a later cycle and reaches only that cycle's days", () => {
    const before: DailyPool[] = [{ fromCycle: 0, words: words(400) }];
    const after: DailyPool[] = [...before, { fromCycle: 2, words: [...words(380), ...words(50, "new")] }];
    for (let day = 0; day < 800; day += 1) expect(wordOfDay("ja:4", after, day)).toEqual(wordOfDay("ja:4", before, day));
    expect(poolOfCycle(after, 1)).toBe(before[0]!.words);
    const third = Array.from({ length: 430 }, (_, at) => wordOfDay("ja:4", after, 800 + at)!);
    expect(third.every((each) => each.cycle === 2)).toBe(true);
    expect(new Set(third.map((each) => each.word)).size).toBe(430);
    expect(third.some((each) => each.word.startsWith("new"))).toBe(true);
    // And the seam into the new list keeps the year too.
    expect(closestRepeat("ja:4", after, 800 + 430 * 3)).toBeGreaterThanOrEqual(365);
  });
});
