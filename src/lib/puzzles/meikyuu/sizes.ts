/**
 * MEIKYUU'S SIZES, AS THE SITE KEEPS THEM. Every puzzle's `size` is one whole
 * number: a kept run, a solve, a race and an address all carry it. A maze has
 * no side (it may be a heart, a ring or a pyramid of triangles), so its size is
 * the package's own word for how big it is (`sizeOf` in
 * `@johnmorrisdotca/meikyuu/levels`: under 150 cells is small, under 800 medium,
 * under 4,000 large, the rest huge), written 1 to 4. Four sizes, so the set-up
 * has its four tiles and no shelf to turn.
 *
 * The package's words are found here and nowhere else, so a size is never
 * spelled twice. `levels.test.ts` holds the thresholds to the package's.
 */
export const MEIKYUU_SIZE_WORDS = ["small", "medium", "large", "huge"] as const;

export type MeikyuuSizeWord = (typeof MEIKYUU_SIZE_WORDS)[number];

/** The four sizes of the SQUARE-ish levels, as the site keeps them: 1 is small, 2 medium, 3 large and 4 huge. */
export const MEIKYUU_SIZES: readonly number[] = [1, 2, 3, 4];

/**
 * THE TALL LEVELS' SIZES. The package's second list (`@johnmorrisdotca/meikyuu/levels/tall`) is
 * portrait mazes, two columns to three rows, in six sizes of 256: 6×9, 8×12, 10×15, 12×18, 16×24
 * and 20×30 (columns by rows of a square one). Like Suido's long boards, a width and a height are
 * kept in the one number a puzzle's size is, as the width and then the height in two digits each:
 * 6×9 is 609, 20×30 is 2030. No small, medium, large or huge is a hundred or more, so the two kinds
 * of size cannot be mistaken, and an address says "6x9". `levels.test.ts` holds this list to the
 * package's.
 */
export const MEIKYUU_TALL_SHAPES: readonly (readonly [number, number])[] = [
  [6, 9],
  [8, 12],
  [10, 15],
  [12, 18],
  [16, 24],
  [20, 30],
];

/** The number a tall size is kept as: its width and then its height, two digits each. */
export function meikyuuTallSize(width: number, height: number): number {
  return width * 100 + height;
}

/** The tall sizes as the site keeps them, smallest first. */
export const MEIKYUU_TALL_SIZES: readonly number[] = MEIKYUU_TALL_SHAPES.map(([width, height]) => meikyuuTallSize(width, height));

/** Every size a Meikyuu level comes in: the four, then the six tall ones. */
export const MEIKYUU_EVERY_SIZE: readonly number[] = [...MEIKYUU_SIZES, ...MEIKYUU_TALL_SIZES];

/** The shape of the box a tall maze is played in, width over height as it is made: two columns to three rows. */
export const MEIKYUU_TALL_RATIO = 2 / 3;

/** Whether a size is one of the tall ones. */
export function isMeikyuuTall(size: number): boolean {
  return MEIKYUU_TALL_SIZES.includes(size);
}

/** A tall size's columns and rows, or null for any other number. */
export function meikyuuTallShape(size: number): { width: number; height: number } | null {
  const at = MEIKYUU_TALL_SIZES.indexOf(size);
  return at < 0 ? null : { width: MEIKYUU_TALL_SHAPES[at]![0], height: MEIKYUU_TALL_SHAPES[at]![1] };
}

/** Whether a number is one of the sizes the levels come in, square or tall. */
export function isMeikyuuSize(size: number): boolean {
  return MEIKYUU_EVERY_SIZE.includes(size);
}

/** The size as an address writes it: 2 for the second of the four, "6x9" for a tall one, so a link says what it is. */
export function meikyuuSizeInAddress(size: number): string {
  const tall = meikyuuTallShape(size);
  return tall === null ? String(size) : `${tall.width}x${tall.height}`;
}

/** A size read from an address: `2`, or `6x9`; null for anything that is neither a number nor a tall shape. */
export function meikyuuSizeFromAddress(text: string): number | null {
  const shape = /^(\d{1,2})x(\d{1,2})$/.exec(text);
  if (shape !== null) return meikyuuTallSize(Number(shape[1]), Number(shape[2]));
  return /^\d+$/.test(text) ? Number(text) : null;
}

/** The package's word for one of the four sizes ("small"), or null for a number that is none (a tall size has no such word). */
export function meikyuuSizeWord(size: number): MeikyuuSizeWord | null {
  return Number.isInteger(size) && size >= 1 && size <= MEIKYUU_SIZE_WORDS.length ? MEIKYUU_SIZE_WORDS[size - 1]! : null;
}

/** The size, 1 to 4, that the package's word stands for. */
export function meikyuuSizeOfWord(word: MeikyuuSizeWord): number {
  return MEIKYUU_SIZE_WORDS.indexOf(word) + 1;
}

/** What a page says of a size: "Small", and "Tall 6×9" for a tall one. */
export function meikyuuSizeLabel(size: number): string {
  const tall = meikyuuTallShape(size);
  if (tall !== null) return `Tall ${tall.width}×${tall.height}`;
  const word = meikyuuSizeWord(size);
  return word === null ? String(size) : `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
}

/** A size said inside a sentence, with its noun: "small size", "tall 6×9 size". */
export function meikyuuSizeInWords(size: number): string {
  return `${meikyuuSizeLabel(size).toLowerCase()} size`;
}
