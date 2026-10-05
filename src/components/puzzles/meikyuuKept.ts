"use client";

import { meikyuuLevelOfBoard, meikyuuLevelsLoaded } from "@/lib/puzzles/meikyuu/levels";

/**
 * WHAT A BROWSER REMEMBERS OF MEIKYUU'S LEVELS for somebody with no account: the
 * mazes solved, with the best time on each. A member's solves are on the
 * account (`PuzzleSolve`) and read by the server (`meikyuuSolvedBy`); these sit
 * beside them, so the board of levels shows a level solved the moment it is,
 * account or not.
 *
 * KEPT BY THE MAZE, NOT BY ITS NUMBER: a solve is the level's recipe and its time,
 * so a size's levels added to later keep every solve a browser holds, as the
 * account's solves (kept by their givens) do. The numbers are found when the
 * levels are loaded, and not before: without them there is nothing to say which
 * level a maze is, and nothing is guessed.
 *
 * Every read and write is guarded: a private window or blocked storage reads as
 * nothing solved and remembers nothing, and the page still works.
 */
const KEY = "itsutsu.meikyuu.solved";

/** The mazes this browser has solved, each with its best time in milliseconds. */
function keptMazes(): Record<string, number> {
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

/** The levels this browser has solved at a size, each with its best time: none until the levels are loaded. */
export function keptSolves(size: number): Record<number, number> {
  if (!meikyuuLevelsLoaded(size)) return {};
  const out: Record<number, number> = {};
  for (const [code, ms] of Object.entries(keptMazes())) {
    const level = meikyuuLevelOfBoard(size, code);
    if (level !== null) out[level] = ms;
  }
  return out;
}

/** Remembers a solve of a level's maze, keeping the better of two times on it. */
export function keepSolveHere(code: string, elapsedMs: number): void {
  try {
    const kept = keptMazes();
    const before = kept[code];
    kept[code] = before === undefined ? elapsedMs : Math.min(before, elapsedMs);
    window.localStorage.setItem(KEY, JSON.stringify(kept));
  } catch {
    // Nowhere to keep it: the solve still stands on the page.
  }
}
