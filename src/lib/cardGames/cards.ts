import { RANK_DISPLAY } from "../cards/cards.constants";
import type { Card } from "../cards/cards.types";
import { cardFromId, cardId, cardName, freshDeck, shuffledDeck as shuffledCards } from "../cards/deck";
import { seededRandom, shuffled } from "../puzzles/random";

import type { CardId, CardRank, CardSuit } from "./cardGames.types";

/**
 * THE CARDS THE FAMILY GAMES ARE DEALT, as the rules see them: fifty-two
 * short names, "QS" for the queen of spades and "TD" for the ten of
 * diamonds, a rank letter and a suit letter.
 *
 * A name rather than an object, because a rule compares, counts and keeps
 * cards far more often than it draws one: two names are equal when they are
 * the same card, a hand is a list of them, and a game kept as text is short.
 * They are the site's one deck's own ids (`cardId` in `lib/cards/deck.ts`),
 * dealt from its shuffle, and `cardOfId` turns one back into the deck's
 * `Card` for `components/cards/` to draw.
 */

/** The rank letters, ace low: an index here plus one is the rank (A = 1, J = 11, Q = 12, K = 13). */
export const RANK_LETTERS = "A23456789TJQK";

/** Every card, in the deck's own order. */
export const FULL_DECK: readonly CardId[] = freshDeck().map(cardId);

const EVERY_CARD = new Set(FULL_DECK);

/** Whether this is one of the fifty-two names. */
export function isCard(value: unknown): value is CardId {
  return typeof value === "string" && EVERY_CARD.has(value);
}

/** A card's rank, ace low: 1 to 13. */
export function rankOf(card: CardId): CardRank {
  return (RANK_LETTERS.indexOf(card[0]) + 1) as CardRank;
}

export function suitOf(card: CardId): CardSuit {
  return card[1] as CardSuit;
}

/** The card of this rank and suit. */
export function cardOf(rank: CardRank, suit: CardSuit): CardId {
  return `${RANK_LETTERS[rank - 1]}${suit}`;
}

/** The deck's card for an id, for the deck's components to draw. */
export function cardOfId(card: CardId): Card {
  const found = cardFromId(card);
  if (found === null) throw new Error(`no card ${card}`);
  return found;
}

/** "queen of spades", as a sentence and a screen reader say it. */
export function cardWords(card: CardId): string {
  return cardName(cardOfId(card));
}

/** A rank named in the plural, as it is asked for: "sevens", "sixes", "queens". */
export function rankWords(rank: CardRank): string {
  const word = RANK_DISPLAY[rank].name;
  return word.endsWith("x") ? `${word}es` : `${word}s`;
}

/** A suit's name: "spades". */
export function suitWords(suit: CardSuit): string {
  return { C: "clubs", D: "diamonds", H: "hearts", S: "spades" }[suit];
}

/**
 * The deck shuffled for one deal of one game: the same seed and deal always
 * the same order, so a game kept as its seed and moves deals itself again
 * exactly, and reloading can never re-deal a hand somebody has seen.
 */
export function shuffledDeck(seed: number, deal: number, leaveOut: readonly CardId[] = []): CardId[] {
  return shuffledCards(mixSeed(seed, deal))
    .map(cardId)
    .filter((card) => !leaveOut.includes(card));
}

/** These cards shuffled again, the same way for the same seed and salt: a pile turned over to make a new stock. */
export function reshuffled(cards: readonly CardId[], seed: number, salt: number): CardId[] {
  return shuffled(cards, seededRandom(mixSeed(seed, salt)));
}

/** Two numbers folded into one seed, so each deal of a game (and each reshuffle within one) has its own order. */
export function mixSeed(seed: number, salt: number): number {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (salt + 0x7f4a7c15), 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Deals the cards one at a time round the table, from the first seat, as a
 * dealer does: `each` to a seat, or every card when `each` is absent (so some
 * seats hold one more than others). What is not dealt is the stock, in order,
 * its top card first.
 */
export function dealRound(deck: readonly CardId[], seats: number, each?: number): { hands: CardId[][]; stock: CardId[] } {
  const hands: CardId[][] = Array.from({ length: seats }, () => []);
  const dealt = each === undefined ? deck.length : Math.min(deck.length, each * seats);
  for (let at = 0; at < dealt; at += 1) hands[at % seats].push(deck[at]);
  return { hands, stock: deck.slice(dealt) };
}

/** The hand without these cards, or null when it does not hold every one of them. */
export function without(hand: readonly CardId[], cards: readonly CardId[]): CardId[] | null {
  const left = [...hand];
  for (const card of cards) {
    const at = left.indexOf(card);
    if (at < 0) return null;
    left.splice(at, 1);
  }
  return left;
}

/** Whether a list names no card twice. */
export function allDifferent(cards: readonly CardId[]): boolean {
  return new Set(cards).size === cards.length;
}

/** Every way of choosing `count` of these cards, in the order they are given. */
export function choices<T>(items: readonly T[], count: number): T[][] {
  const out: T[][] = [];
  const pick = (from: number, chosen: T[]) => {
    if (chosen.length === count) {
      out.push(chosen);
      return;
    }
    for (let at = from; at <= items.length - (count - chosen.length); at += 1) pick(at + 1, [...chosen, items[at]]);
  };
  pick(0, []);
  return out;
}

/** The next seat round the table, to the left: the order every game here plays in. */
export function nextSeat(seat: number, seats: number): number {
  return (seat + 1) % seats;
}
