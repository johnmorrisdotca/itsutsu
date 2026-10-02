import type { PuzzleLevel } from "../puzzles.types";
import { isMeikyuuSize } from "./sizes";

/**
 * HOW MANY LEVELS A MEIKYUU SIZE HAS, AND WHICH THIRD A LEVEL SITS IN, with
 * nothing imported from the package: an address reads them on every page that
 * has one, and the package's own list (`@johnmorrisdotca/meikyuu/levels`) is
 * the data a size's levels are read from. `levels.test.ts` holds these numbers
 * to the package's, for every size.
 *
 * The package has 1,000 maze levels, ordered so that none is easier than the
 * one before, and says how big each is. A size is the levels of that bigness,
 * in the package's order: 217 small, 231 medium, 285 large and 267 huge. A
 * level published keeps its place in the package's list, and a list is only
 * ever added to at the end, so a size's numbers never move.
 */
export const MEIKYUU_LEVEL_COUNTS: Readonly<Record<number, number>> = { 1: 217, 2: 231, 3: 285, 4: 267 };

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
