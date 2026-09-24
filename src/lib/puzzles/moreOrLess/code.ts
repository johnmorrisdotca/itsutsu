import { decodeCells, encodeCells } from "../puzzleCode";

/**
 * More or Less as a string: the cells, then the marks between them.
 *
 * The cells come first, row-major, as every number grid is written (`.` for
 * empty). Then one character per edge between two cells: the horizontal
 * edges row by row (`size − 1` per row), then the vertical edges row by row
 * (`size` per row, `size − 1` rows). `<` and `>` say which side is bigger,
 * the way the mark is drawn between the cells; `^` and `v` do the same for
 * an edge between a cell and the one below it (`v` points down at the
 * smaller number). `.` is no mark. A 7×7 is 49 + 42 + 42 characters.
 */

/** A mark: the cell at `less` holds a smaller number than the cell at `more`. Both are indexes, always adjacent. */
export type Mark = { less: number; more: number };

export const NO_MARK = ".";

export function encodeMoreOrLess(cells: readonly number[], marks: readonly Mark[], size: number): string {
  const horizontal = new Array<string>(size * (size - 1)).fill(NO_MARK);
  const vertical = new Array<string>((size - 1) * size).fill(NO_MARK);
  for (const mark of marks) {
    const low = Math.min(mark.less, mark.more);
    const high = Math.max(mark.less, mark.more);
    if (high === low + 1) {
      const row = Math.floor(low / size);
      const col = low % size;
      horizontal[row * (size - 1) + col] = mark.less === low ? "<" : ">";
    } else {
      vertical[low] = mark.less === low ? "^" : "v";
    }
  }
  return `${encodeCells(cells)}${horizontal.join("")}${vertical.join("")}`;
}

export function decodeMoreOrLess(code: string, size: number): { cells: number[]; marks: Mark[] } | null {
  const cellsLength = size * size;
  const horizontalLength = size * (size - 1);
  const verticalLength = (size - 1) * size;
  if (typeof code !== "string" || code.length !== cellsLength + horizontalLength + verticalLength) return null;
  const cells = decodeCells(code.slice(0, cellsLength), size);
  if (cells === null) return null;
  const marks: Mark[] = [];
  const horizontal = code.slice(cellsLength, cellsLength + horizontalLength);
  for (let i = 0; i < horizontal.length; i += 1) {
    const row = Math.floor(i / (size - 1));
    const col = i % (size - 1);
    const left = row * size + col;
    if (horizontal[i] === "<") marks.push({ less: left, more: left + 1 });
    else if (horizontal[i] === ">") marks.push({ less: left + 1, more: left });
    else if (horizontal[i] !== NO_MARK) return null;
  }
  const vertical = code.slice(cellsLength + horizontalLength);
  for (let i = 0; i < vertical.length; i += 1) {
    if (vertical[i] === "^") marks.push({ less: i, more: i + size });
    else if (vertical[i] === "v") marks.push({ less: i + size, more: i });
    else if (vertical[i] !== NO_MARK) return null;
  }
  return { cells, marks };
}
