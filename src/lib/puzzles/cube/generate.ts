import { encodeCubeMoves, randomScramble, solvedCube, turnAll, undoAll, type CubeMove } from "@johnmorrisdotca/kyuubu";

import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { seededRandom } from "../random";

/**
 * A CUBE FROM A SEED, as every puzzle is made: in the browser, the same in
 * every browser. The cube itself — its turns, its notation, its scrambles and
 * its 3D view — is Kyuubu (`@johnmorrisdotca/kyuubu`), a package of its own; what is
 * here is what makes it a puzzle on this site.
 *
 * `size` is the cube's side, 2 to 5; `level` is how far from solved it is
 * turned. Easy is a handful of turns a beginner can take back by looking,
 * medium enough that looking stops working, and hard a competition's
 * scramble: as long as the ones official events use for each size.
 *
 * The givens are the scrambled stickers and the solution is the scramble
 * taken back, which always solves it; any other way to solved is a solve too
 * (`checkCube` asks only that every face ends one colour).
 */

/** The sizes a cube is turned at here. */
export const CUBE_SIZES = [2, 3, 4, 5] as const;

/** How many turns a scramble is, by level and size. */
export const SCRAMBLE_LENGTHS: Record<PuzzleLevel, Record<number, number>> = {
  easy: { 2: 3, 3: 4, 4: 5, 5: 6 },
  medium: { 2: 6, 3: 9, 4: 14, 5: 18 },
  hard: { 2: 11, 3: 25, 4: 40, 5: 60 },
  "extra-hard": { 2: 11, 3: 25, 4: 40, 5: 60 },
};

/** The scramble a seed names at this size and level. Part of what a seed means: changing it changes every kept cube. */
export function scrambleOf(size: number, level: PuzzleLevel, seed: number): CubeMove[] {
  return randomScramble(size, SCRAMBLE_LENGTHS[level][size] ?? SCRAMBLE_LENGTHS[level][3], seededRandom(seed));
}

/** The scrambled cube a seed names: what the server compares a handed-in solve's givens with. */
export function cubeOfSeed(size: number, level: PuzzleLevel, seed: number): string {
  return turnAll(solvedCube(size), size, scrambleOf(size, level, seed));
}

export function generateCube(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const scramble = scrambleOf(size, level, seed);
  return {
    kind: "cube",
    size,
    level,
    seed,
    givens: turnAll(solvedCube(size), size, scramble),
    solution: encodeCubeMoves(undoAll(scramble)),
  };
}
