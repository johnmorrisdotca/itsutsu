import type { Kind } from "@johnmorrisdotca/suido";

import { freshSeed, NETWORK_SEED_BLOCK, SUIDO_LEVEL_SEED_BLOCK, type Random } from "../random";

/**
 * DRAINS OR NETWORK, SAID BY THE SEED. A kept run is found again by its kind,
 * size, level and seed and nothing else, so the seed is the one thing that can
 * tell a network from a drains board of the same size and level without a
 * column of its own (the same reason a Futago's seeds sit in a block, `futagoSeed.ts`).
 * A seed in `NETWORK_SEED_BLOCK` makes a network, where every piece must carry
 * water; any other makes drains, where every drain must be reached and spare
 * pieces may stay dry. `freshSeed` never lands in the block, so an ordinary
 * seed is never a network by accident, and a seed already kept stays drains.
 *
 * Kept apart from the generator so that an address, which reads the kind from
 * a seed on every page that has one, does not reach the package that makes
 * the boards (`pageFunction.coverage.test.ts`).
 */
export function suidoKindOfSeed(seed: number): Kind {
  return Number.isInteger(seed) && seed >= NETWORK_SEED_BLOCK.from && seed < NETWORK_SEED_BLOCK.from + NETWORK_SEED_BLOCK.size ? "network" : "drains";
}

/** A new seed for a board of this kind, for a puzzle nobody asked for by number. */
export function freshSuidoSeed(kind: Kind, random: Random = Math.random): number {
  return kind === "network" ? NETWORK_SEED_BLOCK.from + Math.floor(random() * NETWORK_SEED_BLOCK.size) : freshSeed();
}

/**
 * A FIXED LEVEL IS A SEED TOO, in a block of its own (`SUIDO_LEVEL_SEED_BLOCK`): level N of a size is the block's
 * first seed and N more. A level is the same board for everybody, so there is nothing to draw; the seed is where a
 * kept run, a race and an address say which level it is, as a Tsunagi level's seed is its number, without a
 * Tsunagi's board of seeds being free for it. Null for a seed that is not a level's: every board made at random.
 */
export function suidoLevelOfSeed(seed: number): number | null {
  const number = seed - SUIDO_LEVEL_SEED_BLOCK.from;
  return Number.isInteger(seed) && number >= 1 && number < SUIDO_LEVEL_SEED_BLOCK.size ? number : null;
}

/** The seed that names level `level`. */
export function suidoLevelSeed(level: number): number {
  return SUIDO_LEVEL_SEED_BLOCK.from + level;
}
