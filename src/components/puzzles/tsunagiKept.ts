"use client";

import type { TsunagiFill, TsunagiMarks } from "./puzzles.constants";

/**
 * WHAT A BROWSER REMEMBERS OF TSUNAGI for somebody with no account: the
 * levels solved at each size, with the best time on each, whether they play
 * by colours or numbers, and whether a line's cells hold marbles. A member's solves are on the account
 * (`PuzzleSolve`) and read by the server; these sit beside them, so the board
 * of levels opens the next row the moment a level is solved, account or not.
 *
 * Every read and write is guarded: a private window or blocked storage reads
 * as nothing solved and remembers nothing, and the page still works.
 */
const SOLVED_KEY = (size: number) => `itsutsu.tsunagi.solved.${size}`;
const MARKS_KEY = "itsutsu.tsunagi.marks";
const FILL_KEY = "itsutsu.tsunagi.fill";

/** The levels this browser has solved at a size, each with its best time in milliseconds. */
export function keptSolves(size: number): Record<number, number> {
  try {
    const raw = window.localStorage.getItem(SOLVED_KEY(size));
    if (raw === null) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<number, number> = {};
    for (const [level, ms] of Object.entries(parsed as Record<string, unknown>)) {
      if (Number.isInteger(Number(level)) && typeof ms === "number" && ms >= 0) out[Number(level)] = ms;
    }
    return out;
  } catch {
    return {};
  }
}

/** Remembers a solve, keeping the better of two times on one level. */
export function keepSolveHere(size: number, level: number, elapsedMs: number): void {
  try {
    const kept = keptSolves(size);
    const before = kept[level];
    kept[level] = before === undefined ? elapsedMs : Math.min(before, elapsedMs);
    window.localStorage.setItem(SOLVED_KEY(size), JSON.stringify(kept));
  } catch {
    // Nowhere to keep it: the solve still stands on the page.
  }
}

export function keptMarks(): TsunagiMarks | null {
  try {
    const raw = window.localStorage.getItem(MARKS_KEY);
    return raw === "colours" || raw === "numbers" ? raw : null;
  } catch {
    return null;
  }
}

export function keepMarksHere(marks: TsunagiMarks): void {
  try {
    window.localStorage.setItem(MARKS_KEY, marks);
  } catch {
    // Remembered for the page only.
  }
}

export function keptFill(): TsunagiFill | null {
  try {
    const raw = window.localStorage.getItem(FILL_KEY);
    return raw === "marbles" || raw === "lines" ? raw : null;
  } catch {
    return null;
  }
}

export function keepFillHere(fill: TsunagiFill): void {
  try {
    window.localStorage.setItem(FILL_KEY, fill);
  } catch {
    // Remembered for the page only.
  }
}
