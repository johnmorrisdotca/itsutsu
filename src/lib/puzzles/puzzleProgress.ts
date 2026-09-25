import { decodeCells, encodeCells } from "./puzzleCode";
import type { PuzzleKind } from "./puzzles.types";

/**
 * What has been written on an unfinished puzzle, as one character a cell — what
 * a kept run holds (`PuzzleRun.progress`) and a solve screen reads back.
 *
 * A grid of numbers writes its entries the way a puzzle's cells are written
 * (`puzzleCode.ts`), givens left empty. A grid of stones writes "." for an
 * empty cell, "s" for a stone and "x" for a cross.
 */
export type StoneMarkCode = "" | "stone" | "cross";

const STONE_CHARS: Record<StoneMarkCode, string> = { "": ".", stone: "s", cross: "x" };

export function encodeNumberProgress(entries: readonly number[]): string {
  return encodeCells(entries);
}

export function decodeNumberProgress(code: string, size: number): number[] | null {
  return code.length === size * size ? decodeCells(code, size) : null;
}

export function encodeStoneProgress(marks: readonly StoneMarkCode[]): string {
  return marks.map((mark) => STONE_CHARS[mark]).join("");
}

export function decodeStoneProgress(code: string, size: number): StoneMarkCode[] | null {
  if (code.length !== size * size) return null;
  const marks: StoneMarkCode[] = [];
  for (const char of code) {
    if (char === ".") marks.push("");
    else if (char === "s") marks.push("stone");
    else if (char === "x") marks.push("cross");
    else return null;
  }
  return marks;
}

/** Whether a progress code is one a puzzle of this kind and size could have written. */
export function progressFits(kind: PuzzleKind, size: number, code: string): boolean {
  return kind === "hiddenStones" ? decodeStoneProgress(code, size) !== null : decodeNumberProgress(code, size) !== null;
}
