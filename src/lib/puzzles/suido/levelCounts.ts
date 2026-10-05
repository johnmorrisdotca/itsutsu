import type { PuzzleLevel } from "../puzzles.types";
import { isSuidoHugeSize, isSuidoLevelSize } from "./sizes";

/**
 * HOW MANY LEVELS A SUIDO SIZE HAS, AND WHICH THIRD A LEVEL SITS IN, with
 * nothing imported from the package: an address reads them on every page that
 * has one, and the package's own (`@johnmorrisdotca/suido/levels`) is the
 * loader that carries a size's data with it. `levels.test.ts` holds both to
 * the package's numbers, for every size it has.
 */
export const SUIDO_LEVELS_PER_SIZE = 256;

/** How many levels each of the huge sizes has: four blocks of sixteen. */
export const SUIDO_HUGE_LEVELS_PER_SIZE = 64;

/** How many levels a size has: 256, and sixty-four for a huge size; nought for a size the levels do not come in. */
export function suidoLevelCount(size: number): number {
  if (!isSuidoLevelSize(size)) return 0;
  return isSuidoHugeSize(size) ? SUIDO_HUGE_LEVELS_PER_SIZE : SUIDO_LEVELS_PER_SIZE;
}

/** Whether `level` is a level this size has. */
export function isSuidoLevelAt(size: number, level: number): boolean {
  return Number.isInteger(level) && level >= 1 && level <= suidoLevelCount(size);
}

/** Which third of a size a level sits in, as the easy, medium and hard every puzzle is filed under: the lists of solves, the fastest times and the feed all speak in those words. */
export function suidoLevelBand(size: number, level: number): PuzzleLevel {
  const count = suidoLevelCount(size) || SUIDO_LEVELS_PER_SIZE;
  const third = (level - 1) / count;
  return third < 1 / 3 ? "easy" : third < 2 / 3 ? "medium" : "hard";
}
