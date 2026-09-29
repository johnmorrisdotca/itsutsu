import type { CellArrow, CellMark } from "./GomojiGrid";

/**
 * One word's part of a Gomoji board that holds several side by side (a
 * Yotsugo's quarters, `YotsugoBoards`): the rows it shows, their marks and
 * arrows, whether it takes the row being typed, and whether its word is found.
 */
export type GridPart = {
  /** The word's place among all the puzzle's words, from 0: which quarter it is. */
  at: number;
  guesses: readonly string[];
  marks: readonly (readonly CellMark[])[];
  arrows?: readonly (readonly CellArrow[])[];
  /** Takes no row being typed: the puzzle is over, or this word is found. */
  done: boolean;
  found: boolean;
};
