import {
  blockOf,
  blockRange,
  blocksIn,
  firstUnsolvedSuidoLevel,
  levelAnswer,
  nextSuidoLevel,
  openSuidoLevels,
  SUIDO_BLOCK,
  SUIDO_LEVEL_COUNTS,
  type LevelRow,
} from "@johnmorrisdotca/suido/levels-info";

import { suidoLevelBoards } from "@/lib/puzzles/suido/levelBoards";

import type { Puzzle } from "../puzzles.types";
import { HASH_LENGTH, suidoBoardHash } from "./boardHash";
import { isSuidoLevelAt, suidoLevelBand } from "./levelCounts";
import { suidoLevelSeed } from "./seed";
import { suidoSizeKey } from "./sizes";

export { nextLevelLabel } from "../fixedLevel";
export { isSuidoLevelAt, suidoLevelBand, suidoLevelCount } from "./levelCounts";
export { blockOf, blockRange, blocksIn, SUIDO_BLOCK };
export type { LevelRow };

/**
 * SUIDO'S LEVELS ON THE SITE: the package's own (`@johnmorrisdotca/suido`, an
 * open-source package, github.com/johnmorrisdotca/suido), each size its own
 * file, read here a size at a time and handed to the site as puzzles.
 *
 * A level is not made from a seed as a board is: level 12 at 7×7 is one board
 * for every player on every day, so a time on it can be compared with anybody's.
 * The address says which level through the seed (`levelSeed`, `suido/seed.ts`),
 * where every puzzle's address, kept run and race carry which puzzle it is.
 *
 * A size is read as the site keeps it (a square's side, 507 for the 5×7), and
 * the package's own name for it ("7x7") is found here and nowhere else
 * (`sizes.ts`). The package's loader fetches a size only when asked, so a phone
 * playing 5×5 carries none of the other fifteen; how many levels a size has, which
 * are open and which comes next are the package's too, read without loading a
 * size (`levels-info`, which carries no board).
 *
 * THE BOARDS ARE THE BROWSER'S, AND A SERVER KNOWS A LEVEL BY ITS HASH. The levels are the biggest data the package has
 * (a megabyte for the thirteen ordinary sizes and 280 KB more for the huge three), and a function's size is what the account
 * pays for, so no server reads one: the browser, where `typeof window` is defined and the server's branch is cut away by the
 * build, uses the package's loader for all sixteen, and the server names which level a board is by a hash of it
 * (`boardHash.ts`, `levelBoards.data.ts`), which is all a check or a list of solves needs. A unit test or a spec with no
 * browser reads the boards through `levelsModule.ts`.
 */
const loaded = new Map<number, readonly LevelRow[]>();

/** How a caller with no browser reads a size's levels; set by `levelsModule.ts`, which no page imports. */
let readWithoutBrowser: ((key: string) => Promise<readonly LevelRow[]>) | null = null;

/** Lets `loadSuidoLevelsAt` answer where there is no browser (`levelsModule.ts`). */
export function readSuidoLevelsWith(reader: (key: string) => Promise<readonly LevelRow[]>): void {
  readWithoutBrowser = reader;
}

/** Whether a size's levels can be read here: in a browser, or where a test or a spec has said how (`levelsModule.ts`). A server cannot, and does not need to. */
export function suidoLevelsReadable(): boolean {
  return typeof window !== "undefined" || readWithoutBrowser !== null;
}

async function readLevels(key: string): Promise<readonly LevelRow[]> {
  if (typeof window !== "undefined") {
    const { loadSuidoLevels } = await import("@johnmorrisdotca/suido/levels");
    return loadSuidoLevels(key);
  }
  if (readWithoutBrowser === null) throw new Error(`The ${key} levels are read in the browser only: a server knows a level by its hash (suido/levels.ts).`);
  return readWithoutBrowser(key);
}

/** A size's levels, fetched once and kept. Throws for a size the levels do not come in, and where there is no browser (a server names a level by its hash). */
export async function loadSuidoLevelsAt(size: number): Promise<readonly LevelRow[]> {
  const already = loaded.get(size);
  if (already !== undefined) return already;
  const key = suidoSizeKey(size);
  if (key === null || SUIDO_LEVEL_COUNTS[key] === undefined) throw new Error(`Suido's levels do not come in size ${size}.`);
  const levels = await readLevels(key);
  loaded.set(size, levels);
  return levels;
}

export async function loadEverySuidoLevel(sizes: readonly number[]): Promise<void> {
  await Promise.all(sizes.map((size) => loadSuidoLevelsAt(size)));
}

/** A size already loaded, or a refusal: nothing answers for a list it does not have. */
export function suidoLevelsAt(size: number): readonly LevelRow[] {
  const levels = loaded.get(size);
  if (levels === undefined) throw new Error(`Suido's ${suidoSizeKey(size) ?? size} levels have not been loaded (loadSuidoLevelsAt).`);
  return levels;
}

/** Whether a size's levels have been loaded here. */
export function suidoLevelsLoaded(size: number): boolean {
  return loaded.has(size);
}

/** The hash and the first characters of level `level`, which is how a server names the board; undefined for a size or a level that has none. */
export function suidoBoardOf(size: number, level: number): { prefix: string; hash: string } | undefined {
  const known = suidoLevelBoards()[size];
  if (known === undefined || !isSuidoLevelAt(size, level)) return undefined;
  const at = level - 1;
  return { prefix: known.prefixes.slice(at * known.prefixLength, (at + 1) * known.prefixLength), hash: known.hashes.slice(at * HASH_LENGTH, (at + 1) * HASH_LENGTH) };
}

/** Every size's hashes, found once and kept: a level number by the hash of its board. */
const numbersByHash = new Map<number, ReadonlyMap<string, number>>();

function levelNumbersOf(size: number): ReadonlyMap<string, number> | undefined {
  const already = numbersByHash.get(size);
  if (already !== undefined) return already;
  const known = suidoLevelBoards()[size];
  if (known === undefined) return undefined;
  const numbers = new Map<string, number>();
  for (let at = 0; at * HASH_LENGTH < known.hashes.length; at += 1) numbers.set(known.hashes.slice(at * HASH_LENGTH, (at + 1) * HASH_LENGTH), at + 1);
  numbersByHash.set(size, numbers);
  return numbers;
}

/** Levels 1 up to this many are open, given the ones solved. */
export function openSuidoLevelsAt(size: number, solved: ReadonlySet<number>): number {
  const key = suidoSizeKey(size);
  return key === null ? 0 : openSuidoLevels(key, solved);
}

/** The level to open on: the first open one not yet solved. */
export function nextSuidoLevelAt(size: number, solved: ReadonlySet<number>): number {
  const key = suidoSizeKey(size);
  return key === null ? 1 : nextSuidoLevel(key, solved);
}

/** The lowest level not yet solved, or null when every level of the size is. */
export function firstUnsolvedSuidoLevelAt(size: number, solved: ReadonlySet<number>): number | null {
  const key = suidoSizeKey(size);
  return key === null ? null : firstUnsolvedSuidoLevel(key, solved);
}

/** Level `level` of a loaded size, as a puzzle; its number travels as its seed. */
export function suidoLevelPuzzle(size: number, level: number): Puzzle {
  const rows = suidoLevelsAt(size);
  // An address naming no level is read as the first, never as an error in render.
  const number = isSuidoLevelAt(size, level) ? level : 1;
  const row = rows[number - 1]!;
  const solution = levelAnswer(row);
  if (solution === null) throw new Error(`Suido level ${number} at ${suidoSizeKey(size)} is not a board and its answer.`);
  return { kind: "suido", size, level: suidoLevelBand(size, number), seed: suidoLevelSeed(number), givens: row[0], solution };
}

/**
 * The level a board is at a size, or null for a board no level of it is, found by its hash whether the size's levels are loaded or
 * not: a server has none of them loaded and still has to say which level a solve was.
 */
export function suidoLevelOfBoard(size: number, board: string): number | null {
  return levelNumbersOf(size)?.get(suidoBoardHash(board)) ?? null;
}
