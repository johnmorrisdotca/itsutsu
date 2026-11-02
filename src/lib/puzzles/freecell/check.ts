import type { PuzzleCheck } from "../puzzles.types";

import { dealFreeCell, deckOf, decodeMoves, freeCellWon, playFreeCell } from "@johnmorrisdotca/toranpu/freecell";
import type { FreeCellTable } from "@johnmorrisdotca/toranpu/freecell";
import type { PuzzleReason } from "@/lib/puzzles/puzzleReasons";
import { no, why } from "@/lib/puzzles/puzzleReasons";

/** The free cells a table may be played with: four, three or two. */
export const FREECELL_CELLS: readonly number[] = [4, 3, 2];

/** The most characters a FreeCell move list may be: two or three a move, and room for a long evening. */
export const FREECELL_MOVES_MOST = 4000;

/** The table a move list leaves, from a deal with so many cells, or the reason it cannot be read. One pass, no search. */
export function freeCellPlayedOut(cells: number, deal: string, moves: string): { table: FreeCellTable } | PuzzleReason {
  if (!FREECELL_CELLS.includes(cells)) return why("chk.freecellCells", { cells: FREECELL_CELLS.join(", ") });
  const deck = deckOf(deal);
  if (deck === null) return why("chk.dealNotDeck");
  if (moves.length > FREECELL_MOVES_MOST) return why("chk.moreMovesGame");
  const list = decodeMoves(moves);
  if (list === null) return why("chk.moveNotWritten");
  let table = dealFreeCell(deck, cells);
  for (const [at, move] of list.entries()) {
    const next = playFreeCell(table, move);
    if (next === null) return why("chk.moveNotAllowed", { n: at + 1 });
    table = next;
  }
  return { table };
}

/** THE CHECK THE SERVER RUNS on a finished game: the moves, replayed from the deal, every one allowed, and every card home. */
export function checkFreeCell(size: number, givens: string, answer: string): PuzzleCheck {
  const played = freeCellPlayedOut(size, givens, answer);
  if ("reason" in played) return { ok: false, ...played };
  return freeCellWon(played.table) ? { ok: true } : no("chk.notEveryCardHome");
}

/** A game given up: every move allowed, at least one made, and not won. */
export function checkFreeCellGivenUp(size: number, givens: string, answer: string): PuzzleCheck {
  if (answer.length === 0) return no("chk.noMoveMade");
  const played = freeCellPlayedOut(size, givens, answer);
  if ("reason" in played) return { ok: false, ...played };
  return freeCellWon(played.table) ? no("chk.itWasWon") : { ok: true };
}

/** Whether a kept run's moves are written as moves, within the length a run is kept with. */
export function freeCellMovesFit(moves: string): boolean {
  return moves.length <= FREECELL_MOVES_MOST && decodeMoves(moves) !== null;
}
