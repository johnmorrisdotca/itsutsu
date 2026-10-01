import { isTsunagiLevel, TSUNAGI_SIZES, tsunagiBand as bandOf, type LevelRow } from "@johnmorrisdotca/tsunagi";

import type { Puzzle, PuzzleLevel } from "../puzzles.types";

export { firstUnsolvedTsunagiLevel, isTsunagiLevel, nextTsunagiLevel, openTsunagiLevels, TSUNAGI_LEVEL_COUNTS, TSUNAGI_SIZES } from "@johnmorrisdotca/tsunagi";
export type { LevelRow } from "@johnmorrisdotca/tsunagi";
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
 * Each size is its own module, fetched only when a board of that size opens
 * (as the kana Gomoji's word lists are), so a phone playing 5×5 never carries
 * the other five sizes. Only a browser fetches one (`typeof window`, as
 * `wordData.ts` says why); a server reads a size through `levelsModule.ts`.
 * How many levels a size has, which are open and which comes next are the
 * package's, read without loading a size.
 */
const loaded = new Map<number, readonly LevelRow[]>();

let fromModule: ((size: number) => Promise<readonly LevelRow[]>) | null = null;

/** Used by `levelsModule.ts` only: how to read a size where there is no browser. */
export function readTsunagiLevelsWith(source: (size: number) => Promise<readonly LevelRow[]>): void {
  fromModule = source;
}

async function importSize(size: number): Promise<readonly LevelRow[]> {
  if (typeof window !== "undefined") {
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
    throw new Error(`No Tsunagi at ${size}×${size}.`);
  }
  if (fromModule === null) throw new Error("Tsunagi's levels are read on the server through levelsModule.ts, which was not imported.");
  return fromModule(size);
}

export async function loadTsunagiLevels(size: number): Promise<readonly LevelRow[]> {
  const already = loaded.get(size);
  if (already !== undefined) return already;
  const levels = await importSize(size);
  loaded.set(size, levels);
  return levels;
}

export async function loadEveryTsunagiLevel(): Promise<void> {
  await Promise.all(TSUNAGI_SIZES.map((size) => loadTsunagiLevels(size)));
}

/** A size already loaded, or a refusal: nothing answers for a list it does not have. */
export function tsunagiLevelsOf(size: number): readonly LevelRow[] {
  const levels = loaded.get(size);
  if (levels === undefined) throw new Error(`The ${size}×${size} Tsunagi levels have not been loaded (loadTsunagiLevels).`);
  return levels;
}

/** Which third of a size a level sits in, as the easy, medium and hard every puzzle is filed under: the lists of solves, the fastest times and the feed all speak in those words. */
export function tsunagiBand(size: number, level: number): PuzzleLevel {
  return bandOf(size, level);
}

/** Level `level` of a loaded size, as a puzzle; the level number travels as its seed. */
export function tsunagiPuzzle(size: number, level: number): Puzzle {
  const levels = tsunagiLevelsOf(size);
  // An address naming no level is read as the first, never as an error in render.
  const number = isTsunagiLevel(size, level) ? level : 1;
  const [givens, solution] = levels[number - 1]!;
  return { kind: "tsunagi", size, level: tsunagiBand(size, number), seed: number, givens, solution };
}

/** The level a layout is, at a loaded size, or null for a layout no level has. */
export function tsunagiLevelOf(size: number, givens: string): number | null {
  const at = tsunagiLevelsOf(size).findIndex(([layout]) => layout === givens);
  return at === -1 ? null : at + 1;
}
