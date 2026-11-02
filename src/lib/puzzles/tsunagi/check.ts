import { checkTsunagiAnswer, decodeLayout } from "@johnmorrisdotca/tsunagi";

import { tsunagiLevelOf } from "./levels";
import type { PuzzleCheck } from "../puzzles.types";
import { no } from "@/lib/puzzles/puzzleReasons";

/**
 * Whether an answer joins a Tsunagi level: the check the browser makes to say
 * "solved" and the server makes before it pays. O(cells), no search.
 *
 * The layout must be one of the site's levels (its size loaded first, by
 * `preparePuzzle`), so nobody is paid or ranked for a board they made up; the
 * answer is then held to the rules a line keeps by Tsunagi's own check
 * (`checkTsunagiAnswer`).
 */
export function checkTsunagi(size: number, givens: string, answer: string): PuzzleCheck {
  if (decodeLayout(givens, size) === null) return no("chk.tsunagiLayout");
  if (tsunagiLevelOf(size, givens) === null) return no("chk.notSiteLevel");
  return checkTsunagiAnswer(size, givens, answer);
}
