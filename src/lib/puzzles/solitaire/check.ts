import type { PuzzleCheck, PuzzleLevel } from "../puzzles.types";

import { dealKlondike, deckOf, decodeMoves, klondikeWon, playKlondike } from "@johnmorrisdotca/toranpu/klondike";
import type { KlondikeTable } from "@johnmorrisdotca/toranpu/klondike";
import { solitaireRules } from "./rules";
import type { PuzzleReason } from "@/lib/puzzles/puzzleReasons";
import { no, why } from "@/lib/puzzles/puzzleReasons";

/** The most characters a Solitaire move list may be: two a carry, one a turn of the stock, and room for a long evening of turning. */
export const SOLITAIRE_MOVES_MOST = 3600;

/**
 * The table a move list leaves, from a deal under these rules, or the reason
 * it cannot be read: not a deck, not a move, or a move the rules refuse (and
 * which one). One pass, no search.
 */
export function playedOut(size: number, level: PuzzleLevel, deal: string, moves: string): { table: KlondikeTable } | PuzzleReason {
  const deck = deckOf(deal);
  if (deck === null) return why("chk.dealNotDeck");
  if (moves.length > SOLITAIRE_MOVES_MOST) return why("chk.moreMovesGame");
  const list = decodeMoves(moves);
  if (list === null) return why("chk.moveNotWritten");
  let table = dealKlondike(deck, solitaireRules(size, level));
  for (const [at, move] of list.entries()) {
    const next = playKlondike(table, move);
    if (next === null) return why("chk.moveNotAllowed", { n: at + 1 });
    table = next;
  }
  return { table };
}

/**
 * THE CHECK THE SERVER RUNS on a finished game: the moves, replayed from the
 * deal under the game's own rules, are every one allowed, and do they bring
 * all fifty-two cards home. O(moves), no solver.
 */
export function checkSolitaire(size: number, givens: string, answer: string, level: PuzzleLevel): PuzzleCheck {
  if (size !== 1 && size !== 3) return no("chk.solitaireTurns");
  const played = playedOut(size, level, givens, answer);
  if ("reason" in played) return { ok: false, ...played };
  return klondikeWon(played.table) ? { ok: true } : no("chk.notEveryCardHome");
}

/**
 * A GAME GIVEN UP, handed in as ended (the solved route's `outOfGuesses`):
 * every move allowed, at least one made — a deal nobody touched was never
 * played — and not won, since a won game is a solve.
 */
export function checkSolitaireGivenUp(size: number, givens: string, answer: string, level: PuzzleLevel): PuzzleCheck {
  if (answer.length === 0) return no("chk.noMoveMade");
  const played = playedOut(size, level, givens, answer);
  if ("reason" in played) return { ok: false, ...played };
  return klondikeWon(played.table) ? no("chk.itWasWon") : { ok: true };
}

/** Whether a kept run's moves are written as moves, within the length a run is kept with; they are replayed when it is opened. */
export function solitaireMovesFit(moves: string): boolean {
  return moves.length <= SOLITAIRE_MOVES_MOST && decodeMoves(moves) !== null;
}
