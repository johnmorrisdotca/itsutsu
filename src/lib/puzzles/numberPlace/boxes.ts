/**
 * Where the boxes are on a Number Place grid.
 *
 * A 9×9 has 3×3 boxes and a 4×4 has 2×2; a 6×6 has boxes two rows tall and
 * three columns wide, which is the one people get wrong and the reason this
 * is a table rather than a square root.
 */
export type Boxes = { rows: number; cols: number };

export const NUMBER_PLACE_BOXES: Record<number, Boxes> = {
  4: { rows: 2, cols: 2 },
  6: { rows: 2, cols: 3 },
  9: { rows: 3, cols: 3 },
  16: { rows: 4, cols: 4 },
};

/** The box a cell is in, numbered row-major from 0. */
export function boxOf(size: number, index: number): number {
  const boxes = NUMBER_PLACE_BOXES[size];
  const row = Math.floor(index / size);
  const col = index % size;
  return Math.floor(row / boxes.rows) * (size / boxes.cols) + Math.floor(col / boxes.cols);
}
