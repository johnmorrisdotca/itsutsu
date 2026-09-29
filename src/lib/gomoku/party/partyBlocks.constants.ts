// Relative: the engine boundary (`boundary.coverage.test.ts`) allows no alias under src/lib/gomoku.
import type { Point } from "../gomoku.types";

import type { BlocksPieceKey, BlocksRefusal } from "./partyBlocks.types";

/**
 * The board four play on: twenty squares a side. Block Five for two is
 * played on 13, 15 or 19, and none of those holds four players' pieces with
 * room to fight over — four sets of twenty-one are 356 squares, and a 19 has
 * 361 — so this table uses the size the four-player game has always been
 * played on.
 */
export const BLOCKS_PARTY_SIZE = 20;

/** How many play at this table: four, a corner each. */
export const BLOCKS_PARTY_PLAYERS = 4;

const shape = (...cells: [number, number][]): readonly Point[] => cells.map(([row, col]) => ({ row, col }));

/**
 * EACH SHAPE AS IT LIES BEFORE IT IS TURNED, as squares from the top left of
 * the box round it. Listed largest first, the order the tray shows them in:
 * the five-square pieces are the ones worth laying while there is room.
 */
export const BLOCKS_PIECES: Readonly<Record<BlocksPieceKey, readonly Point[]>> = {
  fiveF: shape([0, 1], [0, 2], [1, 0], [1, 1], [2, 1]),
  fiveI: shape([0, 0], [0, 1], [0, 2], [0, 3], [0, 4]),
  fiveL: shape([0, 0], [1, 0], [2, 0], [3, 0], [3, 1]),
  fiveN: shape([0, 1], [1, 1], [2, 0], [2, 1], [3, 0]),
  fiveP: shape([0, 0], [0, 1], [1, 0], [1, 1], [2, 0]),
  fiveT: shape([0, 0], [0, 1], [0, 2], [1, 1], [2, 1]),
  fiveU: shape([0, 0], [0, 2], [1, 0], [1, 1], [1, 2]),
  fiveV: shape([0, 0], [1, 0], [2, 0], [2, 1], [2, 2]),
  fiveW: shape([0, 0], [1, 0], [1, 1], [2, 1], [2, 2]),
  fiveX: shape([0, 1], [1, 0], [1, 1], [1, 2], [2, 1]),
  fiveY: shape([0, 1], [1, 0], [1, 1], [2, 1], [3, 1]),
  fiveZ: shape([0, 0], [0, 1], [1, 1], [2, 1], [2, 2]),
  fourLine: shape([0, 0], [0, 1], [0, 2], [0, 3]),
  fourSquare: shape([0, 0], [0, 1], [1, 0], [1, 1]),
  fourT: shape([0, 0], [0, 1], [0, 2], [1, 1]),
  fourS: shape([0, 1], [0, 2], [1, 0], [1, 1]),
  fourL: shape([0, 0], [1, 0], [2, 0], [2, 1]),
  threeLine: shape([0, 0], [0, 1], [0, 2]),
  threeBend: shape([0, 0], [1, 0], [1, 1]),
  two: shape([0, 0], [0, 1]),
  one: shape([0, 0]),
};

/** Every shape, in the tray's order. */
export const BLOCKS_PIECE_KEYS = Object.keys(BLOCKS_PIECES) as BlocksPieceKey[];

/** What a lay is refused for, as the table says it; compared through these, never as strings. */
export const BLOCKS_REFUSALS = {
  over: "over",
  used: "used",
  offBoard: "offBoard",
  taken: "taken",
  sideTouch: "sideTouch",
  firstCorner: "firstCorner",
  noCorner: "noCorner",
} as const satisfies Record<BlocksRefusal, BlocksRefusal>;
