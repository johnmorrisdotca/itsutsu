import { EDGE_LINE_WIDTH, GO_BOARD_RIM, HEX_LATTICE, latticeFitFor, type LatticeShape } from "./Board.constants";

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
export type { LatticeShape } from "./Board.constants";

export function latticeLabelTracks(size: number, axis: "columns" | "rows", shape: LatticeShape = "rhombus"): string {
  /*
   * DERIVED FROM THE FIT, whichever shape it is. Each shape used to carry its
   * own hand-worked "rows" constant and its own column lead, and every change
   * to a fit — the star's, then the rhombus's rim, then the rhombus's ring of
   * border tiles — meant a matching change here that was easy to get wrong
   * and only visible in a picture. The fit already says where the lattice's
   * origin lands and how big a cell is; a strip is that, in cells.
   */
  const fit = latticeFitFor(shape, size);
  // One cell, as a fraction of the box: across, and down.
  const cellW = fit.scale / size;
  const cellH = (HEX_LATTICE.height * fit.scale) / size;
  if (axis === "columns") {
    /*
     * A STAR HAS NO COLUMNS TO LABEL, so it is not given any — see
     * `starColumnsSayNothing` below for why an empty strip is the honest
     * answer here and a row of letters is not.
     */
    if (shape === "star") return "";
    /*
     * The letters follow ONE row read across — the middle row on a hexagon,
     * the only row holding every column; the first row on the rhombus. A cell
     * at column c of row r starts at lattice x = (c + 0.25 + 0.5r)/N, so the
     * strip's first track is everything before column 0 of that row.
     */
    const row = shape === "hexagon" ? (size - 1) / 2 : 0;
    const lead = fit.left + (0.25 + 0.5 * row) * cellW;
    const trail = 1 - lead - size * cellW;
    return `${lead / cellW}fr repeat(${size}, minmax(0, 1fr)) ${trail / cellW}fr`;
  }
  // What is above the first row and below the last, in rows.
  const lead = fit.top;
  const trail = 1 - lead - size * cellH;
  return `${lead / cellH}fr repeat(${size}, minmax(0, 1fr)) ${trail / cellH}fr`;
}

/**
 * WHY THE HEXAGRAM IS DRAWN WITH ROW NUMBERS AND NO COLUMN LETTERS.
 *
 * On a sheared lattice a "column" is not a vertical line, so a column strip
 * can only ever be the columns of ONE row, read across. The rhombus uses its
 * first row and the hexagon its middle one — "the only row where every column
 * of the array exists", as above.
 *
 * A star has no such row. Its leftmost cell is the left point's tip, three
 * quarters of the way down the array; its rightmost is the right point's tip,
 * a quarter of the way down. No row holds both, and the widest row through the
 * centre holds nine of the seventeen columns. Whichever row the letters
 * followed, most of them would sit over sealed cells or off the board — which
 * is what they did: seventeen letters spread across the left two thirds of a
 * board whose shape occupied the middle half, pointing at nothing.
 *
 * So it says nothing rather than something untrue, which is the rule in
 * AGENTS.md under "Nothing Answers What It Cannot Answer". A cell still HAS a
 * name — `squareLabel` reads it off the row and column, and a screen reader
 * hears it — and that name is not what a strip of letters was ever proving.
 */
export const starColumnsSayNothing = true;
