import { checkSlitherlink, generateSlitherlink, isSlitherlinkBoard, solveSlitherlink, type SlitherlinkBoard } from "@johnmorrisdotca/kazu/slitherlink";

import type { PuzzleCheck } from "../puzzles.types";
import { BLANK, charFix, charMissing, charWrong, isCodeOf } from "./codes";
import type { PencilEngine } from "./pencil.types";

/**
 * SLITHERLINK, one loop round the numbers: Kazu's (`@johnmorrisdotca/kazu/slitherlink`).
 *
 * The givens are a character a cell: `.` for a cell with no number, `0` to `3`
 * for the number of its four edges the loop uses. What a reader writes is a
 * character an EDGE, the horizontal ones first and then the vertical ones,
 * each in reading order as Kazu numbers them: `.` for an edge left alone, `#`
 * for one the loop runs along. So a code is longer than the board has cells.
 */
export const EDGE = "#";

const edgesOf = (size: number): number => 2 * size * (size + 1);

/** The board the givens are, or null for givens that are not one. */
export function slitherlinkBoardOf(size: number, givens: string): SlitherlinkBoard | null {
  if (givens.length !== size * size) return null;
  const clues: (number | null)[] = [];
  for (const character of givens) {
    if (character === BLANK) clues.push(null);
    else if (character >= "0" && character <= "3") clues.push(Number(character));
    else return null;
  }
  const board = { width: size, height: size, clues };
  return isSlitherlinkBoard(board) ? board : null;
}

/** The edges a code draws the loop along, or null for a code that is not one. */
export function slitherlinkEdgesOf(size: number, code: string): number[] | null {
  if (!isCodeOf(code, edgesOf(size), `${BLANK}${EDGE}`)) return null;
  return [...code].flatMap((character, at) => (character === EDGE ? [at] : []));
}

const codeOf = (size: number, edges: readonly number[]): string => Array.from({ length: edgesOf(size) }, (_, at) => (edges.includes(at) ? EDGE : BLANK)).join("");

export const slitherlink: PencilEngine = {
  codeLength: edgesOf,
  make(size, _level, seed) {
    const made = generateSlitherlink(size, size, seed);
    return { givens: made.clues.map((clue) => (clue === null ? BLANK : String(clue))).join(""), solution: codeOf(size, made.solution) };
  },
  reads: (size, givens) => slitherlinkBoardOf(size, givens) !== null,
  blank: (size) => BLANK.repeat(edgesOf(size)),
  fits: (size, code) => slitherlinkEdgesOf(size, code) !== null,
  check(size, givens, answer): PuzzleCheck {
    const board = slitherlinkBoardOf(size, givens);
    if (board === null) return { ok: false, reason: "the givens are not a Slitherlink board" };
    const edges = slitherlinkEdgesOf(size, answer);
    if (edges === null) return { ok: false, reason: "the answer is not a set of edges" };
    const verdict = checkSlitherlink(board, edges);
    if (verdict.ok) return { ok: true };
    if (verdict.clues.length > 0) return { ok: false, reason: "a number is not touched by its number of edges" };
    if (verdict.vertices.length > 0) return { ok: false, reason: "the line branches or stops" };
    return { ok: false, reason: "the line is not one loop" };
  },
  solve(size, givens) {
    const board = slitherlinkBoardOf(size, givens);
    if (board === null) return null;
    const found = solveSlitherlink(board, { limit: 2 });
    return found.complete && found.count === 1 && found.solution !== null ? codeOf(size, found.solution) : null;
  },
  wrong: (_size, code, solution) => charWrong(code, solution),
  missing: (_size, code, solution) => charMissing(code, solution),
  fix: (_size, code, solution) => charFix(code, solution),
  work: (size) => size * size,
};
