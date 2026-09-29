/**
 * HOW WIDE THE PLAY IS DRAWN AT LARGE AND FULL, from what the browser measured.
 *
 * Every board-drawing page lays its play out as a board and the things that
 * are not the board: side matter beside it (a keypad, a sidebar, the players
 * at the table) whose width does not change, and rows above and below it
 * (the size chooser, whose turn it is, the row a placed stone brings up)
 * whose height does not change. Only the drawing grows, in proportion. So one
 * measurement at the bigger layout says everything needed to work out the
 * largest drawing that fits:
 *
 * - across, the window less a gutter each side, less the side matter and the
 *   drawing's own margin (its coordinates, its frame);
 * - down, the window less a hair at the bottom, less what sits above the
 *   drawing inside the play and what must stay in reach below it.
 *
 * The chooser sits at the top of the play, so "the window" is measured from
 * there: choosing a size brings the play to the top of the window, and then
 * everything in the play is on the screen at once.
 *
 * Pure, and the numbers are CSS pixels.
 */

/** Kept free each side of a play wider than the page, so it never touches the glass. */
export const SCALE_GUTTER_PX = 16;

/**
 * Kept free in the window's height besides the play: the 8 pixels left above
 * it when a choice brings it to the top of the window (`SCALE_TOP_PX`), and 8
 * under its last row.
 */
export const SCALE_TOP_PX = 8;
export const SCALE_EDGE_PX = SCALE_TOP_PX + 8;

export type ScaleMeasure = {
  /** The drawing's width at Regular: the floor under both bigger sizes. */
  regularDrawing: number;
  /** The play's width and the drawing inside it, at the bigger layout. */
  play: number;
  /** The width of the column the drawing sits in, at the bigger layout. */
  column: number;
  drawing: { width: number; height: number };
  /** From the play's top edge to the drawing's. */
  above: number;
  /** What must stay on the screen under the drawing. */
  below: number;
  /** The window: its width less any scroll bar, and its height. */
  window: { width: number; height: number };
};

/** One bigger size: the play's width, and how many times Regular's drawing the drawing is at it. */
export type ScaledSize = { play: number; grow: number };

/**
 * The play's width at Large and at Full, whole pixels, and each drawing's
 * growth over Regular's — what text drawn in a fixed size inside a square is
 * multiplied by, so it grows with the square — or null where nothing sensible
 * was measured.
 */
export function scaledPlayWidths(measure: ScaleMeasure): { large: ScaledSize; full: ScaledSize } | null {
  const { drawing, play, column, regularDrawing } = measure;
  if (!(drawing.width > 0 && drawing.height > 0 && play > 0 && column > 0 && regularDrawing > 0)) return null;
  const side = Math.max(0, play - column);
  const margin = Math.max(0, column - drawing.width);
  const aspect = drawing.height / drawing.width;
  const across = measure.window.width - 2 * SCALE_GUTTER_PX - side - margin;
  const down = (measure.window.height - SCALE_EDGE_PX - Math.max(0, measure.above) - Math.max(0, measure.below)) / aspect;
  // Never smaller than the board everybody had: a window with no more room keeps Regular's drawing.
  const full = Math.max(regularDrawing, Math.min(across, down));
  const large = regularDrawing + (full - regularDrawing) / 2;
  const sized = (drawn: number): ScaledSize => ({ play: Math.round(drawn + margin + side), grow: Math.round((drawn / regularDrawing) * 1000) / 1000 });
  return { large: sized(large), full: sized(full) };
}
