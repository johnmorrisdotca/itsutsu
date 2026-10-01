"use client";

import { suidoLevelOfBoard, suidoLevelsLoaded } from "@/lib/puzzles/suido/levels";

/**
 * WHAT A BROWSER REMEMBERS OF SUIDO'S LEVELS for somebody with no account: the
 * levels solved at each size, with the best time on each. A member's solves are
 * on the account (`PuzzleSolve`) and read by the server (`suidoSolvedBy`); these
 * sit beside them, so the board of levels opens the next block the moment a level
 * is solved, account or not.
 *
 * KEPT BY THE BOARD, NOT BY ITS NUMBER: a solve is the level's board code and
 * its time, so a level renumbered or a size's levels added to later keeps every
 * solve a browser holds, as the account's solves (kept by their givens) do. The
 * numbers are found when the size's levels are loaded, and not before: without
 * them there is nothing to say which level a board is, and nothing is guessed.
 *
 * Every read and write is guarded: a private window or blocked storage reads as
 * nothing solved and remembers nothing, and the page still works.
 */
const KEY = (size: number) => `itsutsu.suido.solved.${size}`;

/** The boards this browser has solved at a size, each with its best time in milliseconds. */
function keptBoards(size: number): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(KEY(size));
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, number> = {};
    for (const [board, ms] of Object.entries(parsed as Record<string, unknown>)) if (typeof ms === "number" && ms >= 0) out[board] = ms;
    return out;
  } catch {
    return {};
  }
}

/** The levels this browser has solved at a size, each with its best time: none until the size's levels are loaded. */
export function keptSolves(size: number): Record<number, number> {
  if (!suidoLevelsLoaded(size)) return {};
  const out: Record<number, number> = {};
  for (const [board, ms] of Object.entries(keptBoards(size))) {
    const level = suidoLevelOfBoard(size, board);
    if (level !== null) out[level] = ms;
  }
  return out;
}

/** Remembers a solve of a level's board, keeping the better of two times on it. */
export function keepSolveHere(size: number, board: string, elapsedMs: number): void {
  try {
    const kept = keptBoards(size);
    const before = kept[board];
    kept[board] = before === undefined ? elapsedMs : Math.min(before, elapsedMs);
    window.localStorage.setItem(KEY(size), JSON.stringify(kept));
  } catch {
    // Nowhere to keep it: the solve still stands on the page.
  }
}
