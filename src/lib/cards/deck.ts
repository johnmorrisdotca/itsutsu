import { seededRandom, shuffled } from "../puzzles/random";

import { CARD_ALPHABET, DECK_SIZE, RANKS, RANK_DISPLAY, SUITS, SUIT_DISPLAY } from "./cards.constants";
import type { Card, CardCode, Rank, Suit, SuitColour } from "./cards.types";

/**
 * THE DECK, AND WHAT ANY CARD GAME DOES WITH IT BEFORE ITS OWN RULES BEGIN:
 * make one, shuffle it from a seed, deal it out, and write it down.
 *
 * Pure: every function returns new arrays and leaves what it was given alone,
 * as the engine does, so a game can keep its deck and replay a deal exactly.
 * The shuffle is the puzzles' seeded one (`random.ts`), so a seed kept with a
 * game's moves re-deals the same cards in every browser, and reloading a page
 * can never deal again.
 */

/** A fresh deck in the order a new pack is sorted: spades ace to king, then hearts, diamonds, clubs. */
export function freshDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })));
}

/** A deck shuffled from a seed: the same seed, the same order, in every browser and every test. */
export function shuffledDeck(seed: number): Card[] {
  return shuffled(freshDeck(), seededRandom(seed));
}

export function colourOf(card: Card): SuitColour {
  return SUIT_DISPLAY[card.suit].colour;
}

export function isRed(card: Card): boolean {
  return colourOf(card) === "red";
}

export function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

/** The card's place in a fresh deck, 0 to 51. */
export function cardIndex(card: Card): number {
  return SUITS.indexOf(card.suit) * RANKS.length + (card.rank - 1);
}

export function cardAt(index: number): Card {
  if (!Number.isInteger(index) || index < 0 || index >= DECK_SIZE) throw new Error(`no card at ${index}`);
  return { suit: SUITS[Math.floor(index / RANKS.length)], rank: RANKS[index % RANKS.length] };
}

/** One character for a card (`CARD_ALPHABET`). */
export function cardCode(card: Card): CardCode {
  return CARD_ALPHABET[cardIndex(card)];
}

/** The card a character names, or null for one that names none — a kept string is read, never trusted. */
export function cardFromCode(code: string): Card | null {
  const index = code.length === 1 ? CARD_ALPHABET.indexOf(code) : -1;
  return index < 0 ? null : cardAt(index);
}

/** The rank letters of a two-character id: `T` for the ten, so every id is two long. */
const ID_RANKS = "A23456789TJQK";
/** The suit letters of a two-character id, in `SUITS` order. */
const ID_SUITS = "SHDC";

/**
 * "QS", "TH", "AC": the two-character id card players write, rank then suit,
 * with `T` for the ten. For a game that keys its state by a readable id; a
 * kept deal is written with `cardCode`, one character a card.
 */
export function cardId(card: Card): string {
  return `${ID_RANKS[card.rank - 1]}${ID_SUITS[SUITS.indexOf(card.suit)]}`;
}

/** The card a two-character id names, or null. Lower case is read too. */
export function cardFromId(id: string): Card | null {
  if (id.length !== 2) return null;
  const rank = ID_RANKS.indexOf(id[0].toUpperCase());
  const suit = ID_SUITS.indexOf(id[1].toUpperCase());
  return rank < 0 || suit < 0 ? null : { suit: SUITS[suit], rank: RANKS[rank] };
}

/** A run of cards as a string, one character each. */
export function writeCards(cards: readonly Card[]): string {
  return cards.map(cardCode).join("");
}

/** A string of card characters read back, or null if any character names no card. */
export function readCards(text: string): Card[] | null {
  const cards: Card[] = [];
  for (const code of text) {
    const card = cardFromCode(code);
    if (card === null) return null;
    cards.push(card);
  }
  return cards;
}

/** Whether a string is a whole deck: fifty-two cards, each exactly once. */
export function isWholeDeck(text: string): boolean {
  const cards = readCards(text);
  return cards !== null && cards.length === DECK_SIZE && new Set(text).size === DECK_SIZE;
}

/** "Q♥": the short name a corner shows. */
export function cardShortName(card: Card): string {
  return `${RANK_DISPLAY[card.rank].short}${SUIT_DISPLAY[card.suit].symbol}`;
}

/** "queen of hearts": the name a screen reader says. */
export function cardName(card: Card): string {
  return `${RANK_DISPLAY[card.rank].name} of ${SUIT_DISPLAY[card.suit].name}`;
}

/**
 * Deal one card at a time round the table, as a dealer does: `hands` hands of
 * `each` cards, dealt from the top (the start of the array), and what is left.
 */
export function dealRound(deck: readonly Card[], hands: number, each: number): { hands: Card[][]; rest: Card[] } {
  if (hands < 1 || each < 0 || hands * each > deck.length) throw new Error(`cannot deal ${hands} hands of ${each} from ${deck.length}`);
  const dealt: Card[][] = Array.from({ length: hands }, () => []);
  for (let at = 0; at < hands * each; at += 1) dealt[at % hands].push(deck[at]);
  return { hands: dealt, rest: deck.slice(hands * each) };
}

/** Deal the whole deck round the table: the first hands get one more where it does not divide evenly. */
export function dealAll(deck: readonly Card[], hands: number): Card[][] {
  if (hands < 1) throw new Error("a deal needs a hand");
  const dealt: Card[][] = Array.from({ length: hands }, () => []);
  deck.forEach((card, at) => dealt[at % hands].push(card));
  return dealt;
}

/** Take `count` from the top: what was taken, and what is left. */
export function take(deck: readonly Card[], count: number): { taken: Card[]; rest: Card[] } {
  if (count < 0 || count > deck.length) throw new Error(`cannot take ${count} from ${deck.length}`);
  return { taken: deck.slice(0, count), rest: deck.slice(count) };
}

/** A hand sorted by suit (the fresh-deck order) and then by rank: how a player arranges one. */
export function sortedHand(cards: readonly Card[], rankOrder: (rank: Rank) => number = (rank) => rank, suitOrder: readonly Suit[] = SUITS): Card[] {
  return [...cards].sort((a, b) => suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit) || rankOrder(a.rank) - rankOrder(b.rank));
}
