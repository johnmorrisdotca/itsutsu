/**
 * WHERE A WORD CAN CROSS A CROSSWORD WITHOUT SPOILING IT: the one rule the
 * generator lays its bags by (`generate.ts`) and the computer player lays its
 * own table by (`computerPlay.ts`), written once.
 *
 * A word laid across or down through a tile already down, with nothing at
 * either end of it and no new tile touching anything at its sides, makes one
 * new run — the word itself — and leaves every other run as it was. So on a
 * grid that was sound, the grid after it is sound too: that is what lets the
 * generator promise every bag can be finished, and what keeps the computer
 * from ever leaving a misspelt table.
 *
 * With DIAGONALS (`diagonalWord`), a new tile may also make or lengthen a
 * diagonal run of three or more (`DIAGONAL_RUN_LEAST`), which is then read
 * too; a word is laid only where each such run is a word, so a sound grid
 * stays sound under that rule as well.
 *
 * Pure, and blind to what the squares are kept in: the caller answers what
 * letter stands at a square (`""` for none) and whether a square may be used
 * at all, so the generator's fixed laying square and the computer's table
 * with no edges ask the same question.
 */
import { DIAGONAL_RUN_LEAST } from "./grid";

export type Square = { row: number; col: number };

/** A word's place: its first square, and the squares it lays a new tile on, in the word's order. */
export type CrossingFit = { first: Square; fresh: Square[] };

/**
 * Where `word` stands with its letter `at` on the tile at `anchor`, running
 * across or down, or null where it cannot: a square outside what may be used,
 * a tile at either end, a different letter in its way, a new tile with a
 * neighbour at its side, or no new tile at all — and, given `diagonalWord`
 * (a game with Diagonals), a new tile standing in a diagonal run of three or
 * more that `diagonalWord` does not take (`diagonalsRead`).
 */
export function crossingFit(
  letterAt: (row: number, col: number) => string,
  inside: (row: number, col: number) => boolean,
  word: string,
  anchor: Square,
  at: number,
  across: boolean,
  diagonalWord: ((run: string) => boolean) | null = null,
): CrossingFit | null {
  const dr = across ? 0 : 1;
  const dc = across ? 1 : 0;
  const row = anchor.row - at * dr;
  const col = anchor.col - at * dc;
  const length = word.length;
  if (!inside(row, col) || !inside(row + (length - 1) * dr, col + (length - 1) * dc)) return null;
  const taken = (r: number, c: number) => inside(r, c) && letterAt(r, c) !== "";
  if (taken(row - dr, col - dc) || taken(row + length * dr, col + length * dc)) return null;
  const fresh: Square[] = [];
  for (let k = 0; k < length; k += 1) {
    const r = row + k * dr;
    const c = col + k * dc;
    const there = letterAt(r, c);
    if (there !== "") {
      if (there !== word[k]) return null;
      continue;
    }
    // Its sides: above and below a word across, left and right of one down.
    if (taken(r - dc, c - dr) || taken(r + dc, c + dr)) return null;
    fresh.push({ row: r, col: c });
  }
  if (fresh.length === 0) return null;
  if (diagonalWord !== null && !diagonalsRead(letterAt, inside, word, { first: { row, col }, fresh }, diagonalWord)) return null;
  return { first: { row, col }, fresh };
}

/**
 * Whether every diagonal run a laying's new tiles would stand in is taken by
 * `isWord`: each walked from its top end down, with the word's own letters on
 * its new squares. Only a run through a new tile can change, and two new
 * tiles of one word never share a diagonal (they share a row or a column), so
 * each is read on its own. A run of two, a corner touch, is never read.
 */
export function diagonalsRead(
  letterAt: (row: number, col: number) => string,
  inside: (row: number, col: number) => boolean,
  word: string,
  fit: CrossingFit,
  isWord: (run: string) => boolean,
): boolean {
  const freshAt = new Map(fit.fresh.map((square) => [`${square.row},${square.col}`, word[(square.row - fit.first.row) + (square.col - fit.first.col)]!]));
  const at = (row: number, col: number): string => (inside(row, col) ? letterAt(row, col) || (freshAt.get(`${row},${col}`) ?? "") : "");
  for (const { row, col } of fit.fresh) {
    for (const lean of [1, -1]) {
      let top = 0;
      while (at(row - top - 1, col - (top + 1) * lean) !== "") top += 1;
      let run = "";
      for (let step = -top; at(row + step, col + step * lean) !== ""; step += 1) run += at(row + step, col + step * lean);
      if (run.length >= DIAGONAL_RUN_LEAST && !isWord(run)) return false;
    }
  }
  return true;
}
