/**
 * Hidden Stones as strings: the regions, and the answer.
 *
 * The GIVENS are the regions: one letter per cell, row-major, `a` for the
 * first region and so on — a 7×7 is forty-nine letters from `a` to `g`. The
 * ANSWER is one letter per row, the column of that row's stone, `a` for the
 * first column. One stone per row is the shape of every answer, so a row's
 * stone is a column and nothing more needs saying.
 */

const FIRST = "a".charCodeAt(0);

/** The letter for a region or a column index. */
export function letterOf(index: number): string {
  return String.fromCharCode(FIRST + index);
}

/** The index a letter names, or -1 for a character that is not one of the first `size`. */
export function indexOf(letter: string, size: number): number {
  const index = letter.charCodeAt(0) - FIRST;
  return letter.length === 1 && index >= 0 && index < size ? index : -1;
}

/** Regions row-major, one letter each, or null for a string that is not that. */
export function decodeRegions(code: string, size: number): number[] | null {
  if (typeof code !== "string" || code.length !== size * size) return null;
  const regions: number[] = [];
  for (const letter of code) {
    const region = indexOf(letter, size);
    if (region === -1) return null;
    regions.push(region);
  }
  return regions;
}

export function encodeRegions(regions: readonly number[]): string {
  return regions.map(letterOf).join("");
}

/** The column of each row's stone, or null for a string that is not `size` column letters. */
export function decodeStones(code: string, size: number): number[] | null {
  if (typeof code !== "string" || code.length !== size) return null;
  const columns: number[] = [];
  for (const letter of code) {
    const column = indexOf(letter, size);
    if (column === -1) return null;
    columns.push(column);
  }
  return columns;
}

export function encodeStones(columns: readonly number[]): string {
  return columns.map(letterOf).join("");
}
