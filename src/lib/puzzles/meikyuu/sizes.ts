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

/**
 * COLOSSAL: the two lists of 128 that go beyond the four sizes (`@johnmorrisdotca/meikyuu/levels/colossal`, package 2.1), about ten thousand cells.
 * The square list is size 5, the next place after huge; the tall one is kept as the tall sizes are, its width and then its height in two digits
 * each, 64×96 being 6496. Neither is one of the four the set-up offers as tiles: the set-up has a shape of its own for them (`MeikyuuSetUp`), so no
 * shape has more than four boards, and nothing that is there already moves.
 */
export const MEIKYUU_COLOSSAL_SIZE = 5;
export const MEIKYUU_COLOSSAL_TALL_SHAPE: readonly [number, number] = [64, 96];
export const MEIKYUU_COLOSSAL_TALL_SIZE = MEIKYUU_COLOSSAL_TALL_SHAPE[0] * 100 + MEIKYUU_COLOSSAL_TALL_SHAPE[1];
/** The two colossal sizes, the square one first. */
export const MEIKYUU_COLOSSAL_SIZES: readonly number[] = [MEIKYUU_COLOSSAL_SIZE, MEIKYUU_COLOSSAL_TALL_SIZE];

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

/**
 * THE SOLIDS: mazes over the whole surface of a cube, a globe, an octahedron or an icosahedron (`@johnmorrisdotca/meikyuu/3d`, package 2.2): a fourth shape of
 * the set-up, with a tile for each solid. A solid at a size is one list of 64 levels (small, medium or large: about 90, 300 and 600 cells), so a size
 * here is a solid and a step together, kept as one whole number like the tall sizes are: 7000, then ten for the solid and its step from 1: 7001 is the
 * small cube, 7003 the large cube, 7011 the small globe, 7033 the large icosahedron. No other size is seven thousand or more, so the kinds of size cannot be
 * mistaken, and an address says `cube-medium`. The package also makes a tetrahedron; it is not offered, because a shape has at most four boards.
 */
export const MEIKYUU_SOLID_KINDS = ["cube", "sphere", "octahedron", "icosahedron"] as const;
export type MeikyuuSolidKind = (typeof MEIKYUU_SOLID_KINDS)[number];

/** The three steps a solid comes in, which are the package's words (`SOLID_SIZE_NAMES`). */
export const MEIKYUU_SOLID_STEPS = ["small", "medium", "large"] as const;
export type MeikyuuSolidStep = (typeof MEIKYUU_SOLID_STEPS)[number];

/** Where the solids' sizes begin. */
export const MEIKYUU_SOLID_BASE = 7000;

/** The size a solid at a step is kept as. */
export function meikyuuSolidSize(kind: MeikyuuSolidKind, step: MeikyuuSolidStep): number {
  return MEIKYUU_SOLID_BASE + MEIKYUU_SOLID_KINDS.indexOf(kind) * 10 + MEIKYUU_SOLID_STEPS.indexOf(step) + 1;
}

/** Every solid's every size, a solid's three together, the cube's first. */
export const MEIKYUU_SOLID_SIZES: readonly number[] = MEIKYUU_SOLID_KINDS.flatMap((kind) => MEIKYUU_SOLID_STEPS.map((step) => meikyuuSolidSize(kind, step)));

/** The solid and the step a size is, or null for a size that is not one of the solids'. */
export function meikyuuSolidOf(size: number): { kind: MeikyuuSolidKind; step: MeikyuuSolidStep } | null {
  if (!MEIKYUU_SOLID_SIZES.includes(size)) return null;
  const offset = size - MEIKYUU_SOLID_BASE;
  return { kind: MEIKYUU_SOLID_KINDS[Math.floor(offset / 10)]!, step: MEIKYUU_SOLID_STEPS[(offset % 10) - 1]! };
}

/** Whether a size is one of the solids'. */
export function isMeikyuuSolid(size: number): boolean {
  return meikyuuSolidOf(size) !== null;
}

const SOLID_TILES: Readonly<Record<MeikyuuSolidStep, readonly number[]>> = {
  small: MEIKYUU_SOLID_KINDS.map((kind) => meikyuuSolidSize(kind, "small")),
  medium: MEIKYUU_SOLID_KINDS.map((kind) => meikyuuSolidSize(kind, "medium")),
  large: MEIKYUU_SOLID_KINDS.map((kind) => meikyuuSolidSize(kind, "large")),
};

/** The four solids at one step, the tiles of the set-up's shape: the same array each time, so a page may depend on it. */
export function meikyuuSolidTiles(step: MeikyuuSolidStep): readonly number[] {
  return SOLID_TILES[step];
}

/** The names of the solids, and the step as the person reads it. */
export const MEIKYUU_SOLID_NAMES: Readonly<Record<MeikyuuSolidKind, string>> = { cube: "Cube", sphere: "Sphere", octahedron: "Octahedron", icosahedron: "Icosahedron" };

/** Every size a Meikyuu level comes in: the four, the six tall ones, the two colossal ones, then the solids'. */
export const MEIKYUU_EVERY_SIZE: readonly number[] = [...MEIKYUU_SIZES, ...MEIKYUU_TALL_SIZES, ...MEIKYUU_COLOSSAL_SIZES, ...MEIKYUU_SOLID_SIZES];

/** The shape of the box a tall maze is played in, width over height as it is made: two columns to three rows. */
export const MEIKYUU_TALL_RATIO = 2 / 3;

/** Whether a size is played in a tall box (two columns to three rows): the six tall sizes and the tall colossal one. */
export function isMeikyuuTall(size: number): boolean {
  return MEIKYUU_TALL_SIZES.includes(size) || size === MEIKYUU_COLOSSAL_TALL_SIZE;
}

/** Whether a size is one of the two colossal ones. */
export function isMeikyuuColossal(size: number): boolean {
  return MEIKYUU_COLOSSAL_SIZES.includes(size);
}

/** A tall size's columns and rows (the tall colossal one's too), or null for any other number. */
export function meikyuuTallShape(size: number): { width: number; height: number } | null {
  if (size === MEIKYUU_COLOSSAL_TALL_SIZE) return { width: MEIKYUU_COLOSSAL_TALL_SHAPE[0], height: MEIKYUU_COLOSSAL_TALL_SHAPE[1] };
  const at = MEIKYUU_TALL_SIZES.indexOf(size);
  return at < 0 ? null : { width: MEIKYUU_TALL_SHAPES[at]![0], height: MEIKYUU_TALL_SHAPES[at]![1] };
}

/** Whether a number is one of the sizes the levels come in, square or tall. */
export function isMeikyuuSize(size: number): boolean {
  return MEIKYUU_EVERY_SIZE.includes(size);
}

/** The size as an address writes it: 2 for the second of the four, "6x9" for a tall one, "cube-medium" for a solid, so a link says what it is. */
export function meikyuuSizeInAddress(size: number): string {
  const solid = meikyuuSolidOf(size);
  if (solid !== null) return `${solid.kind}-${solid.step}`;
  const tall = meikyuuTallShape(size);
  return tall === null ? String(size) : `${tall.width}x${tall.height}`;
}

/** A size read from an address: `2`, `6x9` or `cube-medium`; null for anything that is none of them. */
export function meikyuuSizeFromAddress(text: string): number | null {
  const solid = /^([a-z]+)-([a-z]+)$/.exec(text);
  if (solid !== null) {
    const kind = (MEIKYUU_SOLID_KINDS as readonly string[]).includes(solid[1]!) ? (solid[1] as MeikyuuSolidKind) : null;
    const step = (MEIKYUU_SOLID_STEPS as readonly string[]).includes(solid[2]!) ? (solid[2] as MeikyuuSolidStep) : null;
    return kind === null || step === null ? null : meikyuuSolidSize(kind, step);
  }
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

/** What a page says of a size: "Small", "Tall 6×9" for a tall one, "Colossal" and "Colossal tall 64×96" for the two colossal ones, "Medium cube" for a solid's. */
export function meikyuuSizeLabel(size: number): string {
  const solid = meikyuuSolidOf(size);
  if (solid !== null) return `${solid.step.charAt(0).toUpperCase()}${solid.step.slice(1)} ${solid.kind}`;
  if (size === MEIKYUU_COLOSSAL_SIZE) return "Colossal";
  if (size === MEIKYUU_COLOSSAL_TALL_SIZE) return `Colossal tall ${MEIKYUU_COLOSSAL_TALL_SHAPE[0]}×${MEIKYUU_COLOSSAL_TALL_SHAPE[1]}`;
  const tall = meikyuuTallShape(size);
  if (tall !== null) return `Tall ${tall.width}×${tall.height}`;
  const word = meikyuuSizeWord(size);
  return word === null ? String(size) : `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
}

/** A size said inside a sentence, with its noun: "small size", "tall 6×9 size", "the medium cube". */
export function meikyuuSizeInWords(size: number): string {
  return isMeikyuuSolid(size) ? `the ${meikyuuSizeLabel(size).toLowerCase()}` : `${meikyuuSizeLabel(size).toLowerCase()} size`;
}
