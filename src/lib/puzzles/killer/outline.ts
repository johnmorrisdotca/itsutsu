/**
 * THE DASHED OUTLINE OF EVERY CAGE, as line segments in cell units: each cage
 * drawn a little inside its own edge, the way a printed Killer Sudoku draws it,
 * so a cage reads as a shape within the box rules rather than as one of them.
 *
 * Each cell draws the sides where its neighbour is in another cage, `inset`
 * inside the cell. Where the cage goes on past a side's end, the line runs on
 * to meet the next line of the outline: to the cell's edge when the cage's
 * edge carries on straight, and `inset` past it at an inside corner, where the
 * outline turns back into the cage. That is what makes the lines of one cage
 * meet, with no gap and no overshoot, whatever its shape.
 *
 * Pure and drawn by both the grid a puzzle is solved on and the set-up
 * screen's preview, so the two cannot draw a cage differently.
 */
export type Segment = { x1: number; y1: number; x2: number; y2: number };

export function cageOutline(size: number, cageOf: (index: number) => number | undefined, inset = 0.12): Segment[] {
  const at = (row: number, col: number) => (row < 0 || col < 0 || row >= size || col >= size ? undefined : cageOf(row * size + col));
  const out: Segment[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const mine = at(row, col);
      if (mine === undefined) continue;
      const same = (r: number, c: number) => at(r, c) === mine;
      const edge = { top: !same(row - 1, col), bottom: !same(row + 1, col), left: !same(row, col - 1), right: !same(row, col + 1) };
      /*
       * How far a side's line runs past the cell toward one end: stops `inset`
       * short when the cage ends there, runs to the edge when the neighbour
       * carries the same side on, and `inset` past it at an inside corner.
       */
      const reach = (ends: boolean, neighbourHasSide: boolean) => (ends ? -inset : neighbourHasSide ? 0 : inset);
      if (edge.top) {
        const y = row + inset;
        out.push({ x1: col - reach(edge.left, !same(row - 1, col - 1) && same(row, col - 1)), y1: y, x2: col + 1 + reach(edge.right, !same(row - 1, col + 1) && same(row, col + 1)), y2: y });
      }
      if (edge.bottom) {
        const y = row + 1 - inset;
        out.push({ x1: col - reach(edge.left, !same(row + 1, col - 1) && same(row, col - 1)), y1: y, x2: col + 1 + reach(edge.right, !same(row + 1, col + 1) && same(row, col + 1)), y2: y });
      }
      if (edge.left) {
        const x = col + inset;
        out.push({ x1: x, y1: row - reach(edge.top, !same(row - 1, col - 1) && same(row - 1, col)), x2: x, y2: row + 1 + reach(edge.bottom, !same(row + 1, col - 1) && same(row + 1, col)) });
      }
      if (edge.right) {
        const x = col + 1 - inset;
        out.push({ x1: x, y1: row - reach(edge.top, !same(row - 1, col + 1) && same(row - 1, col)), x2: x, y2: row + 1 + reach(edge.bottom, !same(row + 1, col + 1) && same(row + 1, col)) });
      }
    }
  }
  return out;
}
