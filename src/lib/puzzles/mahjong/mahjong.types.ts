/**
 * The vocabulary of Mahjong Solitaire: tiles on a stacked layout, taken off in
 * matching pairs of free tiles. See docs/plans/mahjong/README.md.
 */

/** The suits and honours of a mahjong set, and the two kinds of bonus tile. */
export type MahjongSuit = "characters" | "circles" | "bamboo" | "winds" | "dragons" | "flowers" | "seasons";

/** One face of the set: its suit and its rank within it (1–9 for a suit, 1–4 or 1–3 for the rest). */
export type MahjongFace = { code: string; suit: MahjongSuit; rank: number };

/**
 * How a flower or a season matches. `group`, the usual rule: any flower takes
 * any flower and any season any season. `same`: only an identical tile, and
 * the deal holds bonus tiles in identical pairs.
 */
export type MahjongBonusRule = "group" | "same";

/** A place in a layout: a tile's top-left corner in half-tile units across and down, and its layer. */
export type MahjongSlot = { x: number; y: number; z: number };

/** A stacked layout: its slots in reading order (layer by layer, row by row), which is the order a deal is written in. */
export type MahjongLayout = {
  /** The layout's width in tiles: its "size", unique among the layouts. */
  size: number;
  key: string;
  slots: readonly MahjongSlot[];
};

/**
 * What stands on and beside each slot, worked out once per layout: the slots
 * over it (any higher layer overlapping it), and the slots touching its left
 * and right sides on its own layer.
 */
export type MahjongGeometry = {
  layout: MahjongLayout;
  above: readonly (readonly number[])[];
  left: readonly (readonly number[])[];
  right: readonly (readonly number[])[];
};

/**
 * The tiles as they lie: a face code for each slot of the layout, "." where
 * the tile has been taken. The same string the givens are written as.
 */
export type MahjongCells = string;

/** One move of a solve: a pair taken, by its two slots, or a shuffle of what is left. */
export type MahjongMove = { pair: readonly [number, number] } | { shuffle: true };
