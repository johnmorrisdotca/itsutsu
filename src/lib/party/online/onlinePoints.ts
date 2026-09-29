// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { Point } from "../../gomoku/gomoku.types";

/** A point as a browser sent it: two whole numbers inside a board of this side, or null. */
export function readPoint(sent: unknown, side: number): Point | null {
  if (typeof sent !== "object" || sent === null) return null;
  const { row, col } = sent as { row?: unknown; col?: unknown };
  if (!Number.isInteger(row) || !Number.isInteger(col)) return null;
  const point = { row: row as number, col: col as number };
  return point.row >= 0 && point.col >= 0 && point.row < side && point.col < side ? point : null;
}
