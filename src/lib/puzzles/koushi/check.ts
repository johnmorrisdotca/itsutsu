import { isWord, type GomojiLanguage } from "../gomoji/code";
import type { PuzzleCheck, PuzzleLevel } from "../puzzles.types";
import {
  LATTICE_SIDE,
  LETTER_CELLS,
  SPARE_SWAPS,
  decodeGivens,
  decodePlay,
  isSolved,
  replay,
  swapsAllowed,
  wordsOf,
  type KoushiGivens,
  type KoushiPlay,
} from "./lattice";

/**
 * THE SERVER'S CHECK OF A KOUSHI, O(cells + swaps), no search.
 *
 * The answer is the grid as it ended and every swap made. The swaps are played
 * again from the scramble in the givens, and must make exactly the grid
 * written; there must be no more of them than the level allows; and, for a
 * solve, the grid must be the solution, whose six words must all be words of
 * the list. So a grid handed in cannot be one the swaps did not make, a solve
 * cannot claim fewer swaps than it took, and a puzzle made up in a browser to
 * be easy cannot pass unless its six words are real ones.
 *
 * "spent" is the other ending: every swap the level gives made, and the grid
 * still not the solution — the puzzle over, unsolved, as Gomoji's word is when
 * its guesses run out.
 */
export function checkKoushi(
  size: number,
  givens: string,
  answer: string,
  ending: "found" | "spent",
  level: PuzzleLevel | undefined,
  lang: GomojiLanguage = "en",
): PuzzleCheck {
  if (size !== LATTICE_SIDE) return { ok: false, reason: `a lattice is ${LATTICE_SIDE} across` };
  const asked = decodeGivens(givens);
  if (asked === null) return { ok: false, reason: "the givens are not a scrambled lattice and its solution" };
  const played = decodePlay(answer);
  if (played === null) return { ok: false, reason: "the answer is not a lattice and its swaps" };
  if (level === undefined) return { ok: false, reason: "no level to count the swaps by" };
  const unknown = wordsOf(asked.solution).find((word) => !isWord(word, LATTICE_SIDE, lang));
  if (unknown !== undefined) return { ok: false, reason: `${unknown} is not in the word list` };
  const allowed = swapsAllowed(level);
  if (played.swaps.length > allowed) return { ok: false, reason: "more swaps than the level allows" };
  const made = replay(asked.scramble, played.swaps);
  if (LETTER_CELLS.some((cell) => made[cell] !== played.grid[cell])) return { ok: false, reason: "the swaps do not make that grid" };
  const solved = isSolved(played.grid, asked.solution);
  if (ending === "found") return solved ? { ok: true } : { ok: false, reason: "the grid is not the solution" };
  if (solved) return { ok: false, reason: "the grid was solved" };
  return played.swaps.length === allowed ? { ok: true } : { ok: false, reason: "there are swaps left" };
}

/** A kept answer read back, with its givens: null for either not being a Koushi's. */
export function readKoushi(givens: string, answer: string | null): { asked: KoushiGivens; played: KoushiPlay } | null {
  const asked = decodeGivens(givens);
  const played = answer === null ? null : decodePlay(answer);
  return asked === null || played === null ? null : { asked, played };
}

/*
 * WHAT A KOUSHI SCORES ON ITS LEADERBOARD. Fewest swaps first, then time:
 * a solve is 500, and 100 for every swap left unused (five at best, the five
 * marks), and a time bonus of 99 less one a ten seconds, never below nought —
 * never worth a swap, so a solve with a swap to spare always outranks a
 * faster one without. A puzzle played out unsolved scores 5 for every letter
 * it left green, at most 100: less than any solve.
 */
export const KOUSHI_SOLVED_POINTS = 500;
export const KOUSHI_SPARE_POINTS = 100;
export const KOUSHI_TIME_POINTS = 99;
export const KOUSHI_GREEN_POINTS = 5;

/** Swaps left unused at the end, and how many the level gave to be left: the marks at the end, as many as five. */
export function sparesOf(level: PuzzleLevel, used: number): { spare: number; most: number } {
  return { spare: Math.max(0, swapsAllowed(level) - used), most: SPARE_SWAPS };
}

export function koushiPoints(givens: string, answer: string, elapsedMs: number, level: PuzzleLevel | undefined): number {
  const read = readKoushi(givens, answer);
  if (read === null || level === undefined) return 0;
  const { asked, played } = read;
  if (!isSolved(played.grid, asked.solution)) {
    return KOUSHI_GREEN_POINTS * LETTER_CELLS.filter((cell) => played.grid[cell] === asked.solution[cell]).length;
  }
  const { spare } = sparesOf(level, played.swaps.length);
  const time = Math.max(0, KOUSHI_TIME_POINTS - Math.floor(elapsedMs / 10_000));
  return KOUSHI_SOLVED_POINTS + KOUSHI_SPARE_POINTS * Math.min(spare, SPARE_SWAPS) + time;
}

/** How many swaps a kept Koushi took, out of how many its level gave: 11 of 15. Null for anything unreadable. */
export function swapsTaken(level: string, givens: string, answer: string | null): { used: number; allowed: number } | null {
  const read = readKoushi(givens, answer);
  if (read === null || !(level === "easy" || level === "medium" || level === "hard")) return null;
  return { used: read.played.swaps.length, allowed: swapsAllowed(level) };
}
