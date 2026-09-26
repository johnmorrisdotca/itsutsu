import { hexagonFit, HEX_LATTICE, type LatticeFit } from "@/components/board/Board.constants";

/**
 * WHERE A TSUNAGI HEXAGON'S CELLS ARE ON THE SCREEN. The board is drawn as
 * Hexversi's is: the square of cells sheared into the honeycomb lattice and
 * fitted to the box by the hexagon it holds (`hexagonFit`), so the same
 * transform places the lines, the cells and their outlines. A finger's point
 * is found the other way: the fit undone, then the shear, then rounded to the
 * nearest cell centre on the lattice, so every point of a hexagon — its
 * corners too — is that hexagon's.
 */
export function tsunagiHexFit(size: number): LatticeFit {
  return hexagonFit(size);
}

/** The cell under a point, given as fractions of the board's box (0 to 1 across and down); null off the square. */
export function hexCellAt(size: number, fit: LatticeFit, x: number, y: number): number | null {
  // Undo the fit's translate and scale, then the slant: skewX(30°) after scaleY(cos 30°).
  const u = (x - fit.left) / fit.scale;
  const v = (y - fit.top) / fit.scale;
  const down = v / HEX_LATTICE.height;
  const across = u - down / 2;
  // In cells, from the middle of the first: axial coordinates q (column) and r (row).
  const q = across * size - 0.5;
  const r = down * size - 0.5;
  // Rounded as cube coordinates, the one rounding that lands in the nearest hexagon.
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const [dq, dr, ds] = [Math.abs(rq - q), Math.abs(rr - r), Math.abs(rs - s)];
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  if (rq < 0 || rr < 0 || rq >= size || rr >= size) return null;
  return rr * size + rq;
}

/** A cell's centre as fractions of the board's box: where a finger aims to press it. */
export function hexCellCentre(size: number, fit: LatticeFit, at: number): { x: number; y: number } {
  const a = ((at % size) + 0.5) / size;
  const b = (Math.floor(at / size) + 0.5) / size;
  return { x: fit.left + fit.scale * (a + b / 2), y: fit.top + fit.scale * HEX_LATTICE.height * b };
}
