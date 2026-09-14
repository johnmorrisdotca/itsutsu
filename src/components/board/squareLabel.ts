import { BLOCKED, HOT, STONE_DISPLAY, WORM } from "@/lib/gomoku/gomoku.constants";
import { pointName } from "@/lib/gomoku/notation";
import type { Cell, Point } from "@/lib/gomoku/gomoku.types";

/**
 * The accessible name of one square: where it is, and what stands on it —
 * "H8, empty", "H8, Black stone", "B8, White king".
 *
 * A crowned piece is named a king. It used to be drawn as a second ring on the
 * stone and named a stone like any other, so a reader who could not see the
 * ring could not tell a king from a man, and nor could a test. The ring is
 * still drawn; the name now says what the ring means.
 */
export function squareLabel(
  size: number,
  point: Point,
  cell: Cell,
  facts: { forbidden: boolean; king: boolean },
): string {
  return `${pointName(size, point)}, ${describe(cell, facts)}`;
}

function describe(cell: Cell, { forbidden, king }: { forbidden: boolean; king: boolean }): string {
  if (cell === BLOCKED) return "blocked";
  if (cell === HOT) return "hotspot";
  if (cell === WORM) return "wormhole";
  if (cell === null) return forbidden ? "forbidden" : "empty";
  return `${STONE_DISPLAY[cell].label} ${king ? "king" : "stone"}`;
}
