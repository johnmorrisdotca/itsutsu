import { isTsunagiLevel as isLevelOfSet, levelSeed, setOfSeed, TSUNAGI_PORTAL_SIZES, TSUNAGI_SIZES, tsunagiBand as bandOf, type LevelRow, type TsunagiSet } from "@johnmorrisdotca/tsunagi";

import type { Puzzle, PuzzleLevel } from "../puzzles.types";

export { firstUnsolvedTsunagiLevel, nextTsunagiLevel, openTsunagiLevels, TSUNAGI_LEVEL_COUNTS, TSUNAGI_PORTAL_COUNTS, TSUNAGI_PORTAL_SEED, TSUNAGI_PORTAL_SIZES, TSUNAGI_SIZES } from "@johnmorrisdotca/tsunagi";
export { levelCountOf, levelSeed, setOfSeed } from "@johnmorrisdotca/tsunagi";
export type { LevelRow, TsunagiSet } from "@johnmorrisdotca/tsunagi";
export { nextLevelLabel } from "../fixedLevel";

/**
 * TSUNAGI'S LEVELS ON THE SITE: Tsunagi's own (`@johnmorrisdotca/tsunagi`, an
 * open-source package, github.com/johnmorrisdotca/tsunagi), each size its own
 * import, read here a size at a time and handed to the site as puzzles.
 *
 * A level is not made from a seed as every other puzzle is: level 12 at 7×7 is
 * one board for every player on every day, so a time on it can be compared
 * with anybody's. The address still says `seed`, because that is where every
 * puzzle's address, kept run and race carry which puzzle it is; for Tsunagi
 * the seed IS the level's number, 1 up to the size's count.
 *
 * THE LEVELS WITH PORTALS are a second set, each size with its own thirty-two,
 * numbered from 1 in the set. A record keeps a level by one number, so a portal
 * level's seed is `TSUNAGI_PORTAL_SEED` (1,000) and its number: past every level
 * of the first set, and the seed's own words say which set it is in (`setOfSeed`).
 * Everything here that takes a "level" from an address or a record takes that
 * seed; what a reader is shown is its number in its set (`setOfSeed(seed).level`).
 *
 * Each size is its own module, fetched only when a board of that size opens
 * (as the kana Gomoji's word lists are), so a phone playing 5×5 never carries
 * the other sizes. Only a browser fetches one (`typeof window`, as
 * `wordData.ts` says why); a server reads a size through `levelsModule.ts`.
 * How many levels a size has, which are open and which comes next are the
 * package's, read without loading a size.
 */
const loaded = new Map<string, readonly LevelRow[]>();

type LevelSource = (size: number, set: TsunagiSet) => Promise<readonly LevelRow[]>;

let fromModule: LevelSource | null = null;
let fromLayouts: LevelSource | null = null;

/** Used by `levelsModule.ts` only: how to read a size where there is no browser, boards and answers both (a unit test, a browser spec's own process). */
export function readTsunagiLevelsWith(source: LevelSource): void {
  fromModule = source;
}

/**
 * Used by `layoutsModule.ts` only: how a SERVER reads a size, as boards with no answer (`""`).
 * A server knows a level by its board — to check a solve, to list who solved which —
 * and the answers are over half of every size's file, carried by every function that
 * reads one. Where both are imported, the full levels are the ones read.
 */
export function readTsunagiLayoutsWith(source: LevelSource): void {
  fromLayouts = source;
}

async function importSize(size: number, set: TsunagiSet): Promise<readonly LevelRow[]> {
  if (typeof window !== "undefined") {
    if (set === "portals") {
      const levels = (await import("@johnmorrisdotca/tsunagi/levels-portals")).TSUNAGI_PORTAL_LEVELS[size];
      if (levels === undefined) throw new Error(`No Tsunagi with portals at ${size}×${size}.`);
      return levels;
    }
    // Named one by one, so the bundler splits each size into its own chunk.
    if (size === 4) return (await import("@johnmorrisdotca/tsunagi/levels-4")).TSUNAGI_4;
    if (size === 5) return (await import("@johnmorrisdotca/tsunagi/levels-5")).TSUNAGI_5;
    if (size === 6) return (await import("@johnmorrisdotca/tsunagi/levels-6")).TSUNAGI_6;
    if (size === 7) return (await import("@johnmorrisdotca/tsunagi/levels-7")).TSUNAGI_7;
    if (size === 8) return (await import("@johnmorrisdotca/tsunagi/levels-8")).TSUNAGI_8;
    if (size === 9) return (await import("@johnmorrisdotca/tsunagi/levels-9")).TSUNAGI_9;
    if (size === 10) return (await import("@johnmorrisdotca/tsunagi/levels-10")).TSUNAGI_10;
    if (size === 11) return (await import("@johnmorrisdotca/tsunagi/levels-11")).TSUNAGI_11;
    if (size === 12) return (await import("@johnmorrisdotca/tsunagi/levels-12")).TSUNAGI_12;
    if (size === 13) return (await import("@johnmorrisdotca/tsunagi/levels-13")).TSUNAGI_13;
    if (size === 14) return (await import("@johnmorrisdotca/tsunagi/levels-14")).TSUNAGI_14;
    if (size === 15) return (await import("@johnmorrisdotca/tsunagi/levels-15")).TSUNAGI_15;
    if (size === 20) return (await import("@johnmorrisdotca/tsunagi/levels-20")).TSUNAGI_20;
    if (size === 25) return (await import("@johnmorrisdotca/tsunagi/levels-25")).TSUNAGI_25;
    if (size === 30) return (await import("@johnmorrisdotca/tsunagi/levels-30")).TSUNAGI_30;
    throw new Error(`No Tsunagi at ${size}×${size}.`);
  }
  const source = fromModule ?? fromLayouts;
  if (source === null) throw new Error("Tsunagi's levels are read on the server through layoutsModule.ts (or levelsModule.ts), and neither was imported.");
  return source(size, set);
}

const keyOf = (size: number, set: TsunagiSet) => `${set}:${size}`;

export async function loadTsunagiLevels(size: number, set: TsunagiSet = "classic"): Promise<readonly LevelRow[]> {
  const already = loaded.get(keyOf(size, set));
  if (already !== undefined) return already;
  const levels = await importSize(size, set);
  loaded.set(keyOf(size, set), levels);
  return levels;
}

/** The size a seed's level is in, loaded: the set the seed names, at that size. */
export async function loadTsunagiLevelsOfSeed(size: number, seed: number): Promise<readonly LevelRow[]> {
  return loadTsunagiLevels(size, setOfSeed(seed).set);
}

export async function loadEveryTsunagiLevel(): Promise<void> {
  await Promise.all([...TSUNAGI_SIZES.map((size) => loadTsunagiLevels(size)), ...TSUNAGI_PORTAL_SIZES.map((size) => loadTsunagiLevels(size, "portals"))]);
}

/** A size already loaded in a set, or a refusal: nothing answers for a list it does not have. */
export function tsunagiLevelsOf(size: number, set: TsunagiSet = "classic"): readonly LevelRow[] {
  const levels = loaded.get(keyOf(size, set));
  if (levels === undefined) throw new Error(`The ${size}×${size} Tsunagi ${set === "portals" ? "portal " : ""}levels have not been loaded (loadTsunagiLevels).`);
  return levels;
}

/** Whether a seed names a level the size has, in either set. */
export function isTsunagiLevel(size: number, seed: number): boolean {
  const { set, level } = setOfSeed(seed);
  return isLevelOfSet(size, level, set);
}

/** Which third of a size a seed's level sits in, as the easy, medium and hard every puzzle is filed under: the lists of solves, the fastest times and the feed all speak in those words. */
export function tsunagiBand(size: number, seed: number): PuzzleLevel {
  const { set, level } = setOfSeed(seed);
  return bandOf(size, level, set);
}

/** Level `seed` of a loaded size, as a puzzle; the seed travels as its seed, a portal level's past the first set's. */
export function tsunagiPuzzle(size: number, seed: number): Puzzle {
  // An address naming no level is read as the first, never as an error in render.
  const number = isTsunagiLevel(size, seed) ? seed : 1;
  const { set, level } = setOfSeed(number);
  const [givens, solution] = tsunagiLevelsOf(size, set)[level - 1]!;
  return { kind: "tsunagi", size, level: tsunagiBand(size, number), seed: number, givens, solution };
}

/** The seed of the level a layout is, at a loaded size, in either set, or null for a layout no level has. */
export function tsunagiLevelOf(size: number, givens: string): number | null {
  for (const set of ["classic", "portals"] as const) {
    const levels = loaded.get(keyOf(size, set));
    const at = levels === undefined ? -1 : levels.findIndex(([layout]) => layout === givens);
    if (at !== -1) return levelSeed(set, at + 1);
  }
  return null;
}

