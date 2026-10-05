import {
  checkKazu,
  generateDiagonal as kazuDiagonal,
  generateJigsaw as kazuJigsaw,
  generateMoreOrLess as kazuMoreOrLess,
  generateNumberPlace as kazuNumberPlace,
  generateSumCages as kazuSumCages,
  generateTowers as kazuTowers,
  KAZU_KIND_OF_SITE_KIND,
  solveKazu,
  type KazuKind,
  type KazuPuzzle,
} from "@johnmorrisdotca/kazu";

import { ordinaryLevel } from "./ordinaryLevel";
import type { Puzzle, PuzzleCheck, PuzzleKind, PuzzleLevel } from "./puzzles.types";

/**
 * THE NUMBERS FAMILY IS KAZU'S. The six grid puzzles (Number Place, Jigsaw,
 * Diagonal, Sum Cages, More or Less, Towers) are made, solved and checked by
 * `@johnmorrisdotca/kazu` (github.com/johnmorrisdotca/kazu), taken out of this
 * site on 2026-10-01 with every puzzle it had made pinned: a puzzle is its
 * kind, size, level and seed, and a kept solve, a race and a daily puzzle are
 * made again from those four, so a version of Kazu that changes one is a new
 * major version there, never a bump here without a look.
 *
 * What stays the site's own is the spelling of a kind (`numberPlace`, where the
 * package says `number-place`), the words, the drawing around the grid and the
 * rest of what a solve is: this file only translates.
 */

/** The kinds Kazu makes, in the site's spelling. */
export type NumberKind = "numberPlace" | "jigsaw" | "diagonal" | "sumCages" | "moreOrLess" | "towers";

/** Each of the six by the site's spelling, to the package's. */
export const KAZU_KIND_OF: Record<NumberKind, KazuKind> = KAZU_KIND_OF_SITE_KIND as Record<NumberKind, KazuKind>;

/** Whether a puzzle kind is one of the six Kazu makes. */
export function isNumberKind(kind: PuzzleKind): kind is NumberKind {
  return Object.hasOwn(KAZU_KIND_OF, kind);
}

/** Kazu's puzzle as the site's: its own kind spelled the site's way, everything else as made. */
function asPuzzle(kind: NumberKind, made: KazuPuzzle): Puzzle {
  return { kind, size: made.size, level: made.level, seed: made.seed, givens: made.givens, solution: made.solution };
}

/*
 * The generators Kazu exports one by one, not its `generateKazu` door: the
 * door refuses a seed or a size outside what it makes, where these have always
 * taken any number a caller passed, and the site keeps that.
 */
export const generateNumberPlace = (size: number, level: PuzzleLevel, seed: number): Puzzle => asPuzzle("numberPlace", kazuNumberPlace(size, ordinaryLevel(level), seed));
export const generateDiagonal = (size: number, level: PuzzleLevel, seed: number): Puzzle => asPuzzle("diagonal", kazuDiagonal(size, ordinaryLevel(level), seed));
export const generateJigsaw = (size: number, level: PuzzleLevel, seed: number): Puzzle => asPuzzle("jigsaw", kazuJigsaw(size, ordinaryLevel(level), seed));
export const generateSumCages = (size: number, level: PuzzleLevel, seed: number): Puzzle => asPuzzle("sumCages", kazuSumCages(size, ordinaryLevel(level), seed));
export const generateMoreOrLess = (size: number, level: PuzzleLevel, seed: number): Puzzle => asPuzzle("moreOrLess", kazuMoreOrLess(size, ordinaryLevel(level), seed));
export const generateTowers = (size: number, level: PuzzleLevel, seed: number): Puzzle => asPuzzle("towers", kazuTowers(size, ordinaryLevel(level), seed));

/** Whether an answer solves one of the six: Kazu's check, O(cells), the one the server also runs. The reasons are Kazu's words, which are the ones the site has always said. */
export function checkNumbers(kind: NumberKind, size: number, givens: string, answer: string): PuzzleCheck {
  return checkKazu(KAZU_KIND_OF[kind], size, givens, answer);
}

/**
 * The one answer a puzzle's givens allow, as a cells code, or null for none or more than one.
 * No step budget: the search that made the puzzle has always been run to the end here, and a
 * finished page draws its grid solved only when the search finds it.
 */
export function numbersAnswerOf(kind: NumberKind, size: number, givens: string): string | null {
  return solveKazu(KAZU_KIND_OF[kind], size, givens, Infinity);
}
