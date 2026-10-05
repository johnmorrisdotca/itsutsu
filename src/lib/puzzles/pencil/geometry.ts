import type { AnyPencilKind } from "./pencil.types";

/**
 * WHERE THINGS ARE IN KAZU'S DRAWINGS, so a press on one can be read as a cell
 * or an edge: each is an SVG with a `viewBox` that starts `pad` before the board,
 * and a cell `unit` across. Read off the package's drawings (`drawShikaku` and
 * the rest); `geometry.test.ts` holds each against the drawing itself, so a new
 * version of Kazu that moves its grid fails there and not in a reader's thumb.
 */
export const PENCIL_GEOMETRY: Record<AnyPencilKind, { unit: number; pad: number }> = {
  shikaku: { unit: 48, pad: 2 },
  akari: { unit: 48, pad: 2 },
  slitherlink: { unit: 48, pad: 4 },
  hitori: { unit: 52, pad: 2 },
  regions: { unit: 48, pad: 2 },
  crossSums: { unit: 56, pad: 0 },
};

/** A point as the board's own units: `x` and `y` across and down the SVG, as fractions of its width and height. */
export type Fraction = { x: number; y: number };

/** The cell under a point, or null for one outside the board. */
export function cellAt(kind: AnyPencilKind, size: number, point: Fraction): number | null {
  const { unit, pad } = PENCIL_GEOMETRY[kind];
  const whole = size * unit + 2 * pad;
  const u = point.x * whole - pad;
  const v = point.y * whole - pad;
  const column = Math.floor(u / unit);
  const row = Math.floor(v / unit);
  if (column < 0 || row < 0 || column >= size || row >= size) return null;
  return row * size + column;
}

/**
 * The edge a press means on a Slitherlink board: of the cell under it, the side
 * it is nearest, so every press lands on an edge and there is no dead place to
 * miss in. Horizontal edges are numbered first and then vertical ones, each in
 * reading order, as Kazu numbers them (`slitherlinkCellEdges`).
 */
export function edgeAt(size: number, point: Fraction): number | null {
  const { unit, pad } = PENCIL_GEOMETRY.slitherlink;
  const whole = size * unit + 2 * pad;
  const u = point.x * whole - pad;
  const v = point.y * whole - pad;
  const column = Math.floor(u / unit);
  const row = Math.floor(v / unit);
  if (column < 0 || row < 0 || column >= size || row >= size) return null;
  const left = u - column * unit;
  const top = v - row * unit;
  const nearest = Math.min(left, unit - left, top, unit - top);
  const horizontal = size * (size + 1);
  if (nearest === top) return row * size + column;
  if (nearest === unit - top) return (row + 1) * size + column;
  if (nearest === left) return horizontal + row * (size + 1) + column;
  return horizontal + row * (size + 1) + column + 1;
}
