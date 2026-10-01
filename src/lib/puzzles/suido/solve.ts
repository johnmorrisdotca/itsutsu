import { decodeLayout, encodeLayout, solve, withMasks } from "@johnmorrisdotca/suido";

import { suidoCodeFits } from "./check";

/**
 * The answer a Suido board has, found again by the package's solver: every
 * board made here has exactly one (`makeSuido` proves it), so a finished page
 * whose answer was not kept can draw the board solved. Null for a code that is
 * not one of ours, and for a board with no answer or more than one: drawn
 * solved only when it is certainly the one that was.
 */
export function suidoAnswerOf(givens: string, size: number): string | null {
  // Any board of the size's shape, a level's twists included: the solver reads them all, and this only draws what it finds.
  const board = suidoCodeFits(givens, size) ? decodeLayout(givens) : null;
  if (board === null) return null;
  const found = solve(board, 2);
  return found.complete && found.count === 1 ? encodeLayout(withMasks(board, found.solutions[0]!)) : null;
}
