import { checkSuidoAnswer, decodeLayout, shapeOf, type Layout } from "@johnmorrisdotca/suido";

import type { PuzzleCheck } from "../puzzles.types";

/**
 * Whether an answer solves a Suido board: the package's check, O(cells), after
 * the board is held to what the site makes: a square of the size asked, one
 * pump, edges that do not join. The package's own check takes any board it can
 * read, and says it does not ask whether a site made it; a site that pays for
 * a solve asks that first.
 */
export function checkSuido(size: number, givens: string, answer: string): PuzzleCheck {
  if (boardOf(givens, size) === null) return { ok: false, reason: "the givens are not a board of that size" };
  return checkSuidoAnswer(givens, answer);
}

/** The board a code stands for, if it is one the site makes at this size; null for anything else. */
export function boardOf(code: string, size: number): Layout | null {
  const layout = decodeLayout(code);
  if (layout === null || layout.width !== size || layout.height !== size || layout.wrap || layout.sources.length !== 1) return null;
  return layout;
}

/** Whether a kept board is a board of this size, which is all a half-played run is read against (`SuidoSolve` reads the rest). */
export function suidoCodeFits(code: string, size: number): boolean {
  return boardOf(code, size) !== null;
}

/** The pieces a board has, which is the work in it: every cell that is not bare ground. */
export function suidoPieces(givens: string): number {
  const layout = decodeLayout(givens);
  return layout === null ? 0 : layout.cells.filter((mask) => shapeOf(mask) !== "blank").length;
}
