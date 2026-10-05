import { isGameSolved } from "@johnmorrisdotca/tobiishi";

import type { PuzzleCheck } from "../puzzles.types";
import { tobiishiChallengeOf, tobiishiLevelOfBoard, tobiishiRefOfCode } from "./levels";
import { replayJumps } from "./way";

/**
 * Whether an answer solves a Tobiishi level: a run of jumps, every one legal
 * where the run had got to, that leaves one peg, in the goal hole. The level is
 * its code, and the code is held to what the site makes: one of the levels of
 * its length, whose starting position the package makes again from it. There is
 * no search: the work is one jump at a time over at most nine jumps. Any legal
 * run to the goal solves it, not only the package's own answer.
 */
export function checkTobiishi(size: number, givens: string, answer: string): PuzzleCheck {
  if (tobiishiLevelOfBoard(size, givens) === null) return { ok: false, reason: "the givens are not a level of that length" };
  const ref = tobiishiRefOfCode(givens);
  if (ref === null) return { ok: false, reason: "the givens are not a level" };
  const played = replayJumps(tobiishiChallengeOf(ref).game, answer);
  if (played === null) return { ok: false, reason: "that is not a run of legal jumps on this board" };
  if (!isGameSolved(played)) return { ok: false, reason: "one peg must be left, in the goal hole" };
  return { ok: true };
}
