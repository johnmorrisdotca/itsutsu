import type { PuzzleCheck } from "../puzzles.types";

import { decodeMoves, deckOf } from "./code";
import type { FreeCellTable } from "./freecell.types";
import { dealFreeCell, freeCellWon, playFreeCell } from "./rules";

/** The free cells a table may be played with: four, three or two. */
export const FREECELL_CELLS: readonly number[] = [4, 3, 2];

/** The most characters a FreeCell move list may be: two or three a move, and room for a long evening. */
export const FREECELL_MOVES_MOST = 4000;

/** The table a move list leaves, from a deal with so many cells, or the reason it cannot be read. One pass, no search. */
export function freeCellPlayedOut(cells: number, deal: string, moves: string): { table: FreeCellTable } | { reason: string } {
  if (!FREECELL_CELLS.includes(cells)) return { reason: `FreeCell is played with ${FREECELL_CELLS.join(", ")} cells` };
  const deck = deckOf(deal);
  if (deck === null) return { reason: "the deal is not a whole deck" };
  if (moves.length > FREECELL_MOVES_MOST) return { reason: "more moves than a game is kept with" };
  const list = decodeMoves(moves);
  if (list === null) return { reason: "a move that is not written as one" };
  let table = dealFreeCell(deck, cells);
  for (const [at, move] of list.entries()) {
    const next = playFreeCell(table, move);
    if (next === null) return { reason: `move ${at + 1} is not allowed there` };
    table = next;
  }
  return { table };
}

/** THE CHECK THE SERVER RUNS on a finished game: the moves, replayed from the deal, every one allowed, and every card home. */
export function checkFreeCell(size: number, givens: string, answer: string): PuzzleCheck {
  const played = freeCellPlayedOut(size, givens, answer);
  if ("reason" in played) return { ok: false, reason: played.reason };
  return freeCellWon(played.table) ? { ok: true } : { ok: false, reason: "not every card is home" };
}

/** A game given up: every move allowed, at least one made, and not won. */
export function checkFreeCellGivenUp(size: number, givens: string, answer: string): PuzzleCheck {
  if (answer.length === 0) return { ok: false, reason: "no move was made" };
  const played = freeCellPlayedOut(size, givens, answer);
  if ("reason" in played) return { ok: false, reason: played.reason };
  return freeCellWon(played.table) ? { ok: false, reason: "it was won" } : { ok: true };
}

/** Whether a kept run's moves are written as moves, within the length a run is kept with. */
export function freeCellMovesFit(moves: string): boolean {
  return moves.length <= FREECELL_MOVES_MOST && decodeMoves(moves) !== null;
}
