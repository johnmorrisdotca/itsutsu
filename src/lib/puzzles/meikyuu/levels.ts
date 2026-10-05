import type { MeikyuuMazeLevel } from "@johnmorrisdotca/meikyuu/levels";
import type { MeikyuuTallLevel } from "@johnmorrisdotca/meikyuu/levels/tall";

import type { Puzzle } from "../puzzles.types";
import { isMeikyuuLevelAt, meikyuuLevelBand } from "./levelCounts";
import { isMeikyuuTall, MEIKYUU_EVERY_SIZE, MEIKYUU_SIZES, MEIKYUU_TALL_SIZES, meikyuuSizeOfWord, meikyuuTallSize } from "./sizes";
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
 * ONE LIST, FOUR SIZES. The package's list is one module (about 60 KB, the
 * recipes of all 1,024 mazes), fetched only when a puzzle is made, in a browser
 * as a script of its own (`typeof window`, as `wordData.ts` says why); a server
 * reads it through `levelsModule.ts`. A level says its own size (the package's
 * word for its cells) and its place in it (`inSize`, 1 to 256), and that order
 * is the package's, by the score of how hard a maze is to play, so the numbers
 * are the same on every machine.
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
  /** How hard it is to play, 0 to 100 (`difficultyOf`): what its size's levels are put in order by. */
  readonly score: number;
};

type Package = typeof import("@johnmorrisdotca/meikyuu/levels");
type TallPackage = typeof import("@johnmorrisdotca/meikyuu/levels/tall");

const bySize = new Map<number, readonly MeikyuuLevelRow[]>();

let fromModule: (() => Promise<Package>) | null = null;
let tallFromModule: (() => Promise<TallPackage>) | null = null;

/** Used by `levelsModule.ts` only: how to read the lists where there is no browser. */
export function readMeikyuuLevelsWith(source: () => Promise<Package>, tallSource: () => Promise<TallPackage>): void {
  fromModule = source;
  tallFromModule = tallSource;
}

async function importList(): Promise<Package> {
  if (typeof window !== "undefined") return import("@johnmorrisdotca/meikyuu/levels");
  if (fromModule === null) throw new Error("Meikyuu's levels are read on the server through levelsModule.ts, which was not imported.");
  return fromModule();
}

/** The tall list is a script of its own (96 KB): a browser fetches it only when a tall size is asked for. */
async function importTallList(): Promise<TallPackage> {
  if (typeof window !== "undefined") return import("@johnmorrisdotca/meikyuu/levels/tall");
  if (tallFromModule === null) throw new Error("Meikyuu's tall levels are read on the server through levelsModule.ts, which was not imported.");
  return tallFromModule();
}

/** The package's list split into the four sizes, each level at the place it says it has in its size. */
function split(list: Package): void {
  const rows = new Map<number, MeikyuuLevelRow[]>();
  for (const level of list.MEIKYUU_MAZE_LEVELS as readonly MeikyuuMazeLevel[]) {
    const size = meikyuuSizeOfWord(level.size);
    const row: MeikyuuLevelRow = { number: level.number, code: level.code, cells: level.cells, effort: level.effort, rating: level.rating, score: level.score };
    const own = rows.get(size) ?? [];
    own[level.inSize - 1] = row;
    rows.set(size, own);
  }
  for (const [size, own] of rows) bySize.set(size, own);
}

/** The tall list split into its six sizes, each kept under its width and height as one number (`meikyuu/sizes.ts`). */
function splitTall(list: TallPackage): void {
  const rows = new Map<number, MeikyuuLevelRow[]>();
  for (const level of list.MEIKYUU_TALL_LEVELS as readonly MeikyuuTallLevel[]) {
    const shape = list.MEIKYUU_TALL_SIZES.find((each) => each.size === level.size);
    if (shape === undefined) continue;
    const size = meikyuuTallSize(shape.width, shape.height);
    const row: MeikyuuLevelRow = { number: level.number, code: level.code, cells: level.cells, effort: level.effort, rating: level.rating, score: level.score };
    const own = rows.get(size) ?? [];
    own[level.inSize - 1] = row;
    rows.set(size, own);
  }
  for (const [size, own] of rows) bySize.set(size, own);
}

/** The levels of the four sizes, fetched once. The four arrive together: they are one list. */
export async function loadMeikyuuLevels(): Promise<void> {
  if (MEIKYUU_SIZES.every((size) => bySize.has(size))) return;
  split(await importList());
}

/** The tall levels, fetched once. The six sizes arrive together: they are one list. */
export async function loadMeikyuuTallLevels(): Promise<void> {
  if (MEIKYUU_TALL_SIZES.every((size) => bySize.has(size))) return;
  splitTall(await importTallList());
}

/** The list a size is in, fetched once: the four sizes' or the tall one. */
export async function loadMeikyuuLevelsFor(size: number): Promise<void> {
  await (isMeikyuuTall(size) ? loadMeikyuuTallLevels() : loadMeikyuuLevels());
}

/** Every size's levels, both lists: for the server, which checks and counts a solve of any of them. */
export async function loadEveryMeikyuuLevels(): Promise<void> {
  await Promise.all([loadMeikyuuLevels(), loadMeikyuuTallLevels()]);
}

/** A size's levels, fetched once and kept. */
export async function loadMeikyuuLevelsAt(size: number): Promise<readonly MeikyuuLevelRow[]> {
  await loadMeikyuuLevelsFor(size);
  return meikyuuLevelsAt(size);
}

/** Whether the levels of a size (by default the four sizes') have arrived here. */
export function meikyuuLevelsLoaded(size: number = MEIKYUU_SIZES[0]!): boolean {
  return bySize.has(size);
}

/** Whether every list has arrived: the four sizes' and the tall one. */
export function everyMeikyuuLevelLoaded(): boolean {
  return MEIKYUU_EVERY_SIZE.every((size) => bySize.has(size));
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
