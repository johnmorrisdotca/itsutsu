import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { nextWinnableTry } from "../winnableSeed";

import { dealOfSeed, deckOf, encodeMoves } from "./code";
import { dealFreeCell } from "./rules";
import { solveFreeCell } from "./solve";

/**
 * A FREECELL DEAL FROM A SEED, as every puzzle is made: in the browser, the
 * same in every browser.
 *
 * `size` is how many free cells the table has: four in the classic game,
 * three or two for a harder one. There is one level: every card is face up
 * from the start, so a deal is as hard as its cells make it.
 *
 * The deal is the first one, from this seed on, in a fixed order of tries
 * (`nextWinnableTry`), that the solver wins with these cells, and its solution
 * is the solver's line — so every deal here can be won, and the address is put
 * right to name the deal's own seed (`PuzzlePlay`). The deal of a puzzle is the
 * plain shuffle of its seed (`dealOfSeed`), Solitaire's, so the server checks a
 * finished game against its seed in one pass.
 */

/**
 * The tables the solver looks at before it gives a deal up (`solveFreeCell`):
 * a count, so every browser agrees. PART OF WHAT A SEED MEANS: changing it
 * changes which deal a seed names. Measured 2026-09-30 over thirty seeds: the
 * solver wins 26 deals with four cells, 20 with three and 16 with two, in about
 * a twentieth of a second each, and gives one up in under a quarter.
 */
export const FREECELL_BUDGET = 10_000;

/** How many deals the search looks at before it stops: far past anything two cells need. */
const MOST_TRIED = 200;

/** The solver's winning line for a seed's deal with so many cells, written as moves, or null. */
export function freeCellLine(seed: number, cells: number): string | null {
  const found = solveFreeCell(dealFreeCell(deckOf(dealOfSeed(seed))!, cells), FREECELL_BUDGET).moves;
  return found === null ? null : encodeMoves(found);
}

export function generateFreeCell(size: number, level: PuzzleLevel, seed: number): Puzzle {
  let at = seed;
  for (let tried = 0; tried < MOST_TRIED; tried += 1) {
    const line = freeCellLine(at, size);
    if (line !== null) return { kind: "freecell", size, level, seed: at, givens: dealOfSeed(at), solution: line };
    at = nextWinnableTry(seed, tried);
  }
  throw new Error(`No winnable FreeCell deal found from seed ${seed} with ${size} cells.`);
}
