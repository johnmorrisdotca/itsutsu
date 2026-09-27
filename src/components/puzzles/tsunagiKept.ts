"use client";

import { TSUNAGI_RENUMBERED_AT } from "@/lib/puzzles/tsunagi/levels/renumbered.data";
import { renumberedRecord } from "@/lib/puzzles/tsunagi/renumber";

import type { TsunagiCheatsChoice, TsunagiExplosionsChoice, TsunagiFill, TsunagiMarks } from "./puzzles.constants";

/**
 * WHAT A BROWSER REMEMBERS OF TSUNAGI for somebody with no account: the
 * levels solved at each size, with the best time on each, how many times each
 * was started, whether they play by colours or numbers, and whether a line's
 * cells hold marbles. A member's solves and attempts are on the account
 * (`PuzzleSolve`, `TsunagiAttempt`) and read by the server; these sit beside
 * them, so the board
 * of levels opens the next row the moment a level is solved, account or not.
 *
 * Every read and write is guarded: a private window or blocked storage reads
 * as nothing solved and remembers nothing, and the page still works.
 */
/*
 * BY LEVEL NUMBER, IN THE NUMBERING OF ITS DATE. The levels were renumbered on
 * 2026-09-26, so a record under the old key names the old numbers: it is moved
 * to the new ones the first time it is read (`renumberedRecord`), written under
 * the new key, and the old one taken away.
 */
const SOLVED_KEY = (size: number) => `itsutsu.tsunagi.solved.${size}@${TSUNAGI_RENUMBERED_AT}`;
/* Levels solved only with their explosions off: solved, and opening no block (`solveHelp.ts`), so kept apart from the solves that do. */
const SOLVED_OFF_KEY = (size: number) => `itsutsu.tsunagi.solvedOff.${size}@${TSUNAGI_RENUMBERED_AT}`;
const ATTEMPTS_KEY = (size: number) => `itsutsu.tsunagi.attempts.${size}@${TSUNAGI_RENUMBERED_AT}`;
const BEFORE_RENUMBERING = { solved: (size: number) => `itsutsu.tsunagi.solved.${size}`, attempts: (size: number) => `itsutsu.tsunagi.attempts.${size}` };

/** The record under `key`, moving one kept before the renumbering to it first. Throws where storage does; the callers guard. */
function readRecord(key: string, before: string, size: number): unknown {
  const raw = window.localStorage.getItem(key);
  if (raw !== null) return JSON.parse(raw);
  const old = window.localStorage.getItem(before);
  if (old === null) return null;
  const parsed: unknown = JSON.parse(old);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const moved = renumberedRecord(size, parsed as Record<number, number>);
  window.localStorage.setItem(key, JSON.stringify(moved));
  window.localStorage.removeItem(before);
  return moved;
}

const MARKS_KEY = "itsutsu.tsunagi.marks";
const FILL_KEY = "itsutsu.tsunagi.fill";
const EXPLOSIONS_KEY = "itsutsu.tsunagi.explosions";
const CHEATS_KEY = "itsutsu.tsunagi.cheats";

/** The levels this browser has solved at a size, each with its best time in milliseconds. */
export function keptSolves(size: number): Record<number, number> {
  try {
    const parsed = readRecord(SOLVED_KEY(size), BEFORE_RENUMBERING.solved(size), size);
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

/** The levels this browser has solved at a size only with their explosions off: solved, and opening no block. */
export function keptSolvesOff(size: number): Record<number, number> {
  try {
    const raw = window.localStorage.getItem(SOLVED_OFF_KEY(size));
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
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

/**
 * Remembers a solve, keeping the better of two times on one level: with the
 * solves that open blocks, or — `opens` false, explosions off — apart from them.
 */
export function keepSolveHere(size: number, level: number, elapsedMs: number, opens = true): void {
  try {
    const key = opens ? SOLVED_KEY(size) : SOLVED_OFF_KEY(size);
    const kept = opens ? keptSolves(size) : keptSolvesOff(size);
    const before = kept[level];
    kept[level] = before === undefined ? elapsedMs : Math.min(before, elapsedMs);
    window.localStorage.setItem(key, JSON.stringify(kept));
  } catch {
    // Nowhere to keep it: the solve still stands on the page.
  }
}

/** How many times this browser has started each level of a size, for somebody with no account. */
export function keptAttempts(size: number): Record<number, number> {
  try {
    const parsed = readRecord(ATTEMPTS_KEY(size), BEFORE_RENUMBERING.attempts(size), size);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<number, number> = {};
    for (const [level, count] of Object.entries(parsed as Record<string, unknown>)) {
      if (Number.isInteger(Number(level)) && typeof count === "number" && Number.isInteger(count) && count > 0) out[Number(level)] = count;
    }
    return out;
  } catch {
    return {};
  }
}

/** One more attempt at a level, remembered here; the count it now stands at (counted for the page even where nothing can be kept). */
export function keepAttemptHere(size: number, level: number): number {
  let kept: Record<number, number> = {};
  try {
    kept = keptAttempts(size);
    kept[level] = (kept[level] ?? 0) + 1;
    window.localStorage.setItem(ATTEMPTS_KEY(size), JSON.stringify(kept));
  } catch {
    kept[level] = kept[level] ?? 1;
  }
  return kept[level]!;
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

export function keptExplosions(): TsunagiExplosionsChoice | null {
  try {
    const raw = window.localStorage.getItem(EXPLOSIONS_KEY);
    return raw === "on" || raw === "soft" || raw === "off" ? raw : null;
  } catch {
    return null;
  }
}

export function keepExplosionsHere(choice: TsunagiExplosionsChoice): void {
  try {
    window.localStorage.setItem(EXPLOSIONS_KEY, choice);
  } catch {
    // Remembered for the page only.
  }
}

export function keptCheats(): TsunagiCheatsChoice | null {
  try {
    const raw = window.localStorage.getItem(CHEATS_KEY);
    return raw === "off" || raw === "allowed" ? raw : null;
  } catch {
    return null;
  }
}

export function keepCheatsHere(choice: TsunagiCheatsChoice): void {
  try {
    window.localStorage.setItem(CHEATS_KEY, choice);
  } catch {
    // Remembered for the page only.
  }
}
