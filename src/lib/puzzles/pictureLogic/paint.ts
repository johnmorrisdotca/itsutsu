import { EMPTY_CELL, SHADED_CELL, UNKNOWN_CELL, colOf, lineMeetsClue, rowOf } from "./code";
import type { CellState, PictureClues } from "./pictureLogic.types";

/**
 * What the player's presses do to their grid, and what the board says back:
 * pure, so the solve screen and its tests read one rule.
 */

/** What a tap puts first: a shade, or a ✕ (a cell the player is sure is empty). */
export type Pen = "shade" | "mark";

/**
 * The state a tap moves a cell to. With the shade pen: shaded, then ✕, then
 * clear. With the ✕ pen the first two swap: ✕, then shaded, then clear.
 */
export function nextState(state: CellState, pen: Pen): CellState {
  const first = pen === "shade" ? SHADED_CELL : EMPTY_CELL;
  const second = pen === "shade" ? EMPTY_CELL : SHADED_CELL;
  return state === UNKNOWN_CELL ? first : state === first ? second : UNKNOWN_CELL;
}

/**
 * The cells a drag covers, from the cell pressed to the cell under the finger,
 * along the row or the column it has gone further along: the first cell first.
 */
export function runBetween(size: number, from: number, to: number): number[] {
  const fromRow = Math.floor(from / size);
  const fromCol = from % size;
  const toRow = Math.floor(to / size);
  const toCol = to % size;
  const across = Math.abs(toCol - fromCol) >= Math.abs(toRow - fromRow);
  const steps = across ? toCol - fromCol : toRow - fromRow;
  const way = Math.sign(steps);
  return Array.from({ length: Math.abs(steps) + 1 }, (_, at) => (across ? fromRow * size + fromCol + way * at : (fromRow + way * at) * size + fromCol));
}

/**
 * A press or a drag laid on the grid: the first cell moves one step on
 * (`nextState`), and every other cell of the run that was as the first one
 * was goes the same way — so a drag that starts on a blank square shades the
 * blanks it crosses and leaves the ✕s and shades already there alone.
 */
export function painted(cells: readonly CellState[], run: readonly number[], pen: Pen): CellState[] {
  const next = [...cells];
  if (run.length === 0) return next;
  const was = cells[run[0]!]!;
  const now = nextState(was, pen);
  for (const cell of run) if (cells[cell] === was) next[cell] = now;
  return next;
}

/** How many numbers the longest clue has: the depth of the clue panels, at least one place for a 0. */
export function clueDepth(clues: PictureClues): number {
  return Math.max(1, ...clues.rows.map((clue) => clue.length), ...clues.cols.map((clue) => clue.length));
}

/** Which rows and which columns the player's shading already makes exactly. */
export function metLines(clues: PictureClues, cells: readonly CellState[]): { rows: boolean[]; cols: boolean[] } {
  const { size } = clues;
  return {
    rows: clues.rows.map((clue, row) => lineMeetsClue(rowOf(cells, size, row), clue)),
    cols: clues.cols.map((clue, col) => lineMeetsClue(colOf(cells, size, col), clue)),
  };
}
