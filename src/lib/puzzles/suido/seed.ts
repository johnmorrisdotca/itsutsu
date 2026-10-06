import type { Kind } from "@johnmorrisdotca/suido";

import type { SeedBlock } from "@johnmorrisdotca/tane";

import { freshSeed, NETWORK_SEED_BLOCK, SUIDO_BIG_SEED_BLOCK, SUIDO_LEVEL_SEED_BLOCK, SUIDO_TURN_SEED_BLOCK, type Random } from "../random";

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
  return inBlock(seed, NETWORK_SEED_BLOCK) || inBlock(seed, SUIDO_BIG_SEED_BLOCK) || inBlock(seed, SUIDO_TURN_SEED_BLOCK) ? "network" : "drains";
}

const inBlock = (seed: number, block: SeedBlock): boolean => Number.isInteger(seed) && seed >= block.from && seed < block.from + block.size;

/**
 * THE SQUARES OF A BOARD, SAID BY THE SEED TOO: "none" for an ordinary board, and "big" for a network with big pieces (squares of four
 * cells that are one piece and turn as one, the package's `bigs`), whose seeds are in `SUIDO_BIG_SEED_BLOCK`, and "turn" for a network
 * with block turns (fixed squares of four pieces that a tap turns together, the package's `blocks`), in `SUIDO_TURN_SEED_BLOCK`. A board
 * with either is always a network (`suidoKindOfSeed`), so the one choice sets the other.
 */
export type SuidoSquares = "none" | "big" | "turn";

/** Which squares a seed's board has. */
export function suidoSquaresOfSeed(seed: number): SuidoSquares {
  if (inBlock(seed, SUIDO_BIG_SEED_BLOCK)) return "big";
  return inBlock(seed, SUIDO_TURN_SEED_BLOCK) ? "turn" : "none";
}

/** A new seed for a board of this kind and these squares, for a puzzle nobody asked for by number; squares make a network whatever the kind says. */
export function freshSuidoSeed(kind: Kind, squares: SuidoSquares = "none", random: Random = Math.random): number {
  if (squares === "big") return SUIDO_BIG_SEED_BLOCK.from + Math.floor(random() * SUIDO_BIG_SEED_BLOCK.size);
  if (squares === "turn") return SUIDO_TURN_SEED_BLOCK.from + Math.floor(random() * SUIDO_TURN_SEED_BLOCK.size);
  return kind === "network" ? NETWORK_SEED_BLOCK.from + Math.floor(random() * NETWORK_SEED_BLOCK.size) : freshSeed();
}

/**
 * A FIXED LEVEL IS A SEED TOO, in a block of its own (`SUIDO_LEVEL_SEED_BLOCK`): level N of a size is the block's
 * first seed and N more. A level is the same board for everybody, so there is nothing to draw; the seed is where a
 * kept run, a race and an address say which level it is, as a Tsunagi level's seed is its number, without a
 * Tsunagi's board of seeds being free for it. Null for a seed that is not a level's: every board made at random.
 *
 * THE BIG-PIECES LEVELS are the block's later half: level N of that set (1 to 64, its own numbering across every size)
 * is the block's first seed and 500 and N more, as Tsunagi's portal levels are its numbers plus a thousand
 * (`tsunagi/levels.ts`). A size has 256 levels at most, so the two never meet; the seed says which set a level is of
 * (`suidoSetOfSeed`), and the number it returns is the number a reader knows the level by.
 */
export function suidoLevelOfSeed(seed: number): number | null {
  const number = seed - SUIDO_LEVEL_SEED_BLOCK.from;
  if (!Number.isInteger(seed) || number < 1 || number >= SUIDO_LEVEL_SEED_BLOCK.size) return null;
  return number >= SUIDO_BIG_LEVEL_OFFSET ? number - SUIDO_BIG_LEVEL_OFFSET : number;
}

/** The two sets of levels: the ones by size, and the sixty-four with big pieces among the ordinary ones. */
export type SuidoSet = "classic" | "big";

/** How far into the level block the big-pieces levels begin: a size has at most 256 levels, so nothing of the first set reaches it. */
export const SUIDO_BIG_LEVEL_OFFSET = 500;

/** Which set a level seed is of, or null for a seed that names no level. */
export function suidoSetOfSeed(seed: number): SuidoSet | null {
  const number = seed - SUIDO_LEVEL_SEED_BLOCK.from;
  if (!Number.isInteger(seed) || number < 1 || number >= SUIDO_LEVEL_SEED_BLOCK.size) return null;
  return number >= SUIDO_BIG_LEVEL_OFFSET ? "big" : "classic";
}

/** The seed that names level `level` of a set (the first set's by default). */
export function suidoLevelSeed(level: number, set: SuidoSet = "classic"): number {
  return SUIDO_LEVEL_SEED_BLOCK.from + (set === "big" ? SUIDO_BIG_LEVEL_OFFSET : 0) + level;
}

/** A kind of board and its squares, as chosen on the set-up. */
export type SuidoWay = { pipes: Kind; squares: SuidoSquares };

/**
 * A seed for the picture of a board of this kind (the set-up's preview): the same every time, so the picture does not change as
 * nothing is chosen, and in the block that says the kind and the squares, so it is a board of that kind.
 */
export function suidoPreviewSeed(way: SuidoWay = { pipes: "drains", squares: "none" }): number {
  if (way.squares === "big") return SUIDO_BIG_SEED_BLOCK.from + 7;
  if (way.squares === "turn") return SUIDO_TURN_SEED_BLOCK.from + 7;
  return way.pipes === "network" ? NETWORK_SEED_BLOCK.from + 7 : 7;
}
