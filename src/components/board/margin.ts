import { EDGE_LINE_WIDTH, GO_BOARD_RIM, HEXAGON_ROWS, HEX_LATTICE } from "./Board.constants";

export { GO_BOARD_RIM } from "./Board.constants";

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

/**
 * The same strips for a board on the hexagon lattice, whose rows and columns
 * do not span the box the way a square board's do — see HEX_LATTICE. Down the
 * side, the rows are packed closer and sit centred in a box taller than they
 * are. Along the top it depends on the SHAPE, which is what `hexagon` says.
 *
 * On the rhombus, the first row of points starts a quarter of a cell in and
 * runs two thirds of the width, the rest being the shear of the rows below.
 *
 * ON A HEXAGON, THE LETTERS FOLLOW THE MIDDLE ROW, and that is not a
 * convenience — it is the only row where every column of the array exists. The
 * top row of a hexagon holds only its right-hand half; a letter placed over
 * the top row would sit off the left of the board for half the alphabet, and
 * over cells that are sealed for the rest. The widest row is the one through
 * the centre, and its shear works out to exactly one cell per column across
 * the whole box, which is why this comes out as plainly as it does.
 *
 * All in cells, as `fr`, for the reason `labelTracks` gives.
 */
export function latticeLabelTracks(size: number, axis: "columns" | "rows", hexagon = false): string {
  const { width, height } = HEX_LATTICE;
  const fitted = hexagon ? HEXAGON_ROWS : height / width;
  if (axis === "columns") {
    if (hexagon) return `repeat(${size}, minmax(0, 1fr))`;
    // The first row's points sit half a cell down, so the shear moves them a quarter along.
    const lead = 0.25;
    return `${lead}fr repeat(${size}, minmax(0, 1fr)) ${(width - 1) * size - lead}fr`;
  }
  // What is left over above and below the rows, once they are fitted to the box.
  const edge = ((1 / fitted - 1) / 2) * size;
  return `${edge}fr repeat(${size}, minmax(0, 1fr)) ${edge}fr`;
}
