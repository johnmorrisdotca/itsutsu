/**
 * TSUNAGI, WRITTEN DOWN: a level's layout and a finished grid, as the
 * strings every puzzle travels as (`puzzleCode.ts` is the spelling of the
 * number grids; this is the spelling of this one).
 *
 * A LAYOUT is row-major, one character a cell: `.` for an empty cell, a
 * capital letter for a stone — each letter exactly twice, the two ends of one
 * line — and `#` for a blocked cell no line may enter. The letters are named
 * in the order their first stone is met reading left to right, top to bottom,
 * so one layout has one spelling. No level ships a `#` yet; the format holds
 * one so a board with an obstacle is a new level, not a new format.
 *
 * AN ANSWER is the same grid with every open cell carrying the letter of the
 * line through it, and `#` where the layout has one.
 *
 * Imports carry their `.ts` so the level script (`scripts/tsunagi-levels.ts`)
 * can run this under plain node.
 */

export const LINK_EMPTY = ".";
export const LINK_BLOCKED = "#";

/** The letters a pair may be named by, in order: sixteen, more than any level uses. */
export const PAIR_LETTERS = "ABCDEFGHIJKLMNOP";

/** A cell in a decoded layout: an empty cell, a blocked one, or a stone of pair `n` (0 for A). */
export const CELL_EMPTY = -1;
export const CELL_BLOCKED = -2;

export type LinkLayout = {
  size: number;
  /** One per cell: `CELL_EMPTY`, `CELL_BLOCKED`, or the pair a stone belongs to. */
  cells: number[];
  /** Each pair's two stones, as cell indexes, the first met in reading order first. */
  ends: [number, number][];
};

/**
 * A layout read from its code, or null for a string that is not one: the
 * wrong length, a stray character, a letter used other than twice, or letters
 * not named in reading order. Null rather than a best guess — see AGENTS.md
 * "Nothing Answers What It Cannot Answer".
 */
export function decodeLayout(code: string, size: number): LinkLayout | null {
  if (typeof code !== "string" || code.length !== size * size) return null;
  const cells: number[] = [];
  const seen: number[][] = [];
  let next = 0;
  for (let at = 0; at < code.length; at += 1) {
    const char = code[at]!;
    if (char === LINK_EMPTY) cells.push(CELL_EMPTY);
    else if (char === LINK_BLOCKED) cells.push(CELL_BLOCKED);
    else {
      const pair = PAIR_LETTERS.indexOf(char);
      if (pair === -1) return null;
      if (seen[pair] === undefined) {
        // A new letter must be the next one: A, then B, then C, in reading order.
        if (pair !== next) return null;
        next += 1;
        seen[pair] = [];
      }
      seen[pair]!.push(at);
      cells.push(pair);
    }
  }
  if (seen.length === 0 || seen.some((stones) => stones.length !== 2)) return null;
  return { size, cells, ends: seen.map((stones) => [stones[0]!, stones[1]!]) };
}

/** A layout's code, from its cells: the inverse of `decodeLayout`. */
export function encodeLayout(cells: readonly number[]): string {
  return cells.map((cell) => (cell === CELL_EMPTY ? LINK_EMPTY : cell === CELL_BLOCKED ? LINK_BLOCKED : PAIR_LETTERS[cell]!)).join("");
}

/** A finished grid's code: the letter of the line through each cell, `#` where blocked. */
export function encodeAnswer(owners: readonly number[]): string {
  return owners.map((owner) => (owner === CELL_BLOCKED ? LINK_BLOCKED : owner < 0 ? LINK_EMPTY : PAIR_LETTERS[owner]!)).join("");
}

/** The four neighbours of a cell on a square grid, as indexes; fewer at an edge. */
export function neighboursOf(size: number, at: number): number[] {
  const row = Math.floor(at / size);
  const col = at % size;
  const out: number[] = [];
  if (row > 0) out.push(at - size);
  if (col < size - 1) out.push(at + 1);
  if (row < size - 1) out.push(at + size);
  if (col > 0) out.push(at - 1);
  return out;
}

/** Every cell's neighbours, worked out once for a size. */
export function neighbourTable(size: number): number[][] {
  return Array.from({ length: size * size }, (_, at) => neighboursOf(size, at));
}
