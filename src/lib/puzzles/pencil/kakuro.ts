import { checkKakuro, generateKakuro, isKakuroBoard, solveKakuro, type KakuroBoard, type KakuroCell } from "@johnmorrisdotca/kazu/kakuro";

import type { PuzzleCheck } from "../puzzles.types";
import { BLANK, charFix, charMissing, charWrong } from "./codes";
import type { PencilEngine } from "./pencil.types";

/**
 * KAKURO, crossword sums: Kazu's (`@johnmorrisdotca/kazu/kakuro`), which makes
 * boards from 5 by 5 to 12 by 12, the first row and column being the totals.
 *
 * The givens are the board cell by cell: `.` for a white cell, else `#` and
 * then the across sum and the down sum, two digits each (`--` for none), five
 * characters a black cell. What a reader writes is a character a cell: `#` for
 * a black cell, `.` for a white one with nothing in it, else the digit 1 to 9.
 */
/** The sides Kazu makes a board at, counting the row and column of totals: 5 to 12. */
export const KAKURO_LEAST_SIDE = 5;
export const KAKURO_MOST_SIDE = 12;
const isSide = (size: number): boolean => Number.isInteger(size) && size >= KAKURO_LEAST_SIDE && size <= KAKURO_MOST_SIDE;
export const BLACK = "#";
const NONE = "--";

const two = (sum: number | null): string => (sum === null ? NONE : String(sum).padStart(2, "0"));
const sumOf = (text: string): number | null | undefined => (text === NONE ? null : /^\d\d$/.test(text) ? Number(text) : undefined);

/** The cells the givens are, or null for givens that are not a board of this size. */
export function kakuroBoardOf(size: number, givens: string): KakuroBoard | null {
  if (!isSide(size)) return null;
  const cells: KakuroCell[] = [];
  let at = 0;
  while (at < givens.length) {
    if (givens[at] === BLANK) {
      cells.push({ kind: "white" });
      at += 1;
    } else if (givens[at] === BLACK) {
      const across = sumOf(givens.slice(at + 1, at + 3));
      const down = sumOf(givens.slice(at + 3, at + 5));
      if (across === undefined || down === undefined) return null;
      cells.push({ kind: "black", across, down });
      at += 5;
    } else {
      return null;
    }
  }
  const board = { width: size, height: size, cells };
  return cells.length === size * size && isKakuroBoard(board) ? board : null;
}

const givensOf = (board: KakuroBoard): string => board.cells.map((cell) => (cell.kind === "white" ? BLANK : `${BLACK}${two(cell.across)}${two(cell.down)}`)).join("");

/** The digits a code writes (0 for none, and for a black cell), or null for a code that is not a grid for this board. */
export function kakuroValuesOf(board: KakuroBoard, code: string): number[] | null {
  if (code.length !== board.cells.length) return null;
  const values: number[] = [];
  for (let at = 0; at < code.length; at += 1) {
    const character = code[at]!;
    const black = board.cells[at]!.kind === "black";
    if (black) {
      if (character !== BLACK) return null;
      values.push(0);
    } else if (character === BLANK) {
      values.push(0);
    } else if (character >= "1" && character <= "9") {
      values.push(Number(character));
    } else {
      return null;
    }
  }
  return values;
}

/** A code from the digits written on a board. */
export function kakuroCodeOf(board: KakuroBoard, values: readonly number[]): string {
  return board.cells.map((cell, at) => (cell.kind === "black" ? BLACK : values[at] === 0 ? BLANK : String(values[at]))).join("");
}

export const kakuro: PencilEngine = {
  codeLength: (size) => size * size,
  make(size, level, seed) {
    if (!isSide(size)) throw new RangeError(`no Cross Sums at ${size}`);
    const made = generateKakuro(seed, level, size);
    return { givens: givensOf(made), solution: kakuroCodeOf(made, made.solution) };
  },
  reads: (size, givens) => kakuroBoardOf(size, givens) !== null,
  blank(size, givens) {
    const board = kakuroBoardOf(size, givens);
    return board === null ? BLANK.repeat(size * size) : kakuroCodeOf(board, new Array<number>(size * size).fill(0));
  },
  fits: (size, code) => code.length === size * size && /^[#.1-9]+$/.test(code),
  check(size, givens, answer): PuzzleCheck {
    const board = kakuroBoardOf(size, givens);
    if (board === null) return { ok: false, reason: "the givens are not a Kakuro board" };
    const values = kakuroValuesOf(board, answer);
    if (values === null) return { ok: false, reason: "the answer is not a grid of digits" };
    const verdict = checkKakuro(board, values);
    if (verdict.ok && verdict.complete) return { ok: true };
    return { ok: false, reason: verdict.complete ? "a run does not add up to its sum, or repeats a digit" : "some cells are empty" };
  },
  solve(size, givens) {
    const board = kakuroBoardOf(size, givens);
    if (board === null) return null;
    const found = solveKakuro(board, [], { limit: 2 });
    return found.complete && found.count === 1 && found.solution !== null ? kakuroCodeOf(board, found.solution) : null;
  },
  wrong: (_size, code, solution) => charWrong(code, solution),
  missing: (_size, code, solution) => charMissing(code, solution),
  fix: (_size, code, solution) => charFix(code, solution),
  work: (_size, givens) => [...givens.matchAll(/\./g)].length,
};
