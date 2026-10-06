/**
 * SUIDO'S SIZES, AS THE SITE KEEPS THEM. Every puzzle's `size` is one whole
 * number: a kept run, a solve, a race and an address all carry it, and the
 * database has one column for it. A square board's number is its side, as
 * every other puzzle's is. The package also makes pipe-shaped boards, three
 * of them long and narrow (5×7, 6×10 and 8×14) and one huge (20×50), and a width and a height do not
 * fit one number, so those are written as the width and then the height in two
 * digits each: 5×7 is 507, 6×10 is 610, 8×14 is 814, 20×50 is 2050. No square has a side of a
 * hundred, so the two cannot be mistaken.
 *
 * The package's own name for a size is its code's, "5x7" (`SuidoSize`); a
 * square is "5x5" there and 5 here, and these two functions are the only place
 * the two are joined.
 */

/** The squares the levels come in, by side: 5 to 14, and the huge 20 and 28 (`SUIDO_HUGE_SIZES`). */
export const SUIDO_SQUARE_SIDES: readonly number[] = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 20, 28];

/** The long boards the levels come in, as `[width, height]`: three pipes, and the huge 20×50. */
export const SUIDO_PIPE_SHAPES: readonly (readonly [number, number])[] = [
  [5, 7],
  [6, 10],
  [8, 14],
  [20, 50],
];

/**
 * THE HUGE SIZES: 20×20, 28×28 and the long 20×50, each with sixty-four levels (the others have 256). Their level data is the
 * package's biggest, and a function that carries it is a function over its ceiling (`functions:size`), so it is read in the browser
 * only and a server knows a level by a hash of its board (`levelBoards.data.ts`).
 */
export const SUIDO_HUGE_SIZES: readonly number[] = [20, 28, 2050];

/** Whether a size is one of the huge ones. */
export function isSuidoHugeSize(size: number): boolean {
  return SUIDO_HUGE_SIZES.includes(size);
}

/** The number a pipe-shaped board's size is kept as: its width and then its height, two digits each. */
export function pipeSize(width: number, height: number): number {
  return width * 100 + height;
}

/** Every size the levels come in, as the site keeps them: the squares by side, then the long boards. Sixteen, so four shelves of four tiles: 5 to 8, 9 to 12, 13 to 28, and the long boards. */
export const SUIDO_LEVEL_SIZES: readonly number[] = [...SUIDO_SQUARE_SIDES, ...SUIDO_PIPE_SHAPES.map(([width, height]) => pipeSize(width, height))];

/**
 * THE LONGEST A SUIDO CODE IS, for the routes that carry one (`mostCells`): a board of the biggest size, the 20×50's thousand cells with
 * the lists after them. A level's code is its cells and nothing else the huge sizes teach (the longest is 1,008), and a board made from a seed is a
 * network with at most a few dozen squares that turn as one (`;b…;k…`, a few hundred characters at the 20×50), so 1,300 is room; the 14×14's
 * with its locked pieces and walls was 356, and `levels.test.ts` holds every code to this.
 */
export const SUIDO_CODE_MOST = 1300;

/** A size's width and height: a square is as wide as it is tall, a pipe-shaped board is as its number says. Null for a number that is neither. */
export function suidoShapeOf(size: number): { width: number; height: number } | null {
  if (!Number.isInteger(size)) return null;
  if (size >= 100) {
    const width = Math.floor(size / 100);
    const height = size % 100;
    return width >= 2 && height >= 2 ? { width, height } : null;
  }
  return size >= 2 ? { width: size, height: size } : null;
}

/** The package's name for a size, "7x7" for a square 7 and "5x7" for 507; null for a number that is no size. */
export function suidoSizeKey(size: number): string | null {
  const shape = suidoShapeOf(size);
  return shape === null ? null : `${shape.width}x${shape.height}`;
}

/** The number the site keeps for the package's name of a size, "5x7" being 507; null for a name that is no size. */
export function suidoSizeOfKey(key: string): number | null {
  const match = /^(\d{1,2})x(\d{1,2})$/.exec(key);
  if (match === null) return null;
  const [width, height] = [Number(match[1]), Number(match[2])];
  return width === height ? width : pipeSize(width, height);
}

/** Whether a size is one the levels come in. */
export function isSuidoLevelSize(size: number): boolean {
  return SUIDO_LEVEL_SIZES.includes(size);
}

/** What a page says of a size: "7×7", and "5×7" for a long board. */
export function suidoSizeWord(size: number): string {
  const shape = suidoShapeOf(size);
  return shape === null ? `${size}×${size}` : `${shape.width}×${shape.height}`;
}

/** The size as an address writes it: 7 for a square, "5x7" for a long board, so a link says what it is. */
export function suidoSizeInAddress(size: number): string {
  return size >= 100 ? (suidoSizeKey(size) ?? String(size)) : String(size);
}

/** A size read from an address: `7`, or `5x7`; null for anything else. */
export function suidoSizeFromAddress(text: string): number | null {
  if (/^\d+$/.test(text)) return Number(text);
  return suidoSizeOfKey(text);
}
