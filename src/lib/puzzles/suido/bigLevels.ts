import { firstUnsolvedSuidoBigLevel, nextSuidoBigLevel, openSuidoBigLevels, SUIDO_BIG_SIZES } from "@johnmorrisdotca/suido/levels-info";

import { isSuidoBigLevel, SUIDO_BIG_LEVEL_COUNT } from "./levelCounts";
import { suidoSizeOfKey } from "./sizes";

/**
 * THE BIG-PIECES SET, SEEN FROM THE SITE: sixty-four levels with big pieces among the ordinary ones, the package's own
 * (`@johnmorrisdotca/suido/levels-info` knows each level's size, score and big pieces without its board). A level of it is
 * a level of its own size, so every record the site keeps (a kept run, a solve, a time) names it by that size and by its
 * seed in the big-pieces half of the level block (`seed.ts`); what is the set's is its numbering, 1 to 64, and its blocks of
 * sixteen, which open one after another across every size.
 */

/** The size, as the site keeps it (`sizes.ts`), of a level of the set; null for a number that is no level. */
export function suidoBigSizeOf(level: number): number | null {
  const key = isSuidoBigLevel(level) ? SUIDO_BIG_SIZES[level - 1] : undefined;
  return key === undefined ? null : suidoSizeOfKey(key);
}

/** Every size the set has levels at, in the order its levels first reach them. */
export const SUIDO_BIG_SIZE_LIST: readonly number[] = [...new Set(SUIDO_BIG_SIZES.map((key) => suidoSizeOfKey(key)!))];

/** The levels of the set that are of a size, in order: none for a size the set does not have. The levels of a size need not be side by side, as the score puts the set in order and two sizes' levels may alternate. */
export function suidoBigLevelsAt(size: number): number[] {
  return SUIDO_BIG_SIZES.flatMap((key, at) => (suidoSizeOfKey(key) === size ? [at + 1] : []));
}

/** Whether `level` is a level of the set at `size`. */
export function isSuidoBigLevelAt(size: number, level: number): boolean {
  return suidoBigSizeOf(level) === size;
}

export { firstUnsolvedSuidoBigLevel, nextSuidoBigLevel, openSuidoBigLevels, SUIDO_BIG_LEVEL_COUNT };
