import { CELL_BRIDGE, type LinkLayout, layoutNeighbours } from "./code.ts";

/**
 * WHERE A LINE MAY GO NEXT, on one board: the rules of a single step, which
 * the solver, the check, the drawing and the answer's lines all read, so a
 * bridge or a wall means the same thing everywhere.
 *
 *  - Across an open edge (no wall) to the next cell.
 *  - Onto a BRIDGE only to go straight over it: into the cell beyond, the same
 *    way on, never turning. Going across uses the bridge's across slot, going
 *    down its down slot; the two are crossed by two different lines.
 *
 * Imports carry their `.ts` so the level script can run this under plain node.
 */
export type Step = {
  /** The cell the line reaches. */
  to: number;
  /** The bridge gone over on the way, or -1 for a plain step. */
  over: number;
  /** Over a bridge: whether across (left or right) rather than down (up or down). */
  across: boolean;
};

/** Every cell's steps on a board, worked out once. */
export function stepTable(layout: LinkLayout): Step[][] {
  const { size, cells } = layout;
  const around = layoutNeighbours(layout);
  return around.map((next, at) =>
    next.flatMap((cell): Step[] => {
      if (cells[cell] !== CELL_BRIDGE) return [{ to: cell, over: -1, across: false }];
      if (cells[at] === CELL_BRIDGE) return [];
      const by = cell - at;
      const beyond = cell + by;
      const across = Math.abs(by) === 1;
      // Straight on, in the same row or column: a bridge is never at an edge, so the cell beyond is on the board.
      if (beyond < 0 || beyond >= size * size || (across && Math.floor(beyond / size) !== Math.floor(cell / size))) return [];
      if (!around[cell]!.includes(beyond)) return [];
      return [{ to: beyond, over: cell, across }];
    }),
  );
}

/** The bridges of a board. */
export function bridgesOf(layout: LinkLayout): number[] {
  return layout.cells.flatMap((cell, at) => (cell === CELL_BRIDGE ? [at] : []));
}
