/**
 * TSUNAGI'S BLOCKS: its levels come sixteen at a time. John, 2026-09-26: "Does
 * it make sense to make it 16 levels per bump… 16 levels of 16? Does that equal
 * 256?" A block opens once every level of the block before it is solved, the
 * set-up shows one block at a time, and within a block levels rise, the 15th
 * and 16th its two hardest — the places a block's twist takes once twists exist.
 *
 * Its own module, with nothing imported, so the level-making script on a desk
 * reads the same number the site does.
 */
export const TSUNAGI_BLOCK = 16;

/** The block a level is in, from 1. */
export function blockOf(level: number): number {
  return Math.ceil(level / TSUNAGI_BLOCK);
}

/** A block's first and last level, the last no further than the size has. */
export function blockRange(block: number, count: number): { first: number; last: number } {
  const first = (block - 1) * TSUNAGI_BLOCK + 1;
  return { first, last: Math.min(count, block * TSUNAGI_BLOCK) };
}

/** How many blocks a size of `count` levels has. */
export function blocksIn(count: number): number {
  return Math.ceil(count / TSUNAGI_BLOCK);
}
