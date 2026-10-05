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

import type { Puzzle } from "../puzzles.types";
import { suidoBoardHash } from "./boardHash";
import { SUIDO_HUGE_BOARDS } from "./hugeLevels.data";
import { isSuidoLevelAt, suidoLevelBand } from "./levelCounts";
import { suidoLevelSeed } from "./seed";
import { isSuidoHugeSize, suidoSizeKey } from "./sizes";

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
 * THE SERVER READS THIRTEEN SIZES AND THE BROWSER SIXTEEN. A function's size is
 * what the account pays for and the huge sizes' boards are the biggest data the
 * package has, so the server's own copy of this module reads the thirteen it
 * always has, each by its own entry, and never names the huge three: it knows one
 * by its hash (`boardHash.ts`, `hugeLevels.data.ts`), which is all a check or a
 * list of solves needs. The browser, where `typeof window` is defined and the
 * server's branch is cut away by the build, uses the package's loader for all sixteen.
 */
const loaded = new Map<number, readonly LevelRow[]>();

/** The thirteen sizes a server reads, each by its own entry, so nothing a huge size owns is in a function. */
async function readOnServer(key: string): Promise<readonly LevelRow[]> {
  if (key === "5x5") return (await import("@johnmorrisdotca/suido/levels-5x5")).SUIDO_5X5;
  if (key === "6x6") return (await import("@johnmorrisdotca/suido/levels-6x6")).SUIDO_6X6;
  if (key === "7x7") return (await import("@johnmorrisdotca/suido/levels-7x7")).SUIDO_7X7;
  if (key === "8x8") return (await import("@johnmorrisdotca/suido/levels-8x8")).SUIDO_8X8;
  if (key === "9x9") return (await import("@johnmorrisdotca/suido/levels-9x9")).SUIDO_9X9;
  if (key === "10x10") return (await import("@johnmorrisdotca/suido/levels-10x10")).SUIDO_10X10;
  if (key === "11x11") return (await import("@johnmorrisdotca/suido/levels-11x11")).SUIDO_11X11;
  if (key === "12x12") return (await import("@johnmorrisdotca/suido/levels-12x12")).SUIDO_12X12;
  if (key === "13x13") return (await import("@johnmorrisdotca/suido/levels-13x13")).SUIDO_13X13;
  if (key === "14x14") return (await import("@johnmorrisdotca/suido/levels-14x14")).SUIDO_14X14;
  if (key === "5x7") return (await import("@johnmorrisdotca/suido/levels-5x7")).SUIDO_5X7;
  if (key === "6x10") return (await import("@johnmorrisdotca/suido/levels-6x10")).SUIDO_6X10;
  if (key === "8x14") return (await import("@johnmorrisdotca/suido/levels-8x14")).SUIDO_8X14;
  throw new Error(`The ${key} levels are read in the browser only: a server knows a huge level by its hash (suido/levels.ts).`);
}

async function readLevels(key: string): Promise<readonly LevelRow[]> {
  if (typeof window !== "undefined") {
    const { loadSuidoLevels } = await import("@johnmorrisdotca/suido/levels");
    return loadSuidoLevels(key);
  }
  return readOnServer(key);
}

/** A size's levels, fetched once and kept. Throws for a size the levels do not come in, and for a huge one where there is no browser. */
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

/** The hash and the first characters of level `level` of a huge size, which is how a server names the board; undefined for a size or a level that has none. */
export function suidoHugeBoardOf(size: number, level: number): { prefix: string; hash: string } | undefined {
  return SUIDO_HUGE_BOARDS[size]?.[level - 1];
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
 * The level a board is, at a loaded size, or null for a board no level has — and for a size not loaded, which is never a
 * level: nothing here says "yes" to what it cannot look up. A huge size is looked up by its hash, loaded or not, since a
 * server has none of it loaded and still has to say which level a solve was.
 */
export function suidoLevelOfBoard(size: number, board: string): number | null {
  if (isSuidoHugeSize(size)) {
    const hash = suidoBoardHash(board);
    const at = SUIDO_HUGE_BOARDS[size]?.findIndex((one) => one.hash === hash) ?? -1;
    return at === -1 ? null : at + 1;
  }
  const rows = loaded.get(size);
  if (rows === undefined) return null;
  const at = rows.findIndex(([code]) => code === board);
  return at === -1 ? null : at + 1;
}
