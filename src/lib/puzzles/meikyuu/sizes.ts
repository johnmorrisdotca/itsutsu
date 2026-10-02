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

/** Every size the levels come in, as the site keeps them: 1 is small, 2 medium, 3 large and 4 huge. */
export const MEIKYUU_SIZES: readonly number[] = [1, 2, 3, 4];

/** Whether a number is one of the four sizes. */
export function isMeikyuuSize(size: number): boolean {
  return Number.isInteger(size) && size >= 1 && size <= MEIKYUU_SIZE_WORDS.length;
}

/** The package's word for a size ("small"), or null for a number that is none. */
export function meikyuuSizeWord(size: number): MeikyuuSizeWord | null {
  return isMeikyuuSize(size) ? MEIKYUU_SIZE_WORDS[size - 1]! : null;
}

/** The size, 1 to 4, that the package's word stands for. */
export function meikyuuSizeOfWord(word: MeikyuuSizeWord): number {
  return MEIKYUU_SIZE_WORDS.indexOf(word) + 1;
}

/** What a page says of a size: "Small". */
export function meikyuuSizeLabel(size: number): string {
  const word = meikyuuSizeWord(size);
  return word === null ? String(size) : `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
}
