import { cardAt, cardIndex, isWholeDeck, readCards, shuffledDeck, writeCards } from "@/lib/cards/deck";

import { dealKlondike, playKlondike } from "./klondike";
import type { KlondikeMove, KlondikePile, KlondikeRules, KlondikeTable } from "./solitaire.types";

/**
 * A SOLITAIRE GAME WRITTEN DOWN: the deal and the moves, each a short string.
 *
 * The deal is the deck in the order it was dealt, one letter a card
 * (`writeCards`), fifty-two letters: a puzzle's givens. The moves are what a
 * kept run, a finished game and its check all read: `d` turns the stock, `r`
 * turns the waste back over, and any other move is two characters, the pile
 * it leaves and the pile it lands on (`KlondikePile`). So a hundred-move game
 * is a couple of hundred characters, and its check is a replay, one move at a
 * time, with no search.
 */

export const DRAW_CODE = "d";
export const RECYCLE_CODE = "r";
const PILES = new Set<string>(["s", "w", "S", "H", "D", "C", "1", "2", "3", "4", "5", "6", "7"]);

export function encodeMove(move: KlondikeMove): string {
  if (move.kind === "draw") return DRAW_CODE;
  if (move.kind === "recycle") return RECYCLE_CODE;
  return `${move.from}${move.to}`;
}

export function encodeMoves(moves: readonly KlondikeMove[]): string {
  return moves.map(encodeMove).join("");
}

/** A move list read back, or null for one with a character that is no move. */
export function decodeMoves(code: string): KlondikeMove[] | null {
  const moves: KlondikeMove[] = [];
  for (let at = 0; at < code.length; ) {
    const char = code[at];
    if (char === DRAW_CODE || char === RECYCLE_CODE) {
      moves.push({ kind: char === DRAW_CODE ? "draw" : "recycle" });
      at += 1;
      continue;
    }
    const to = code[at + 1];
    if (!PILES.has(char) || to === undefined || !PILES.has(to)) return null;
    moves.push({ kind: "carry", from: char as KlondikePile, to: to as KlondikePile });
    at += 2;
  }
  return moves;
}

/** The deck a deal string names, as card numbers, or null for one that is not a whole deck. */
export function deckOf(deal: string): number[] | null {
  if (!isWholeDeck(deal)) return null;
  return readCards(deal)!.map(cardIndex);
}

/** The deal of a seed: the site's one shuffle (`shuffledDeck`), written down. */
export function dealOfSeed(seed: number): string {
  return writeCards(shuffledDeck(seed));
}

/** A deal string from card numbers. */
export function dealOf(deck: readonly number[]): string {
  return writeCards(deck.map(cardAt));
}

/**
 * A game played out from its deal: every table it passed through, the first
 * the deal, or null where the deal is not a deck or a move is one the rules
 * refuse. The one reader of a move list, for the table, a kept run, the
 * check and a finished game's page alike.
 */
export function replay(deal: string, rules: KlondikeRules, moves: string): KlondikeTable[] | null {
  const deck = deckOf(deal);
  const list = decodeMoves(moves);
  if (deck === null || list === null) return null;
  const tables = [dealKlondike(deck, rules)];
  for (const move of list) {
    const next = playKlondike(tables[tables.length - 1], move);
    if (next === null) return null;
    tables.push(next);
  }
  return tables;
}
