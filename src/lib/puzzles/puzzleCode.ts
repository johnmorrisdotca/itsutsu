/**
 * A puzzle as a string: for an address, a POST body, and one day a column.
 *
 * Row-major, one character per cell: a digit for a value, `.` for an empty
 * cell. Number Place and More or Less write their cells this way and so
 * does an answer to either; Hidden Stones writes its regions as letters and
 * its answer as the column of each row's stone (see `hiddenStones/`).
 * Nothing here knows a kind: it is the spelling, and `puzzleCheck.ts` is the
 * meaning.
 */

export const EMPTY_CELL = ".";

/** `[0, 3, 0, 1]` → `".3.1"`. */
export function encodeCells(cells: readonly number[]): string {
  return cells.map((value) => (value === 0 ? EMPTY_CELL : String(value))).join("");
}

/**
 * `".3.1"` at a side of 2 → `[0, 3, 0, 1]`, or null for a string that is
 * not a grid of that size: wrong length, a value past the side, a stray
 * character. Null rather than a grid with holes, because a grid with holes
 * is a grid — see AGENTS.md "Nothing Answers What It Cannot Answer".
 */
export function decodeCells(code: string, size: number): number[] | null {
  if (typeof code !== "string" || code.length !== size * size) return null;
  const cells: number[] = [];
  for (const character of code) {
    if (character === EMPTY_CELL) {
      cells.push(0);
      continue;
    }
    const value = Number(character);
    if (!Number.isInteger(value) || value < 1 || value > size) return null;
    cells.push(value);
  }
  return cells;
}

/**
 * A short fingerprint of a puzzle's givens, for the XP subject: the same
 * puzzle solved twice pays once. FNV-1a over the string, as eight hex
 * characters — not a credential, so a collision costs a member one award
 * on one grid, which is the cheapest thing that can go wrong.
 */
export function puzzleHash(givens: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < givens.length; i += 1) {
    hash ^= givens.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
