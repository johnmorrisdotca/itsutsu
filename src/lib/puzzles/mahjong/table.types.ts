import type { PuzzleLevel } from "../puzzles.types";

/**
 * MAHJONG FOR A TABLE: two to four people (or computers) taking turns on one
 * shared layout. See `table.ts` for the rules and docs/plans/mahjong/README.md
 * for why these.
 */

/** Who sits in a seat: a name typed on the device, or a computer. */
export type MahjongSeat = { name: string; computer?: true };

/**
 * A GAME AT THE TABLE, as it is kept: the deal, who sits where, and every pair
 * taken, in order. Everything else — whose turn it is, the scores, the
 * shuffles, the end — is read again from these by `readTable`, so a game read
 * back out of storage is exactly the game its pairs make, or none.
 */
export type MahjongTable = {
  size: number;
  level: PuzzleLevel;
  seed: number;
  /** The deal, as the solo game writes it: a face a slot (`tiles.ts`). */
  givens: string;
  seats: readonly MahjongSeat[];
  /** Every pair taken, by its two slots, in the order they were taken. */
  takes: readonly (readonly [number, number])[];
};

/** One pair taken, as the table remembers it. */
export type MahjongTake = { seat: number; pair: readonly [number, number]; codes: readonly [string, string]; points: number; again: boolean };

/** Where a game at the table stands, read from its pairs. */
export type MahjongTableState = {
  /** The tiles as they lie now. */
  cells: string;
  /** The seat to move; meaningless once `over`. */
  turn: number;
  /** Points, and pairs taken, seat by seat. */
  scores: number[];
  pairs: number[];
  taken: MahjongTake[];
  /** How many times the table ran out of pairs and the tiles were shuffled; and after which take the last was. */
  shuffles: number;
  shuffledAfter: number | null;
  /** Over: every tile taken, or the tiles left could not be freed by any shuffle. */
  over: boolean;
  /** The seats with the most points, once it is over: one, or several sharing it. */
  winners: number[];
};
