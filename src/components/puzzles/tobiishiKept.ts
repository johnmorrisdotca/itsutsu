"use client";

import { tobiishiLevelOfBoard } from "@/lib/puzzles/tobiishi/levels";

/**
 * WHAT A BROWSER REMEMBERS OF TOBIISHI'S LEVELS for somebody with no account: the
 * levels solved, with the best time on each. A member's solves are on the account
 * (`PuzzleSolve`) and read by the server (`tobiishiSolvedBy`); these sit beside
 * them, so the board of levels shows a level solved the moment it is, account or not.
 *
 * KEPT BY THE LEVEL'S CODE, NOT BY ITS NUMBER (`english:centre:3`): a solve is the
 * code and its time, so a board added to the package later keeps every solve a browser
 * holds, as the account's solves (kept by their givens) do.
 *
 * Every read and write is guarded: a private window or blocked storage reads as
 * nothing solved and remembers nothing, and the page still works.
 */
const KEY = "itsutsu.tobiishi.solved";

/** The levels this browser has solved, each with its best time in milliseconds. */
function keptLevels(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, number> = {};
    for (const [code, ms] of Object.entries(parsed as Record<string, unknown>)) if (typeof ms === "number" && ms >= 0) out[code] = ms;
    return out;
  } catch {
    return {};
  }
}

/** The levels this browser has solved at a length, each with its best time. */
export function keptSolves(size: number): Record<number, number> {
  const out: Record<number, number> = {};
  for (const [code, ms] of Object.entries(keptLevels())) {
    const level = tobiishiLevelOfBoard(size, code);
    if (level !== null) out[level] = ms;
  }
  return out;
}

/** Remembers a solve of a level, keeping the better of two times on it. */
export function keepSolveHere(code: string, elapsedMs: number): void {
  try {
    const kept = keptLevels();
    const before = kept[code];
    kept[code] = before === undefined ? elapsedMs : Math.min(before, elapsedMs);
    window.localStorage.setItem(KEY, JSON.stringify(kept));
  } catch {
    // Nowhere to keep it: the solve still stands on the page.
  }
}
