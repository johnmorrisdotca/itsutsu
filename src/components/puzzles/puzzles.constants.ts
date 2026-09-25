import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

/*
 * The look of a puzzle: the grid, its cells and the keys under it.
 *
 * One constants module for the puzzle components, as `Board.constants.ts` is
 * for the board's. The colours are the site's tokens — ivory for the paper,
 * ink for what is printed — so a puzzle reads as a page of the same book as
 * the boards, in both themes.
 */

/** The grid itself: a bordered square, cells edge to edge. */
// White paper inside the wood (`PuzzleBoard`): the frame is the board's, so the grid carries no border of its own.
export const PUZZLE_GRID = "grid h-full w-full select-none bg-white";

/**
 * A cell: a square button with a thin rule on its left and top, so the grid
 * draws its lines with no gaps; the heavier box edges are added per cell.
 */
export const PUZZLE_CELL =
  "flex aspect-square items-center justify-center border-l border-t border-rule font-normal tabular-nums text-ink-soft outline-none transition-colors first:border-l-0 hover:bg-shade focus-visible:bg-shade disabled:hover:bg-transparent";

/**
 * A cell's number, sized to the grid: the size every grid up to 9×9 has
 * always had, and smaller for the 16×16 Giant, whose cells are about 21px on a
 * 390px phone and would crop a full-size letter.
 */
export function puzzleCellText(size: number): string {
  return size > 9 ? "text-xs sm:text-base" : "text-lg sm:text-xl";
}

/** At most this many keys in a row under the grid: the 16×16's seventeen keys make two rows a fingertip each. */
export const PUZZLE_KEYS_PER_ROW = 9;

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

/** What a page says about a size: the cells across a grid, or the letters of a WordDrop word, which is not a square. */
export function sizeWord(size: number, kind?: PuzzleKind): string {
  return kind === "wordDrop" ? `${size} letters` : `${size}×${size}`;
}

/** The cages' dashed outlines, one drawing laid over the whole grid (Sum Cages). */
export const PUZZLE_CAGE_LINES = "pointer-events-none absolute inset-0 h-full w-full stroke-ink/70 [stroke-dasharray:4_3] [stroke-width:1]";

/** A cage's sum, small in the top-left corner of its first cell. */
export const PUZZLE_CAGE_SUM = "pointer-events-none absolute top-[4%] left-[6%] text-[0.55rem] leading-none font-semibold text-ink sm:text-[0.65rem]";

/** A Towers clue, on the wood beside the row or column it looks along: printed like a given, and never pressed. */
export const PUZZLE_TOWER_CLUE = "flex select-none items-center justify-center text-lg font-bold tabular-nums leading-none text-ink sm:text-xl";

/** The square inside a Towers ring: a hairline edge, so the white paper reads as a square on the wood and not a hole in it. */
export const PUZZLE_TOWER_SQUARE = "relative ring-1 ring-ink/60";

/** A Black and White cell: a square button ruled on its left and top, as the number grid's are. */
export const PUZZLE_STONE_CELL =
  "relative flex aspect-square items-center justify-center border-l border-t border-rule outline-none transition-colors hover:bg-shade focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-moss disabled:hover:bg-transparent";

/** A cell whose stone was printed: shaded, as Diagonal shades its extra groups, so a given reads apart from a move. */
export const PUZZLE_STONE_PRINTED = "bg-rule/40 disabled:hover:bg-rule/40";

/** The black stone, as Hidden Stones draws it. */
export const PUZZLE_STONE_BLACK = "block size-[70%] rounded-full bg-ink shadow-[inset_0_-2px_3px_rgba(255,255,255,0.18)]";

/** The white stone: paper-white with an ink rim, so it reads on the white grid. */
export const PUZZLE_STONE_WHITE = "block size-[70%] rounded-full border-2 border-ink/70 bg-white shadow-[inset_0_-2px_3px_rgba(0,0,0,0.12)]";

/**
 * A cell Hint marked wrong: a red ring inside it and a faint red ground, never
 * colour alone — the number or stone is still there to read, and the ring is a
 * shape. It goes when the cell is changed (`useHints`).
 */
export const PUZZLE_CELL_WRONG = "ring-2 ring-inset ring-shu bg-shu-soft/50";

/*
 * WORDDROP: letter tiles in rows, and a keyboard under them. A tile's colour
 * says what its letter is to the hidden word — moss in its place, ochre in the
 * word elsewhere, grey not in it — as the site's own colours rather than the
 * published game's, and always with the letter written on it, so a reader who
 * cannot tell the colours apart still reads the row by its tiles' borders and
 * labels (`aria-label` says the mark in words).
 */
export const WORD_TILE =
  "flex aspect-square items-center justify-center rounded-sm border-2 text-xl font-bold uppercase leading-none tabular-nums sm:text-2xl";
export const WORD_TILE_EMPTY = "border-rule bg-white text-ink";
export const WORD_TILE_TYPED = "border-ink-soft bg-white text-ink";
export const WORD_TILE_MARK: Record<"hit" | "near" | "miss", string> = {
  hit: "border-moss bg-moss text-ivory",
  near: "border-ochre bg-ochre text-ivory",
  miss: "border-muted bg-muted text-ivory",
};

/** The keyboard under the grid: three rows, each key a fingertip tall. */
export const WORD_KEY =
  "flex min-h-12 min-w-0 flex-1 items-center justify-center rounded-md border border-rule-strong/80 text-sm font-semibold uppercase transition-colors focus-visible:ring-2 focus-visible:ring-moss disabled:opacity-40 sm:text-base";
/** A key nothing is known of yet; a marked key takes its tile's colours (`WORD_TILE_MARK`), text and all. */
export const WORD_KEY_PLAIN = "bg-ivory/80 text-ink hover:bg-rule/60";
