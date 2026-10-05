import { isTobiishiSize } from "./sizes";

/**
 * HOW MANY LEVELS A TOBIISHI SIZE HAS, with nothing imported from the package:
 * an address reads them on every page that has one. The package has nine named
 * boards (`TOBIISHI_CHALLENGE_PACKS`), each with three goal holes, at three
 * lengths: 81 challenges in all, and a length is 27 of them, the nine boards in
 * the package's order and each board's three goals in theirs. `levels.test.ts`
 * holds these numbers to the package's own table.
 *
 * A level published keeps its place, and a board added later goes at the end,
 * so a size's numbers never move. A solve is kept by the level's code, never by
 * its number, as every fixed level's is.
 */
export const TOBIISHI_BOARDS = 9;
export const TOBIISHI_GOALS_A_BOARD = 3;
export const TOBIISHI_LEVELS_A_SIZE = TOBIISHI_BOARDS * TOBIISHI_GOALS_A_BOARD;

/** How many levels a length has; nought for a length the levels do not come in. */
export function tobiishiLevelCount(size: number): number {
  return isTobiishiSize(size) ? TOBIISHI_LEVELS_A_SIZE : 0;
}

/** Whether `level` is a level this length has. */
export function isTobiishiLevelAt(size: number, level: number): boolean {
  return Number.isInteger(level) && level >= 1 && level <= tobiishiLevelCount(size);
}
