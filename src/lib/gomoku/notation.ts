import { COLUMN_LETTERS } from "./gomoku.constants";
import type { Point } from "./gomoku.types";

/** Column letter, left to right: A, B, C ... with I skipped as on a go board. */
export function columnLetter(col: number): string {
  return COLUMN_LETTERS[col] ?? String(col + 1);
}

/** Row number counted from the bottom edge, so the bottom row is 1. */
export function rowNumber(size: number, row: number): number {
  return size - row;
}

/** Renju-style name for an intersection, e.g. "H8" for the centre of a 15×15 board. */
export function pointName(size: number, point: Point): string {
  return `${columnLetter(point.col)}${rowNumber(size, point.row)}`;
}
