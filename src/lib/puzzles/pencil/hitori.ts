import { checkHitori, generateHitori, isHitoriBoard, solveHitori, type HitoriBoard } from "@johnmorrisdotca/kazu/hitori";

import type { PuzzleCheck } from "../puzzles.types";
import { BLANK, charFix, charMissing, charWrong, isCodeOf } from "./codes";
import type { PencilEngine } from "./pencil.types";

/**
 * HITORI 一人, shade the repeats: Kazu's (`@johnmorrisdotca/kazu/hitori`).
 *
 * The givens are the numbers, a digit a cell. What a reader writes is a
 * character a cell: `.` for a number left alone, `#` for one shaded.
 */
export const SHADE = "#";

/** The board the givens are, or null for givens that are not one. */
export function hitoriBoardOf(size: number, givens: string): HitoriBoard | null {
  if (size !== 5 && size !== 7) return null;
  if (givens.length !== size * size || !/^[1-7]+$/.test(givens)) return null;
  const board: HitoriBoard = { size, numbers: [...givens].map(Number) };
  return isHitoriBoard(board) ? board : null;
}

/** The cells a code shades, or null for a code that is not one. */
export function hitoriShadedOf(size: number, code: string): boolean[] | null {
  if (!isCodeOf(code, size * size, `${BLANK}${SHADE}`)) return null;
  return [...code].map((character) => character === SHADE);
}

const codeOf = (shaded: readonly boolean[]): string => shaded.map((one) => (one ? SHADE : BLANK)).join("");

export const hitori: PencilEngine = {
  codeLength: (size) => size * size,
  make(size, _level, seed) {
    if (size !== 5 && size !== 7) throw new RangeError(`no Hitori at ${size}`);
    const made = generateHitori(size, seed);
    return { givens: made.numbers.join(""), solution: codeOf(made.solution) };
  },
  reads: (size, givens) => hitoriBoardOf(size, givens) !== null,
  blank: (size) => BLANK.repeat(size * size),
  fits: (size, code) => hitoriShadedOf(size, code) !== null,
  check(size, givens, answer): PuzzleCheck {
    const board = hitoriBoardOf(size, givens);
    if (board === null) return { ok: false, reason: "the givens are not a Hitori board" };
    const shaded = hitoriShadedOf(size, answer);
    if (shaded === null) return { ok: false, reason: "the answer is not a grid of shaded cells" };
    return checkHitori(board, shaded).ok ? { ok: true } : { ok: false, reason: "a number repeats among the cells left, two shaded cells touch, or the cells left do not join up" };
  },
  solve(size, givens) {
    const board = hitoriBoardOf(size, givens);
    if (board === null) return null;
    const found = solveHitori(board, { limit: 2 });
    return found.complete && found.count === 1 && found.solution !== null ? codeOf(found.solution) : null;
  },
  wrong: (_size, code, solution) => charWrong(code, solution),
  missing: (_size, code, solution) => charMissing(code, solution),
  fix: (_size, code, solution) => charFix(code, solution),
  work: (size) => size * size,
};
