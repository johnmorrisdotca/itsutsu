import type { MeikyuuMazeLevel } from "@johnmorrisdotca/meikyuu/levels";

import type { Puzzle } from "../puzzles.types";
import { isMeikyuuLevelAt, meikyuuLevelBand } from "./levelCounts";
import { MEIKYUU_SIZES, meikyuuSizeOfWord } from "./sizes";
import { encodeWay } from "./way";

export { nextLevelLabel } from "../fixedLevel";

/**
 * MEIKYUU'S LEVELS ON THE SITE: the package's own (`@johnmorrisdotca/meikyuu`,
 * an open-source package, github.com/johnmorrisdotca/meikyuu), read here as the
 * four sizes of the maze list and handed to the site as puzzles.
 *
 * A level is not made from a seed as a board is: level 12 at Small is one maze
 * for every player on every day, so a time on it can be compared with anybody's.
 * The address still says `seed`, because that is where every puzzle's address,
 * kept run and race carry which puzzle it is; for Meikyuu the seed IS the
 * level's number in its size, 1 up to the size's count.
 *
 * ONE LIST, FOUR SIZES. The package's list is one module (about 54 KB, the
 * recipes of all 1,000 mazes), fetched only when a puzzle is made, in a browser
 * as a script of its own (`typeof window`, as `wordData.ts` says why); a server
 * reads it through `levelsModule.ts`. A level's size is the package's own word
 * for its cells (`sizeOf`), and a size keeps the package's order, so the
 * numbers are the same on every machine.
 */
export type MeikyuuLevelRow = {
  /** Its place in the package's whole list of maze levels, from 1. */
  readonly number: number;
  /** The recipe as one short word (`square:12x9:wilson:to-goal:48213`): a maze, never a drawing. */
  readonly code: string;
  readonly cells: number;
  /** About how many cells a person draws to solve it (`measureMaze`). */
  readonly effort: number;
  /** The effort on a scale of 1 to 100. */
  readonly rating: number;
};

type Package = typeof import("@johnmorrisdotca/meikyuu/levels");

const bySize = new Map<number, readonly MeikyuuLevelRow[]>();

let fromModule: (() => Promise<Package>) | null = null;

/** Used by `levelsModule.ts` only: how to read the list where there is no browser. */
export function readMeikyuuLevelsWith(source: () => Promise<Package>): void {
  fromModule = source;
}

async function importList(): Promise<Package> {
  if (typeof window !== "undefined") return import("@johnmorrisdotca/meikyuu/levels");
  if (fromModule === null) throw new Error("Meikyuu's levels are read on the server through levelsModule.ts, which was not imported.");
  return fromModule();
}

/** The package's list split into the four sizes, each in the package's order. */
function split(list: Package): void {
  const rows = new Map<number, MeikyuuLevelRow[]>();
  for (const level of list.MEIKYUU_MAZE_LEVELS as readonly MeikyuuMazeLevel[]) {
    const size = meikyuuSizeOfWord(list.sizeOf(level.cells));
    const row: MeikyuuLevelRow = { number: level.number, code: level.code, cells: level.cells, effort: level.effort, rating: level.rating };
    const own = rows.get(size);
    if (own === undefined) rows.set(size, [row]);
    else own.push(row);
  }
  for (const [size, own] of rows) bySize.set(size, own);
}

/** The levels, fetched once. Every size arrives together: they are one list. */
export async function loadMeikyuuLevels(): Promise<void> {
  if (bySize.size === MEIKYUU_SIZES.length) return;
  split(await importList());
}

/** A size's levels, fetched once and kept. */
export async function loadMeikyuuLevelsAt(size: number): Promise<readonly MeikyuuLevelRow[]> {
  await loadMeikyuuLevels();
  return meikyuuLevelsAt(size);
}

/** Whether the levels have arrived here. */
export function meikyuuLevelsLoaded(): boolean {
  return bySize.size === MEIKYUU_SIZES.length;
}

/** A size already loaded, or a refusal: nothing answers for a list it does not have. */
export function meikyuuLevelsAt(size: number): readonly MeikyuuLevelRow[] {
  const levels = bySize.get(size);
  if (levels === undefined) throw new Error(`Meikyuu's size ${size} levels have not been loaded (loadMeikyuuLevels).`);
  return levels;
}

/** Level `level` of a loaded size, as a puzzle; the level number travels as its seed. */
export function meikyuuLevelPuzzle(size: number, level: number): Puzzle {
  // An address naming no level is read as the first, never as an error in render.
  const number = isMeikyuuLevelAt(size, level) ? level : 1;
  const row = meikyuuLevelsAt(size)[number - 1]!;
  const solution = encodeWay(row.code);
  if (solution === null) throw new Error(`Meikyuu level ${number} at size ${size} (${row.code}) is not a maze.`);
  return { kind: "meikyuu", size, level: meikyuuLevelBand(size, number), seed: number, givens: row.code, solution };
}

/** The level a maze is, at a loaded size, or null for a recipe no level has — and for a size not loaded, which is never a level: nothing here says "yes" to what it cannot look up. */
export function meikyuuLevelOfBoard(size: number, code: string): number | null {
  const rows = bySize.get(size);
  if (rows === undefined) return null;
  const at = rows.findIndex((row) => row.code === code);
  return at === -1 ? null : at + 1;
}
