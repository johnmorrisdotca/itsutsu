import { seededRandom, DAILY_SEED_BLOCK, SEED_MOST } from "../random";
import type { Puzzle, PuzzleLevel } from "../puzzles.types";

import { dealOfSeed, deckOf, encodeMoves } from "./code";
import { dealKlondike } from "./klondike";
import { solveKlondike } from "./solve";
import type { KlondikeRules } from "./solitaire.types";

/**
 * A SOLITAIRE DEAL FROM A SEED, as every puzzle is made: in the browser, the
 * same in every browser.
 *
 * What the set-up's two words mean, in code:
 * - `size` is how many cards the stock turns at a time, 1 or 3 (the set-up's
 *   "Draw 1" and "Draw 3" tiles);
 * - `level` is how many times through the stock: easy as many as you like,
 *   medium three, hard one (`SOLITAIRE_PASSES`).
 *
 * TWO KINDS OF DEAL, told apart by the seed itself, as the daily words are:
 * - WINNABLE (every seed below `ANY_DEAL_BLOCK`): the deal is the first one,
 *   from this seed on, that the solver wins under these rules; the puzzle's
 *   seed is that deal's, and its solution the solver's line. A player may
 *   still lose it, and never because it could not be won.
 * - ANY DEAL (`ANY_DEAL_BLOCK`): the shuffle of the seed, as it falls, which
 *   may have no way out — Klondike as it is played with a real deck. Its
 *   solution is left empty: nothing has looked.
 * Either way the deal of a puzzle is the plain shuffle of its seed
 * (`dealOfSeed`), so the server checks a finished game against its seed in
 * one pass, with no search.
 */

/** Easy, medium and hard: as many passes through the stock as you like, three, or one. */
export const SOLITAIRE_PASSES: Record<PuzzleLevel, number> = { easy: Infinity, medium: 3, hard: 1 };

/** The seeds of deals dealt as they fall, winnable or not: the top quarter of the range, clear of the daily words' block. */
export const ANY_DEAL_BLOCK = { from: 1_600_000_000, size: SEED_MOST - 1_600_000_000 + 1 } as const;

/**
 * The tables the solver looks at before it gives a deal up as not known to be
 * winnable (`solveKlondike`): a count, so every browser agrees.
 *
 * PART OF WHAT A SEED MEANS. Which deal a winnable seed names depends on it, so
 * changing it changes the deal behind every kept run, race and daily deal made
 * since. Measured 2026-09-29 on a busy desk, thirty seeds a setting: at 4,000 a
 * winnable deal takes a tenth of a second on average to find at every setting
 * but draw one with one pass, which takes about half a second and at worst two;
 * at 20,000 that one averaged two seconds and took eight at worst, for about one
 * more deal in sixty found.
 */
export const SOLVER_BUDGET = 4000;

/** How many deals the winnable search looks at before it stops; far past anything the measured rules need (`generate.test.ts`). */
const MOST_TRIED = 400;

export function solitaireRules(size: number, level: PuzzleLevel): KlondikeRules {
  return { draw: size === 3 ? 3 : 1, passes: SOLITAIRE_PASSES[level] };
}

export function isAnyDeal(seed: number): boolean {
  return seed >= ANY_DEAL_BLOCK.from;
}

/**
 * A new seed for a game nobody asked for by number, drawn in the browser: in
 * the any-deal block for a deal as it falls, below it (and clear of the daily
 * words' block) for a winnable one.
 */
export function freshSolitaireSeed(anyDeal: boolean, random: () => number = Math.random): number {
  if (anyDeal) return ANY_DEAL_BLOCK.from + Math.floor(random() * ANY_DEAL_BLOCK.size);
  return spread(random());
}

/** A number in [0, 1) as a winnable seed: from 1 to below the any-deal block, stepping over the daily words' block. */
function spread(unit: number): number {
  const drawn = Math.floor(unit * (ANY_DEAL_BLOCK.from - 1 - DAILY_SEED_BLOCK.size)) + 1;
  return drawn >= DAILY_SEED_BLOCK.from ? drawn + DAILY_SEED_BLOCK.size : drawn;
}

/**
 * The seeds the winnable search tries after this one, in a fixed order: not
 * the next numbers, which are tomorrow's daily seed and the day after's, but
 * numbers drawn from this one, below the any-deal block and outside the daily
 * words' block.
 */
function nextTry(seed: number, tried: number): number {
  return spread(seededRandom(seed * 31 + tried)());
}

/** The solver's winning line for a seed's deal under these rules, written as moves, or null. */
export function winningLine(seed: number, rules: KlondikeRules): string | null {
  const deck = deckOf(dealOfSeed(seed))!;
  const found = solveKlondike(dealKlondike(deck, rules), SOLVER_BUDGET).moves;
  return found === null ? null : encodeMoves(found);
}

export function generateSolitaire(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const rules = solitaireRules(size, level);
  const made = (at: number, solution: string): Puzzle => ({ kind: "solitaire", size, level, seed: at, givens: dealOfSeed(at), solution });
  if (isAnyDeal(seed)) return made(seed, "");
  let at = seed;
  for (let tried = 0; tried < MOST_TRIED; tried += 1) {
    const line = winningLine(at, rules);
    if (line !== null) return made(at, line);
    at = nextTry(seed, tried);
  }
  throw new Error(`No winnable Klondike deal found from seed ${seed} at draw ${rules.draw}, ${rules.passes} passes.`);
}
