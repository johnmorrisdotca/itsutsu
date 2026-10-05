import type { PuzzleLevel } from "../puzzles.types";
import { isMeikyuuSize, MEIKYUU_EVERY_SIZE, MEIKYUU_SIZES, MEIKYUU_TALL_SIZES } from "./sizes";

/**
 * HOW MANY LEVELS A MEIKYUU SIZE HAS, AND WHICH THIRD A LEVEL SITS IN, with
 * nothing imported from the package: an address reads them on every page that
 * has one, and the package's own list (`@johnmorrisdotca/meikyuu/levels`) is
 * the data a size's levels are read from. `levels.test.ts` holds these numbers
 * to the package's, for every size.
 *
 * The package (2.0.0 on) has 1,024 maze levels, 256 to a size (`MEIKYUU_LEVELS_PER_SIZE`), and
 * 1,536 tall ones in six sizes of 256 (`levels/tall`):
 * a size is sixteen pages of sixteen, and its levels run from easy to hard in the order the
 * package gives, by the score it puts on how hard a maze is to play. John, 2026-10-02: "make
 * the numbers of puzzles more normal numbers... things like 132 or 256". The first release
 * had 217, 231, 285 and 267 by `sizeOf`; where each of those went is the package's
 * `levels/legacy` list, which no page here reads (see `meikyuuRecords.ts` for what a solve of
 * a maze that is no longer a level is).
 */
export const MEIKYUU_LEVELS_A_SIZE = 256;

export const MEIKYUU_LEVEL_COUNTS: Readonly<Record<number, number>> = Object.fromEntries(MEIKYUU_EVERY_SIZE.map((size) => [size, MEIKYUU_LEVELS_A_SIZE]));

/** How many levels the four sizes have between them, and how many the six tall ones: read from the sizes, never typed into copy. */
export const MEIKYUU_SQUARE_LEVELS_TOTAL = MEIKYUU_SIZES.length * MEIKYUU_LEVELS_A_SIZE;
export const MEIKYUU_TALL_LEVELS_TOTAL = MEIKYUU_TALL_SIZES.length * MEIKYUU_LEVELS_A_SIZE;

/** How many levels a size has; nought for a size the levels do not come in. */
export function meikyuuLevelCount(size: number): number {
  return isMeikyuuSize(size) ? MEIKYUU_LEVEL_COUNTS[size]! : 0;
}

/** Whether `level` is a level this size has. */
export function isMeikyuuLevelAt(size: number, level: number): boolean {
  return Number.isInteger(level) && level >= 1 && level <= meikyuuLevelCount(size);
}

/** Which third of a size a level sits in, as the easy, medium and hard every puzzle is filed under: the lists of solves, the fastest times and the feed all speak in those words. */
export function meikyuuLevelBand(size: number, level: number): PuzzleLevel {
  const count = meikyuuLevelCount(size) || 1;
  const third = (level - 1) / count;
  return third < 1 / 3 ? "easy" : third < 2 / 3 ? "medium" : "hard";
}

/** A block of levels on the set-up's board of levels: sixteen, in two rows of eight. */
export const MEIKYUU_BLOCK = 16;

/** How many blocks a size's levels make. */
export function meikyuuBlocksIn(count: number): number {
  return Math.max(1, Math.ceil(count / MEIKYUU_BLOCK));
}

/** The block, from 1, a level is in. */
export function meikyuuBlockOf(level: number): number {
  return Math.floor((Math.max(1, level) - 1) / MEIKYUU_BLOCK) + 1;
}

/** The first and last level of a block, the last block ending at the size's count. */
export function meikyuuBlockRange(block: number, count: number): { first: number; last: number } {
  const first = (Math.max(1, block) - 1) * MEIKYUU_BLOCK + 1;
  return { first, last: Math.min(count, first + MEIKYUU_BLOCK - 1) };
}
