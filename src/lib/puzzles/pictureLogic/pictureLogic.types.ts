/**
 * The vocabulary of Picture logic 絵解き: a square of cells, a clue beside
 * every row and above every column, and a picture the clues describe.
 */

/** One line's clue: the lengths of its runs of shaded cells, in order; empty for a line with none. */
export type LineClue = readonly number[];

/** A puzzle's clues: one a row, top to bottom, and one a column, left to right. */
export type PictureClues = { size: number; rows: readonly LineClue[]; cols: readonly LineClue[] };

/**
 * What a cell is known to be, while solving or on the player's grid: not yet
 * known, shaded, or empty. The player's "empty" is the ✕ they mark.
 */
export type CellState = 0 | 1 | 2;

/** The rule a solve is allowed, from the least a person needs to the most: see `solve.ts`. */
export type LineRule = "ends" | "whole";

/** The three ways of drawing a picture from a seed (`picture.ts`). */
export type PictureStyle = "figure" | "hills" | "cloud";
