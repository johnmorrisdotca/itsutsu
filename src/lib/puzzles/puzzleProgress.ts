import { decodeBlackAndWhite, encodeBlackAndWhite } from "./blackAndWhite/code";
import { decodeGuesses, rowsFor } from "./wordDrop/code";
import { decodeKanaGuesses, KANA_ROWS } from "./wordDropKana/kanaCode";
import { decodeCells, encodeCells } from "./puzzleCode";
import type { PuzzleKind } from "./puzzles.types";

/**
 * What has been written on an unfinished puzzle, as one character a cell — what
 * a kept run holds (`PuzzleRun.progress`) and a solve screen reads back.
 *
 * A grid of numbers writes its entries the way a puzzle's cells are written
 * (`puzzleCode.ts`), givens left empty. A grid of stones writes "." for an
 * empty cell, "s" for a stone and "x" for a cross. Black and White writes its
 * whole grid as its code does, printed stones included: "b", "w" and ".".
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

export function encodeBlackAndWhiteProgress(stones: readonly number[]): string {
  return encodeBlackAndWhite(stones);
}

export function decodeBlackAndWhiteProgress(code: string, size: number): number[] | null {
  return decodeBlackAndWhite(code, size);
}

/** WordDrop writes its guesses so far, run together in lower case, as its answer is written. */
export function encodeWordDropProgress(guesses: readonly string[]): string {
  return guesses.join("");
}

export function decodeWordDropProgress(code: string, size: number): string[] | null {
  const guesses = decodeGuesses(code, size);
  return guesses !== null && guesses.length <= rowsFor(size) ? guesses : null;
}

/** Whether a progress code is one a puzzle of this kind and size could have written. */
/** A kana WordDrop writes its guesses as English does, run together, in hiragana. */
export function encodeKanaProgress(guesses: readonly string[]): string {
  return guesses.join("");
}

export function decodeKanaProgress(code: string, size: number): string[] | null {
  if (code === "") return [];
  const guesses = decodeKanaGuesses(code, size);
  return guesses !== null && guesses.length <= KANA_ROWS ? guesses : null;
}

export function progressFits(kind: PuzzleKind, size: number, code: string): boolean {
  if (kind === "hiddenStones") return decodeStoneProgress(code, size) !== null;
  if (kind === "blackAndWhite") return decodeBlackAndWhiteProgress(code, size) !== null;
  if (kind === "wordDrop") return decodeWordDropProgress(code, size) !== null;
  if (kind === "wordDropKana") return decodeKanaProgress(code, size) !== null;
  return decodeNumberProgress(code, size) !== null;
}
