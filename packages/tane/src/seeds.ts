/**
 * Seeds as numbers people pass around: in an address, a form, a database row.
 *
 * A seed here is a whole number from 1 to `SEED_MOST` (2^31 − 1), which every
 * language and every JSON parser reads exactly. Ranges of those numbers can be
 * kept aside as SEED BLOCKS, each meaning something of its own (the daily
 * puzzles, a weekly challenge), so that a seed drawn at random never lands on
 * one somebody would recognise.
 */
import type { Random } from "./random.ts";

/** The largest seed: it travels as a plain integer, so it stays a positive 32-bit signed one. */
export const SEED_MOST = 2 ** 31 - 1;

/** A range of seeds kept aside: `from` up to, not including, `from + size`. */
export type SeedBlock = { readonly from: number; readonly size: number };

/** Where a drawn seed may land. */
export type DrawSeedOptions = {
  /** The largest seed to draw. `SEED_MOST` unless said. */
  readonly most?: number;
  /** Blocks a drawn seed never lands in. They must not overlap. */
  readonly reserved?: readonly SeedBlock[];
};

/** Whether a value read from outside (an address, a request body) is a seed: an integer from 1 to `most`. */
export function isSeed(value: unknown, most: number = SEED_MOST): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= most;
}

/** Whether a seed falls inside a block. */
export function inBlock(seed: number, block: SeedBlock): boolean {
  return seed >= block.from && seed < block.from + block.size;
}

/**
 * The blocks in ascending order, checked: whole numbers, inside 1 to `most`,
 * none overlapping another. Throws a `RangeError` naming the first fault.
 */
export function checkBlocks(blocks: readonly SeedBlock[], most: number = SEED_MOST): SeedBlock[] {
  const sorted = [...blocks].sort((a, b) => a.from - b.from);
  let end = 1;
  for (const block of sorted) {
    if (!Number.isSafeInteger(block.from) || !Number.isSafeInteger(block.size) || block.size < 1) {
      throw new RangeError(`tane: seed block ${block.from}+${block.size} is not a range of whole numbers`);
    }
    if (block.from < end) throw new RangeError(`tane: seed block from ${block.from} overlaps the one before it`);
    if (block.from + block.size - 1 > most) throw new RangeError(`tane: seed block from ${block.from} runs past ${most}`);
    end = block.from + block.size;
  }
  return sorted;
}

/**
 * A seed from 1 to `most`, any of them as likely as another, skipping every
 * reserved block: one draw. The draw is spread over the seeds that are left
 * and then stepped over each block below it, so no seed is ever likelier than
 * another and no draw is wasted.
 */
export function drawSeed(random: Random, options: DrawSeedOptions = {}): number {
  const most = options.most ?? SEED_MOST;
  const blocks = checkBlocks(options.reserved ?? [], most);
  const kept = blocks.reduce((sum, block) => sum + block.size, 0);
  if (kept >= most) throw new RangeError("tane: every seed is reserved");
  let seed = Math.floor(random() * (most - kept)) + 1;
  for (const block of blocks) {
    if (seed >= block.from) seed += block.size;
  }
  return seed;
}

/** A new seed for something nobody asked for by number, drawn from `Math.random`. */
export function freshSeed(options: DrawSeedOptions = {}): number {
  return drawSeed(Math.random, options);
}
