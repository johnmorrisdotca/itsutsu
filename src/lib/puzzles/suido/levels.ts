import {
  blockOf,
  blockRange,
  blocksIn,
  firstUnsolvedSuidoLevel,
  levelAnswer,
  loadSuidoLevels,
  nextSuidoLevel,
  openSuidoLevels,
  SUIDO_BLOCK,
  SUIDO_LEVEL_COUNTS,
  type LevelRow,
} from "@johnmorrisdotca/suido/levels";

import type { Puzzle } from "../puzzles.types";
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
 * (`sizes.ts`). The package's loader fetches a size only when asked, in a
 * browser and in Node alike, so a phone playing 5×5 carries none of the other
 * twelve; how many levels a size has, which are open and which comes next are
 * the package's too, read without loading a size.
 */
const loaded = new Map<number, readonly LevelRow[]>();

/** A size's levels, fetched once and kept. Throws for a size the levels do not come in. */
export async function loadSuidoLevelsAt(size: number): Promise<readonly LevelRow[]> {
  const already = loaded.get(size);
  if (already !== undefined) return already;
  const key = suidoSizeKey(size);
  if (key === null || SUIDO_LEVEL_COUNTS[key] === undefined) throw new Error(`Suido's levels do not come in size ${size}.`);
  const levels = await loadSuidoLevels(key);
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

/** The level a board is, at a loaded size, or null for a board no level has — and for a size not loaded, which is never a level: nothing here says "yes" to what it cannot look up. */
export function suidoLevelOfBoard(size: number, board: string): number | null {
  const rows = loaded.get(size);
  if (rows === undefined) return null;
  const at = rows.findIndex(([code]) => code === board);
  return at === -1 ? null : at + 1;
}
