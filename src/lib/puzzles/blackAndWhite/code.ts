/**
 * Black and White as a string: one character a cell, row-major.
 *
 * `b` a black stone, `w` a white one, `.` an empty cell. The givens are the
 * stones printed on the grid; the answer is the whole grid, every cell a
 * stone. In the numbers a solver and a check work with, empty is 0, black 1
 * and white 2.
 */

export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

export type Stone = typeof EMPTY | typeof BLACK | typeof WHITE;

const LETTERS: Record<Stone, string> = { 0: ".", 1: "b", 2: "w" };

/** The other colour. */
export function otherStone(stone: typeof BLACK | typeof WHITE): typeof BLACK | typeof WHITE {
  return stone === BLACK ? WHITE : BLACK;
}

export function encodeBlackAndWhite(cells: readonly number[]): string {
  return cells.map((cell) => LETTERS[cell as Stone]).join("");
}

/** The cells a code says, or null for a string that is not a grid of this size: wrong length, or a stray character. */
export function decodeBlackAndWhite(code: string, size: number): Stone[] | null {
  if (typeof code !== "string" || code.length !== size * size) return null;
  const cells: Stone[] = [];
  for (const character of code) {
    if (character === "b") cells.push(BLACK);
    else if (character === "w") cells.push(WHITE);
    else if (character === ".") cells.push(EMPTY);
    else return null;
  }
  return cells;
}

/** Every row, then every column, as the cells along it. */
export function linesOf(size: number): number[][] {
  const rows = Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => r * size + c));
  const cols = Array.from({ length: size }, (_, c) => Array.from({ length: size }, (_, r) => r * size + c));
  return [...rows, ...cols];
}
