import type { CellState, LineClue, PictureClues } from "./pictureLogic.types";

/**
 * Picture logic written down, a character a place.
 *
 * THE ANSWER is the picture, row by row: "#" a shaded cell, "." an empty one.
 *
 * A RUN KEPT HALF WAY is the player's grid the same way, with "x" for a cell
 * they have marked empty: ".", "#" or "x" a cell.
 *
 * THE GIVENS are the clues as the page prints them, in two panels: every row's
 * clue in a slot of `clueSlots(size)` places, its numbers pushed to the right
 * as they are printed beside the row, then every column's in the same way, its
 * numbers pushed to the foot as they are printed above the column. A number is
 * one base-36 character (1–9, then a–k for 10–20), an unused place ".". A
 * line with no shaded cell is all dots, and printed as 0. Half a line, rounded
 * up, is the most runs a line can have, so the slot always fits, and the two
 * panels together are never shorter than the grid (`2 × size × ⌈size/2⌉`).
 */

export const SHADED = "#";
export const EMPTY = ".";
export const MARKED = "x";

export const UNKNOWN_CELL: CellState = 0;
export const SHADED_CELL: CellState = 1;
export const EMPTY_CELL: CellState = 2;

/** The places a line's clue has in the givens: the most runs a line of this size can hold. */
export function clueSlots(size: number): number {
  return Math.ceil(size / 2);
}

/** How long a puzzle's givens are at this size: both panels. */
export function givensLength(size: number): number {
  return 2 * size * clueSlots(size);
}

/** The runs of shaded cells in a line, in order. */
export function runsOf(line: readonly boolean[]): number[] {
  const runs: number[] = [];
  let run = 0;
  for (const shaded of line) {
    if (shaded) run += 1;
    else if (run > 0) {
      runs.push(run);
      run = 0;
    }
  }
  if (run > 0) runs.push(run);
  return runs;
}

/** Every row's and column's clue, read off a picture (true is shaded), row by row. */
export function cluesOf(picture: readonly boolean[], size: number): PictureClues {
  const rows: number[][] = [];
  const cols: number[][] = [];
  for (let at = 0; at < size; at += 1) {
    rows.push(runsOf(Array.from({ length: size }, (_, col) => picture[at * size + col]!)));
    cols.push(runsOf(Array.from({ length: size }, (_, row) => picture[row * size + at]!)));
  }
  return { size, rows, cols };
}

function writeLine(clue: LineClue, slots: number): string {
  return EMPTY.repeat(slots - clue.length) + clue.map((run) => run.toString(36)).join("");
}

export function encodeClues(clues: PictureClues): string {
  const slots = clueSlots(clues.size);
  return [...clues.rows, ...clues.cols].map((clue) => writeLine(clue, slots)).join("");
}

/**
 * The clues a puzzle's givens print, or null when they are not the givens of
 * a puzzle this size: the wrong length, a character that is not a number, a
 * number in the middle of the dots, or runs that could not fit their line.
 */
export function decodeClues(givens: string, size: number): PictureClues | null {
  if (typeof givens !== "string" || !Number.isInteger(size) || size < 1 || givens.length !== givensLength(size)) return null;
  const slots = clueSlots(size);
  const lines: number[][] = [];
  for (let line = 0; line < 2 * size; line += 1) {
    const text = givens.slice(line * slots, (line + 1) * slots);
    const clue: number[] = [];
    let started = false;
    for (const char of text) {
      if (char === EMPTY) {
        if (started) return null;
        continue;
      }
      const run = parseInt(char, 36);
      if (!/^[0-9a-z]$/.test(char) || !Number.isInteger(run) || run < 1 || run > size) return null;
      started = true;
      clue.push(run);
    }
    // The runs and one empty cell between each must fit the line.
    if (clue.reduce((total, run) => total + run, 0) + Math.max(0, clue.length - 1) > size) return null;
    lines.push(clue);
  }
  return { size, rows: lines.slice(0, size), cols: lines.slice(size) };
}

/** A picture, row by row, as its answer is written. */
export function encodePicture(picture: readonly boolean[]): string {
  return picture.map((shaded) => (shaded ? SHADED : EMPTY)).join("");
}

/** The picture an answer draws, or null for anything but a grid of "#" and "." this size. */
export function decodePicture(answer: string, size: number): boolean[] | null {
  if (typeof answer !== "string" || answer.length !== size * size) return null;
  const picture: boolean[] = [];
  for (const char of answer) {
    if (char !== SHADED && char !== EMPTY) return null;
    picture.push(char === SHADED);
  }
  return picture;
}

const STATE_OF: Record<string, CellState> = { [EMPTY]: UNKNOWN_CELL, [SHADED]: SHADED_CELL, [MARKED]: EMPTY_CELL };
const CHAR_OF: Record<CellState, string> = { 0: EMPTY, 1: SHADED, 2: MARKED };

/** The player's grid as it is kept: "." untouched, "#" shaded, "x" marked empty. */
export function encodeCells(cells: readonly CellState[]): string {
  return cells.map((cell) => CHAR_OF[cell]).join("");
}

/** The player's grid a kept run holds, or null for anything that is not one this size. */
export function decodeCells(code: string, size: number): CellState[] | null {
  if (typeof code !== "string" || code.length !== size * size) return null;
  const cells: CellState[] = [];
  for (const char of code) {
    const state = STATE_OF[char];
    if (state === undefined) return null;
    cells.push(state);
  }
  return cells;
}

/** The answer the player's grid hands in: shaded where shaded, and every other cell empty, marked or not. */
export function answerOfCells(cells: readonly CellState[]): string {
  return cells.map((cell) => (cell === SHADED_CELL ? SHADED : EMPTY)).join("");
}

/** Whether the shaded cells of one line of the player's grid make exactly its clue. */
export function lineMeetsClue(cells: readonly CellState[], clue: LineClue): boolean {
  const runs = runsOf(cells.map((cell) => cell === SHADED_CELL));
  return runs.length === clue.length && runs.every((run, at) => run === clue[at]);
}

/** One row of a grid kept row by row. */
export function rowOf<T>(grid: readonly T[], size: number, row: number): T[] {
  return grid.slice(row * size, (row + 1) * size);
}

/** One column of a grid kept row by row. */
export function colOf<T>(grid: readonly T[], size: number, col: number): T[] {
  return Array.from({ length: size }, (_, row) => grid[row * size + col]!);
}
