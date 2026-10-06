import { levelSeed, setOfSeed, type TsunagiSet } from "@/lib/puzzles/tsunagi/levels";

/**
 * TSUNAGI'S TWO SETS OF LEVELS, SEEN FROM A PAGE. A record keeps a level by one number, its seed: the level's own
 * number for the first set, 1,000 and its number for the levels with portals (`tsunagi/levels.ts`). A page that
 * shows one set at a time wants the level's number in that set, which is what a reader knows it by, so a record
 * kept by seed is narrowed to the set, keyed by number.
 */
export function inSet<T>(record: Readonly<Record<number, T>>, set: TsunagiSet): Record<number, T> {
  const out: Record<number, T> = {};
  for (const [key, value] of Object.entries(record)) {
    const named = setOfSeed(Number(key));
    if (named.set === set) out[named.level] = value;
  }
  return out;
}

/** Every record of a size, by seed, narrowed to one set. */
export function inSetBySize<T>(records: Readonly<Record<number, Readonly<Record<number, T>>>>, set: TsunagiSet): Record<number, Record<number, T>> {
  return Object.fromEntries(Object.entries(records).map(([size, record]) => [Number(size), inSet(record, set)]));
}

/** The seed of level `level` in a set: what an address, a record and a solve name it by. */
export function seedIn(set: TsunagiSet, level: number): number {
  return levelSeed(set, level);
}
