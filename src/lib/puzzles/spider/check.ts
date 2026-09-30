import type { PuzzleCheck } from "../puzzles.types";

import { dealSpider, decodeMoves, playSpider, spiderDeckOf, spiderWon } from "@johnmorrisdotca/toranpu/spider";
import type { SpiderTable } from "@johnmorrisdotca/toranpu/spider";

/** The suits Spider may be played with: one, two or four. */
export const SPIDER_SUITS: readonly number[] = [1, 2, 4];

/** The most characters a Spider move list may be: three a move, and room for a long evening. */
export const SPIDER_MOVES_MOST = 4000;

/** The table a move list leaves, from a deal at so many suits, or the reason it cannot be read. One pass, no search. */
export function spiderPlayedOut(suits: number, deal: string, moves: string): { table: SpiderTable } | { reason: string } {
  if (!SPIDER_SUITS.includes(suits)) return { reason: `Spider is played with ${SPIDER_SUITS.join(", ")} suits` };
  const deck = spiderDeckOf(deal, suits);
  if (deck === null) return { reason: "the deal is not two decks of those suits" };
  if (moves.length > SPIDER_MOVES_MOST) return { reason: "more moves than a game is kept with" };
  const list = decodeMoves(moves);
  if (list === null) return { reason: "a move that is not written as one" };
  let table = dealSpider(deck);
  for (const [at, move] of list.entries()) {
    const next = playSpider(table, move);
    if (next === null) return { reason: `move ${at + 1} is not allowed there` };
    table = next;
  }
  return { table };
}

/** THE CHECK THE SERVER RUNS on a finished game: the moves, replayed from the deal, every one allowed, and all eight runs made. */
export function checkSpider(size: number, givens: string, answer: string): PuzzleCheck {
  const played = spiderPlayedOut(size, givens, answer);
  if ("reason" in played) return { ok: false, reason: played.reason };
  return spiderWon(played.table) ? { ok: true } : { ok: false, reason: "not every run is made" };
}

/** A game given up: every move allowed, at least one made, and not won. */
export function checkSpiderGivenUp(size: number, givens: string, answer: string): PuzzleCheck {
  if (answer.length === 0) return { ok: false, reason: "no move was made" };
  const played = spiderPlayedOut(size, givens, answer);
  if ("reason" in played) return { ok: false, reason: played.reason };
  return spiderWon(played.table) ? { ok: false, reason: "it was won" } : { ok: true };
}

/** Whether a kept run's moves are written as moves, within the length a run is kept with. */
export function spiderMovesFit(moves: string): boolean {
  return moves.length <= SPIDER_MOVES_MOST && decodeMoves(moves) !== null;
}
