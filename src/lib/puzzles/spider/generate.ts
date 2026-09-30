import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { nextWinnableTry } from "../winnableSeed";

import { dealSpider, encodeMoves, solveSpider, spiderDealOfSeed, spiderDeckOf } from "@johnmorrisdotca/toranpu/spider";

/**
 * A SPIDER DEAL FROM A SEED, as every puzzle is made: in the browser, the same
 * in every browser.
 *
 * `size` is how many suits the two decks are made of: one (eight sets of
 * spades), two (spades and hearts) or four. There is one level: the suits are
 * how hard it is.
 *
 * The deal is the first one, from this seed on, in a fixed order of tries
 * (`nextWinnableTry`), that the solver wins, and its solution is the solver's
 * line — so every deal here can be won, and the address is put right to name
 * the deal's own seed (`PuzzlePlay`). The deal is the plain shuffle of its seed
 * at its suits (`spiderDealOfSeed`), so the server checks a finished game
 * against its seed in one pass.
 */

/**
 * The tables the solver looks at before it gives a deal up (`solveSpider`): a
 * count, so every browser agrees. PART OF WHAT A SEED MEANS. Measured
 * 2026-09-30 over twenty seeds: it wins all twenty deals of one suit, sixteen
 * of two and five of four, and gives one up in about a quarter of a second,
 * so a winnable four-suit deal takes about a second to find. The four-suit
 * deals it wins are the kinder ones: a hard deal it cannot finish is never dealt.
 */
export const SPIDER_BUDGET = 15_000;

/** How many deals the search looks at before it stops: far past anything four suits need. */
const MOST_TRIED = 200;

/** The solver's winning line for a seed's deal at so many suits, written as moves, or null. */
export function spiderLine(seed: number, suits: number): string | null {
  const found = solveSpider(dealSpider(spiderDeckOf(spiderDealOfSeed(seed, suits), suits)!), SPIDER_BUDGET).moves;
  return found === null ? null : encodeMoves(found);
}

export function generateSpider(size: number, level: PuzzleLevel, seed: number): Puzzle {
  let at = seed;
  for (let tried = 0; tried < MOST_TRIED; tried += 1) {
    const line = spiderLine(at, size);
    if (line !== null) return { kind: "spider", size, level, seed: at, givens: spiderDealOfSeed(at, size), solution: line };
    at = nextWinnableTry(seed, tried);
  }
  throw new Error(`No winnable Spider deal found from seed ${seed} with ${size} suits.`);
}
