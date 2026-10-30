/**
 * HITOFUDE'S TWO STRINGS: the board as it is dealt, and the line drawn on it.
 *
 * GIVENS are a character a cell, row by row: `.` for a blank cell and a number
 * for a numbered one, written 1 to 9 and then a letter, which is plenty for the
 * most a board holds.
 *
 * WHAT IS DRAWN is a character a cell too, so a kept run, a step log and a
 * replay read it as every other grid: `.` for a cell the line has not reached,
 * and for one it has, the place it comes along the line, the first cell being
 * `0`. A finished line, every cell with a place, is the answer handed in.
 */

export const BLANK = ".";

/** A numbered cell's character: 1 to 9, then a letter. */
const NUMBER_SYMBOLS = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** A place along the line's character, enough for every cell of the biggest board (8×8). */
const PLACE_SYMBOLS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";

/** The numbers on a board, a number a cell (0 for a blank cell), or null for givens that are not a board of this size. */
export function decodeNumbers(givens: string, size: number): number[] | null {
  const cells = size * size;
  if (typeof givens !== "string" || givens.length !== cells) return null;
  const numbers = new Array<number>(cells).fill(0);
  let most = 0;
  let total = 0;
  for (let cell = 0; cell < cells; cell += 1) {
    const char = givens[cell]!;
    if (char === BLANK) continue;
    const number = NUMBER_SYMBOLS.indexOf(char) + 1;
    if (number === 0) return null;
    numbers[cell] = number;
    most = Math.max(most, number);
    total += 1;
  }
  // The numbers run 1 to the highest, each once, and there are at least a first and a last.
  if (total < 2 || most !== total || new Set(numbers.filter((number) => number > 0)).size !== total) return null;
  return numbers;
}

export function encodeNumbers(numbers: readonly number[]): string {
  return numbers.map((number) => (number === 0 ? BLANK : NUMBER_SYMBOLS[number - 1]!)).join("");
}

/** The line as the string a run keeps: each cell's place along it. */
export function encodeLine(line: readonly number[], size: number): string {
  const code = new Array<string>(size * size).fill(BLANK);
  line.forEach((cell, place) => {
    code[cell] = PLACE_SYMBOLS[place]!;
  });
  return code.join("");
}

/** The cells of a line in the order it visits them, or null for a string that is not one unbroken line on a board of this size. */
export function decodeLine(code: string, size: number): number[] | null {
  const cells = size * size;
  if (typeof code !== "string" || code.length !== cells) return null;
  const places = new Array<number>(cells).fill(-1);
  let drawn = 0;
  for (let cell = 0; cell < cells; cell += 1) {
    const char = code[cell]!;
    if (char === BLANK) continue;
    const place = PLACE_SYMBOLS.indexOf(char);
    if (place < 0 || place >= cells || places[place] !== -1) return null;
    places[place] = cell;
    drawn += 1;
  }
  if (drawn === 0) return null;
  const line = places.slice(0, drawn);
  if (line.some((cell) => cell === -1)) return null;
  for (let place = 1; place < drawn; place += 1) if (!adjacent(line[place - 1]!, line[place]!, size)) return null;
  return line;
}

/** Whether two cells share a side. */
export function adjacent(a: number, b: number, size: number): boolean {
  const rows = Math.abs(Math.floor(a / size) - Math.floor(b / size));
  const columns = Math.abs((a % size) - (b % size));
  return rows + columns === 1;
}

/** The cells beside this one, up, left, right and down. */
export function neighbours(cell: number, size: number): number[] {
  const row = Math.floor(cell / size);
  const column = cell % size;
  const around: number[] = [];
  if (row > 0) around.push(cell - size);
  if (column > 0) around.push(cell - 1);
  if (column < size - 1) around.push(cell + 1);
  if (row < size - 1) around.push(cell + size);
  return around;
}

/** Nothing drawn yet: the line is the first number's cell alone. */
export function blankLine(givens: string, size: number): string | null {
  const numbers = decodeNumbers(givens, size);
  if (numbers === null) return null;
  return encodeLine([numbers.indexOf(1)], size);
}
