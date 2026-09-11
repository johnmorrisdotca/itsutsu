import { EDGE_LINE_WIDTH } from "./Board.constants";

/**
 * The rim of bare board surface around the playing area.
 *
 * A board drawn on the LINES gets one for nothing. Its outermost rule runs
 * half a cell in from the edge, so wood shows all the way round it, and that
 * margin is what makes a go board read as a board with a frame rather than a
 * crop of one. It is the thing John pointed at: "Go board has a nice border
 * around it".
 *
 * A board drawn in the SQUARES has none. The squares tile the whole surface
 * and run flush to its edge, which swallows the frame drawn under them, and
 * checkers, Othello and tic-tac-toe all come out looking cropped. Nothing was
 * missing from their style — both are framed identically. The difference is
 * geometry, and this is where it is put back.
 *
 * ## A fraction of the BOARD, not of a cell
 *
 * Half a cell is 2.6% of a 19×19 board and 17% of a 3×3 one, so the same rule
 * measured in cells would give go a hairline and tic-tac-toe a picture frame —
 * two different objects rather than one board family. A rim is a property of
 * the board as a thing: the wood left around the playing field. Two boards the
 * same size have the same rim whether somebody ruled three lines on them or
 * nineteen. Every board here is drawn in the same square box, so a fraction of
 * that box is one rim across all thirty-nine games, which is what "make sure
 * all images of boards have a border" asks for.
 */

/** The board the rim is measured from: a 19×19 go board, drawn on its lines. */
const GO_SIDE = 19;

/**
 * How much surface a 19×19 go board shows outside its outermost line, as a
 * fraction of the board's width — the proportion every other board is matched
 * to rather than a value anybody chose.
 *
 * The line's CENTRE is half a cell in from the edge and the line is
 * `EDGE_LINE_WIDTH` cells thick, so half that thickness stands in the margin
 * and only the rest of it is bare.
 */
export const GO_BOARD_RIM = (0.5 - EDGE_LINE_WIDTH / 2) / GO_SIDE;

/**
 * How far in to push a board's playing area, as a fraction of its width, so
 * that what shows around it is `GO_BOARD_RIM`.
 *
 * More than the rim itself, because the outermost rule of a squares board is
 * drawn ON the edge of the playing area with half its thickness either side —
 * and that thickness is measured in cells, which the inset itself changes.
 * Solving `inset − (E/2)·cell = GO_BOARD_RIM` with `cell = (1 − 2·inset)/size`
 * gives what is below. Without the correction the rim would come out thin on
 * exactly the boards that were complained about: on tic-tac-toe a cell is a
 * third of the board, so its edge rule alone is a fortieth of the width and
 * would eat a third of the margin.
 *
 * Zero for a board drawn on the lines, which already leaves its own half-cell,
 * and zero is the honest answer there rather than a second margin outside the
 * first.
 */
export function playingAreaInset(size: number, cells: boolean): number {
  if (!cells || size <= 0) return 0;
  return (GO_BOARD_RIM + EDGE_LINE_WIDTH / (2 * size)) / (1 + EDGE_LINE_WIDTH / size);
}

/**
 * The flex factor for the empty track at each end of a strip of coordinate
 * labels, so the strip's own tracks land exactly over the board's cells.
 *
 * With `size` tracks of `1fr` between two of these, a cell's share of the
 * strip is `1/(2·edge + size)` and an end track's is `edge/(2·edge + size)`;
 * setting the latter to the inset and solving gives this.
 */
export function labelEdge(size: number, inset: number): number {
  return inset === 0 ? 0 : (inset * size) / (1 - 2 * inset);
}

/**
 * Grid tracks for a strip of coordinate labels beside the board: the rim at
 * each end, then one track per row or column.
 *
 * The labels sit outside the board's own box, so nothing insets them along
 * with it — they have to be given the same rim or every letter drifts, by the
 * width of the rim at the far end. In `fr` rather than a percentage padding,
 * because a percentage resolves against the strip's own width and the strip
 * down the left side is one gutter wide rather than one board wide: the same
 * number written there would be a fortieth of what it is along the top.
 */
export function labelTracks(size: number, inset: number): string {
  const edge = labelEdge(size, inset);
  return `${edge}fr repeat(${size}, minmax(0, 1fr)) ${edge}fr`;
}
