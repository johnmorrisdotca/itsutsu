/**
 * The vocabulary of Bridges 橋: islands on a grid, and the straight runs of
 * one or two bridges that may join two of them.
 */

/** One island: the cell it stands on, and how many bridges it wants. */
export type Island = { cell: number; row: number; col: number; count: number };

/**
 * A place a bridge could go: two islands in one row or one column with
 * nothing but water between them. `a` is the island nearer the top or the
 * left. `cells` are the water cells the bridge would cross, in order; a pair
 * of islands side by side has none, and the site never makes one.
 */
export type Span = { a: number; b: number; across: boolean; cells: readonly number[] };

/** A puzzle's islands and every span between them, read once from its givens. */
export type BridgesBoard = {
  size: number;
  islands: readonly Island[];
  /** The island standing on each cell, or -1 for water. */
  islandAt: readonly number[];
  spans: readonly Span[];
  /** The spans that touch each island, by index. */
  spansOf: readonly (readonly number[])[];
  /** The spans each span would cross, by index: never both drawn. */
  crossing: readonly (readonly number[])[];
};

/** How many bridges are drawn on each span, in `spans` order: 0, 1 or 2. */
export type BridgeCounts = readonly number[];
