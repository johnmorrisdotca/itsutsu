import { checkAkari, generateAkari, isAkariBoard, solveAkari, type AkariBoard } from "@johnmorrisdotca/kazu/akari";

import type { PuzzleCheck } from "../puzzles.types";
import { BLANK, BULB, charFix, charMissing, charWrong, isCodeOf } from "./codes";
import type { PencilEngine } from "./pencil.types";

/**
 * AKARI 美術館, light the grid: Kazu's (`@johnmorrisdotca/kazu/akari`).
 *
 * The givens are a character a cell: `.` for a white square, `#` for a black
 * one with no number, `0` to `4` for a black one that must touch that many
 * bulbs. What a reader writes is a character a cell too: `.` for nothing, `o`
 * for a bulb, which only a white square can hold.
 */
export { BULB };
const BLACK = "#";

/** The board the givens are, or null for givens that are not one. */
export function akariBoardOf(size: number, givens: string): AkariBoard | null {
  if (givens.length !== size * size) return null;
  const cells: (number | null | false)[] = [];
  for (const character of givens) {
    if (character === BLANK) cells.push(null);
    else if (character === BLACK) cells.push(false);
    else if (character >= "0" && character <= "4") cells.push(Number(character));
    else return null;
  }
  const board = { width: size, height: size, cells };
  return isAkariBoard(board) ? board : null;
}

/** The squares a code lights: its bulbs, or null for a code that is not one. */
export function akariBulbsOf(size: number, code: string): number[] | null {
  if (!isCodeOf(code, size * size, `${BLANK}${BULB}`)) return null;
  return [...code].flatMap((character, at) => (character === BULB ? [at] : []));
}

const codeOf = (size: number, bulbs: readonly number[]): string => Array.from({ length: size * size }, (_, at) => (bulbs.includes(at) ? BULB : BLANK)).join("");

export const akari: PencilEngine = {
  codeLength: (size) => size * size,
  make(size, level, seed) {
    const made = generateAkari(size, size, seed, level);
    const givens = made.cells.map((cell) => (cell === null ? BLANK : cell === false ? BLACK : String(cell))).join("");
    return { givens, solution: codeOf(size, made.solution) };
  },
  reads: (size, givens) => akariBoardOf(size, givens) !== null,
  blank: (size) => BLANK.repeat(size * size),
  fits: (size, code) => akariBulbsOf(size, code) !== null,
  check(size, givens, answer): PuzzleCheck {
    const board = akariBoardOf(size, givens);
    if (board === null) return { ok: false, reason: "the givens are not an Akari board" };
    const bulbs = akariBulbsOf(size, answer);
    if (bulbs === null) return { ok: false, reason: "the answer is not a grid of bulbs" };
    if (bulbs.some((at) => board.cells[at] !== null)) return { ok: false, reason: "a bulb is on a black square" };
    const verdict = checkAkari(board, bulbs);
    if (verdict.ok) return { ok: true };
    if (verdict.conflicts.length > 0) return { ok: false, reason: "two bulbs light each other" };
    if (verdict.numbered.length > 0) return { ok: false, reason: "a numbered square does not touch its number of bulbs" };
    return { ok: false, reason: "some white squares are dark" };
  },
  solve(size, givens) {
    const board = akariBoardOf(size, givens);
    if (board === null) return null;
    const found = solveAkari(board, { limit: 2 });
    return found.complete && found.count === 1 && found.solution !== null ? codeOf(size, found.solution) : null;
  },
  wrong: (_size, code, solution) => charWrong(code, solution),
  missing: (_size, code, solution) => charMissing(code, solution),
  fix: (_size, code, solution) => charFix(code, solution),
  work: (_size, givens) => [...givens].filter((character) => character === BLANK || (character >= "0" && character <= "4")).length,
};
