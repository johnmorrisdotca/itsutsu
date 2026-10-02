import type { CellArrow, CellMark } from "./GomojiGrid";

/**
 * The guess a replay step has just put on a word's board, or taken off it: the row,
 * which way the step went (`in` on a step forward, `out` on a step back), and for
 * `out` the row as it was, because the board no longer holds it (`wordReveal.ts`).
 */
export type WordReveal = {
  row: number;
  dir: "in" | "out";
  gone?: { guess: string; marks: readonly CellMark[]; arrows: readonly CellArrow[] };
};

/**
 * One word's part of a Gomoji board that holds several side by side (a
 * Yotsugo's quarters, `WordBoards`): the rows it shows, their marks and
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
  /** A replay step's row coming or going (`WordReveal`); left out where nothing is animating. */
  reveal?: WordReveal | null;
};

/** One word's board among several (`WordBoards`): the rows it shows, their marks and arrows, and whether its word is found. */
export type WordBoard = {
  rows: readonly string[];
  marks: readonly (readonly CellMark[])[];
  arrows?: readonly (readonly CellArrow[])[];
  found: boolean;
  reveal?: WordReveal | null;
};
