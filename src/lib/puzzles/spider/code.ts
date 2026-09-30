import { cardAt, cardIndex, readCards, writeCards } from "../../cards/deck";
import { seededRandom, shuffled } from "../random";

import type { SpiderMove, SpiderTable } from "./spider.types";
import { COLUMNS, dealSpider, playSpider, spiderDeck } from "./rules";

/**
 * A SPIDER GAME WRITTEN DOWN: the deal and the moves, as Solitaire's are
 * (`solitaire/code.ts`). The deal is both decks in the order they are dealt,
 * one letter a card, a hundred and four letters (the same letter twice, or
 * eight times with one suit). A move is `d` for a deal from the stock, or
 * three characters: the column it leaves, the column it lands on, and how many
 * cards it carries, `1`–`9` then `a`–`d` for ten to thirteen (base 36), since
 * into an empty column any number up to the run would do.
 */

export const DEAL_CODE = "d";

export function encodeMove(move: SpiderMove): string {
  return move.kind === "deal" ? DEAL_CODE : `${move.from}${move.to}${move.count.toString(36)}`;
}

export function encodeMoves(moves: readonly SpiderMove[]): string {
  return moves.map(encodeMove).join("");
}

/** A move list read back, or null for one with a character that is no move. */
export function decodeMoves(code: string): SpiderMove[] | null {
  const moves: SpiderMove[] = [];
  const column = (char: string | undefined) => (char !== undefined && char >= "0" && char <= "9" ? Number(char) : null);
  for (let at = 0; at < code.length; ) {
    if (code[at] === DEAL_CODE) {
      moves.push({ kind: "deal" });
      at += 1;
      continue;
    }
    const from = column(code[at]);
    const to = column(code[at + 1]);
    const count = parseInt(code[at + 2] ?? "", 36);
    if (from === null || to === null || !(count >= 1 && count <= 13) || from >= COLUMNS || to >= COLUMNS) return null;
    moves.push({ kind: "carry", from, to, count });
    at += 3;
  }
  return moves;
}

/** The deal of a seed at so many suits: the site's one shuffle (`shuffled`) of both decks, written down. */
export function spiderDealOfSeed(seed: number, suits: number): string {
  return writeCards(shuffled(spiderDeck(suits), seededRandom(seed)).map(cardAt));
}

/** The cards a deal string names, or null for one that is not both decks of a game of so many suits. */
export function spiderDeckOf(deal: string, suits: number): number[] | null {
  const cards = readCards(deal);
  if (cards === null) return null;
  const deck = cards.map(cardIndex);
  const sorted = [...deck].sort((a, b) => a - b);
  const expected = spiderDeck(suits).sort((a, b) => a - b);
  return sorted.length === expected.length && sorted.every((card, at) => card === expected[at]) ? deck : null;
}

/**
 * A game played out from its deal: every table it passed through, the first
 * the deal, or null where the deal is not two decks or a move is one the rules
 * refuse. The one reader of a move list, for the table, a kept run, the check
 * and a finished game's page alike.
 */
export function replaySpider(deal: string, suits: number, moves: string): SpiderTable[] | null {
  const deck = spiderDeckOf(deal, suits);
  const list = decodeMoves(moves);
  if (deck === null || list === null) return null;
  const tables = [dealSpider(deck)];
  for (const move of list) {
    const next = playSpider(tables[tables.length - 1], move);
    if (next === null) return null;
    tables.push(next);
  }
  return tables;
}
