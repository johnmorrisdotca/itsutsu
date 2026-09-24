/*
 * The look of a puzzle: the grid, its cells and the keys under it.
 *
 * One constants module for the puzzle components, as `Board.constants.ts` is
 * for the board's. The colours are the site's tokens — ivory for the paper,
 * ink for what is printed — so a puzzle reads as a page of the same book as
 * the boards, in both themes.
 */

/** The grid itself: a bordered square, cells edge to edge. */
export const PUZZLE_GRID = "grid h-full w-full select-none rounded-md border-2 border-ink bg-ivory";

/**
 * A cell: a square button with a thin rule on its left and top, so the grid
 * draws its lines with no gaps; the heavier box edges are added per cell.
 */
export const PUZZLE_CELL =
  "flex aspect-square items-center justify-center border-l border-t border-rule text-lg font-normal tabular-nums text-ink-soft outline-none transition-colors first:border-l-0 hover:bg-shade focus-visible:bg-shade disabled:hover:bg-transparent sm:text-xl";

/** A given: printed, and not for changing. */
export const PUZZLE_CELL_GIVEN = "font-semibold text-ink";

/** A Diagonal's two long diagonals, in a neutral tint unlike the chosen cell's, so the extra groups can be seen at a glance. */
export const PUZZLE_CELL_DIAGONAL = "bg-rule/40";

/**
 * A More or Less mark, drawn over the edge it belongs to: on the cell's right
 * edge for a horizontal one, its bottom edge for a vertical one, on a small
 * disc of the grid's paper so it never reads as part of a number.
 */
const PUZZLE_MARK = "pointer-events-none absolute z-10 flex size-5 items-center justify-center rounded-full bg-ivory text-base font-bold leading-none text-shu sm:size-6 sm:text-lg";
export const PUZZLE_MARK_RIGHT = `${PUZZLE_MARK} top-1/2 right-0 -translate-y-1/2 translate-x-1/2`;
export const PUZZLE_MARK_BELOW = `${PUZZLE_MARK} bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2`;

/** The cell the next key will fill. */
export const PUZZLE_CELL_SELECTED = "bg-moss-soft ring-2 ring-inset ring-moss";

/** The row of number keys under the grid: a fingertip tall on a phone, and never smaller. */
export const PUZZLE_KEYS = "grid gap-1.5";

export const PUZZLE_KEY =
  "flex min-h-11 items-center justify-center rounded-lg border border-rule-strong/80 bg-ivory/80 text-base font-semibold tabular-nums text-ink transition-colors hover:bg-rule/60 focus-visible:ring-2 focus-visible:ring-moss disabled:cursor-not-allowed disabled:opacity-35";

/**
 * The regions of a Hidden Stones grid, one fill each, as tints over the
 * paper, so they read on the ivory of the light theme and the ink of the
 * dark one alike and a black stone sits on any of them. A region's index is
 * the row of its stone, so regions with consecutive indexes are often
 * neighbours: the hues alternate warm and cool rather than running round the
 * wheel, which put three greens side by side in the first picture. A 10×10
 * has ten regions, so ten fills; `index % length` only keeps a grid from
 * falling off the end.
 */
export const REGION_FILLS: readonly string[] = [205, 32, 125, 300, 58, 255, 0, 165, 330, 90].map(
  (hue) => `hsl(${hue} 70% 55% / 0.34)`,
);

/** The clock over the grid. */
export const PUZZLE_CLOCK = "font-mono text-lg tabular-nums";

/** How often the clock is redrawn: once a second, in the browser, and never on a server. */
export const PUZZLE_CLOCK_TICK_MS = 1000;

/** What the set-up says about a size: the cells across, as the tile's word. */
export function sizeWord(size: number): string {
  return `${size}×${size}`;
}
