import { pointName } from "@/lib/gomoku/notation";
import type { Point } from "@/lib/gomoku/gomoku.types";

/**
 * HOW A RECORD'S MOVES ARE WRITTEN FOR READING, in the formats this site
 * already reads when a list is pasted (`readMoves.ts`).
 *
 * John, 2026-09-25: "currently we display in our format, 1 F5 / 2 G7 etc…
 * IYT is 1. f6 g7 / 2. g6 h6… We should have a tertiary button that offers to
 * display in all the known formats we support, and save to memory. Call our
 * format name, then use generic format names for the others like IYT and GT if
 * they are different." Three, because those are the three that differ:
 *
 *  - OURS: one move a line, `F6`, columns skipping I and rows from the bottom.
 *  - ITSYOURTURN'S: two moves a line, `1. f6 g7`, lower case, columns WITH i,
 *    rows from the bottom.
 *  - GOLDTOKEN'S: two moves a line, `1 H8 I9`, capitals, columns WITH I, rows
 *    counted from the TOP, as its board is numbered along the top edge.
 *
 * Each is checked by reading it back (`moveFormats.test.ts`), so what is shown
 * is exactly what the paste box would take.
 */
export const MOVE_FORMAT_CHOICES = ["itsutsu", "itsYourTurn", "goldToken"] as const;
export type MoveFormatChoice = (typeof MOVE_FORMAT_CHOICES)[number];

export const MOVE_FORMAT_DISPLAY: Record<MoveFormatChoice, { label: string; example: string; pairs: boolean }> = {
  itsutsu: { label: "Itsutsu", example: "1 F6", pairs: false },
  itsYourTurn: { label: "IYT style", example: "1. f6 g7", pairs: true },
  goldToken: { label: "GT style", example: "1 F6 G7", pairs: true },
};

/** Columns WITH the letter I, as both other sites write them. */
const WITH_I = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** One point in one format, on a board of this size. */
export function pointIn(format: MoveFormatChoice, size: number, point: Point): string {
  if (format === "itsutsu") return pointName(size, point);
  const column = WITH_I[point.col] ?? "?";
  if (format === "itsYourTurn") return `${column.toLowerCase()}${size - point.row}`;
  return `${column}${point.row + 1}`;
}

/**
 * The line numbers and what goes on each line: one move a line in ours, two in
 * the paired formats, where line N holds moves 2N-1 and 2N.
 */
export function linesOf<T>(format: MoveFormatChoice, moves: readonly T[]): { number: number; moves: { move: T; index: number }[] }[] {
  const step = MOVE_FORMAT_DISPLAY[format].pairs ? 2 : 1;
  const lines: { number: number; moves: { move: T; index: number }[] }[] = [];
  for (let at = 0; at < moves.length; at += step) {
    lines.push({
      number: at / step + 1,
      moves: moves.slice(at, at + step).map((move, offset) => ({ move, index: at + offset })),
    });
  }
  return lines;
}

/** Whether a stored value is one of the formats, for reading it off an account. */
export function isMoveFormat(value: unknown): value is MoveFormatChoice {
  return typeof value === "string" && (MOVE_FORMAT_CHOICES as readonly string[]).includes(value);
}
