/**
 * Dots and Boxes, as its rules module (`dotsAndBoxes.ts`) speaks of it.
 *
 * THE LINES ARE NUMBERED, and the number is all a move is. On a board of
 * `size` boxes a side there are `size + 1` dots a side, and
 *
 *   - the lines ACROSS come first: row `r` of dots (0 to `size`), from dot `c`
 *     to dot `c + 1` (0 to `size - 1`), is line `r * size + c`;
 *   - the lines DOWN follow: from dot row `r` (0 to `size - 1`) to `r + 1`, in
 *     dot column `c` (0 to `size`), is line `across + r * (size + 1) + c`,
 *     where `across = (size + 1) * size`.
 *
 * Box `r, c` (each 0 to `size - 1`) is box `r * size + c`, and its four sides
 * are the line across above it and below it, and the line down on its left
 * and on its right.
 */

/** Who drew or holds something: a player's place round the table, 0 first. */
export type DotsSeat = number;

export type DotsStatus = "playing" | "finished";

/**
 * A game, as the moves make it. Only `size`, `players`, `first` and `lines`
 * are ever kept (`encodeDots`); everything else is read again from them, so a
 * kept game can never hold a board its moves do not make.
 */
export type DotsGame = {
  /** Boxes along a side. */
  size: number;
  /** The names given at the table, in seat order: "" for one left blank. */
  players: readonly string[];
  /** The seat that drew first. */
  first: DotsSeat;
  /** Every line drawn, in the order it was drawn: the game's whole record. */
  lines: readonly number[];
  /** Per line, the seat that drew it, or null while it is undrawn. */
  drawnBy: readonly (DotsSeat | null)[];
  /** Per box, the seat that closed it, or null while it is open. */
  owners: readonly (DotsSeat | null)[];
  /** Per seat, the boxes they hold. */
  scores: readonly number[];
  /** The seat whose turn it is; on a finished game, whoever drew the last line. */
  toPlay: DotsSeat;
  /** The boxes the last line closed: none, one or two. The turn line says so, and the mover draws again. */
  lastClosed: readonly number[];
  status: DotsStatus;
  /** On a finished game, every seat level on the most boxes: one is a win, more is a win shared. Empty while playing. */
  winners: readonly DotsSeat[];
};

/** Where a line runs, dot to dot, for a board to draw it: rows and columns of dots, 0 at the top left. */
export type DotsLineEnds = { from: { row: number; col: number }; to: { row: number; col: number }; across: boolean };
