import { PACHISI_HOME, PACHISI_LAST_TRACK, PACHISI_NEST } from "@/lib/party/pachisi/pachisi.constants";
import { squareOf } from "@/lib/party/pachisi/pachisi";

/**
 * WHERE EVERYTHING SITS ON THE CROSS, in cells of a board nineteen across: an
 * arm of three columns eight long on each side of a three-by-three middle,
 * and a nest in each corner. The shared track runs up the bottom arm's left
 * column, along the left arm, round the top and the right, and back down the
 * bottom arm's right column; each player's home path is the middle column of
 * their own arm, and home is the middle.
 *
 * Arm 0 is the bottom, 1 the left, 2 the top, 3 the right, in the order the
 * track reaches them.
 */

export const PACHISI_CELLS = 19;

/** A cell: row and column, 0 to 18 from the top left. */
export type Cell = { row: number; col: number };

/** The track's sixty-eight squares, in order, each a cell. */
export const TRACK_CELLS: readonly Cell[] = (() => {
  const cells: Cell[] = [];
  const run = (count: number, cell: (step: number) => Cell) => {
    for (let step = 0; step < count; step += 1) cells.push(cell(step));
  };
  run(8, (step) => ({ row: 18 - step, col: 8 }));
  run(8, (step) => ({ row: 10, col: 7 - step }));
  cells.push({ row: 9, col: 0 });
  run(8, (step) => ({ row: 8, col: step }));
  run(8, (step) => ({ row: 7 - step, col: 8 }));
  cells.push({ row: 0, col: 9 });
  run(8, (step) => ({ row: step, col: 10 }));
  run(8, (step) => ({ row: 8, col: 11 + step }));
  cells.push({ row: 9, col: 18 });
  run(8, (step) => ({ row: 10, col: 18 - step }));
  run(8, (step) => ({ row: 11 + step, col: 10 }));
  cells.push({ row: 18, col: 9 });
  return cells;
})();

/** A player's home path, step 1 to 7 from their arm's end towards the middle. */
export function homePathCell(arm: number, step: number): Cell {
  switch (arm) {
    case 0:
      return { row: 18 - step, col: 9 };
    case 1:
      return { row: 9, col: step };
    case 2:
      return { row: step, col: 9 };
    default:
      return { row: 9, col: 18 - step };
  }
}

/** Each arm's nest, the corner beside its entry square: its top-left cell (the nest is eight cells square). */
export const NEST_CORNER: readonly Cell[] = [
  { row: 11, col: 0 },
  { row: 0, col: 0 },
  { row: 0, col: 11 },
  { row: 11, col: 11 },
];

/** Where a pawn of an arm is drawn, its centre in cells: `pawn` places it in its nest or at home, and `stack` beside another on its square. */
export function pawnPoint(arm: number, progress: number, pawn: number, stack: number): { x: number; y: number } {
  if (progress === PACHISI_NEST) {
    const corner = NEST_CORNER[arm];
    return { x: corner.col + 2.5 + (pawn % 2) * 3, y: corner.row + 2.5 + Math.floor(pawn / 2) * 3 };
  }
  if (progress === PACHISI_HOME) {
    const toward = [
      { x: 9.5, y: 10.35 },
      { x: 8.65, y: 9.5 },
      { x: 9.5, y: 8.65 },
      { x: 10.35, y: 9.5 },
    ][arm];
    const spread = (pawn - 1.5) * 0.28;
    return arm % 2 === 0 ? { x: toward.x + spread, y: toward.y } : { x: toward.x, y: toward.y + spread };
  }
  const cell = progress <= PACHISI_LAST_TRACK ? TRACK_CELLS[squareOf(arm, progress)!] : homePathCell(arm, progress - PACHISI_LAST_TRACK);
  const shift = stack === 0 ? 0 : stack === 1 ? -0.2 : 0.2;
  return { x: cell.col + 0.5 + shift, y: cell.row + 0.5 + shift };
}
