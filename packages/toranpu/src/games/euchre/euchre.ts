import { computerSeats } from "../cardGameCodec.ts";
import { EUCHRE_SIZES } from "../cardGames.constants.ts";
import type { CardId, CardSuit } from "../cardGames.types.ts";
import { FULL_DECK, dealRound, nextSeat, rankOf, shuffledDeck, suitOf, without } from "../cards.ts";

import type { EuchreGame, EuchreHandScore, EuchreMove, EuchrePlay } from "./euchre.types.ts";

/**
 * EUCHRE: the rules, and nothing else.
 *
 * Four players in two partnerships, partners across the table, with the
 * twenty-four cards from nine to ace. Five each, and the top of the four left
 * over turned up. Round the table from the dealer's left, each player may
 * order that card's suit as trumps (the dealer picks the card up and throws
 * one away) or pass; if all four pass, each may name another suit or pass,
 * and the dealer, last, must name one. In trumps the jack is the highest card
 * (the right bower), then the other jack of the same colour (the left bower,
 * which is a trump and no longer of its own suit), then ace, king, queen, ten
 * and nine. Follow suit if you can; the highest trump, or else the highest
 * card of the suit led, takes the trick. The partnership that made trumps
 * scores one for three or four tricks and two for all five; held to two or
 * fewer, it is euchred, and the other partnership scores two. The first to the
 * game's total wins.
 *
 * Pure: every function returns a new game and leaves the one given alone.
 */

export const EUCHRE_SEATS = 4;
const DEALT = 5;
const SUITS: readonly CardSuit[] = ["C", "D", "H", "S"];
/** The cards Euchre is played with: nine to ace of each suit. */
export const EUCHRE_DECK: readonly CardId[] = FULL_DECK.filter((card) => rankOf(card) === 1 || rankOf(card) >= 9);
const LEFT_OUT: readonly CardId[] = FULL_DECK.filter((card) => !EUCHRE_DECK.includes(card));
const JACK = 11;

export function teamOf(seat: number): 0 | 1 {
  return (seat % 2) as 0 | 1;
}

export function partnerOf(seat: number): number {
  return (seat + 2) % EUCHRE_SEATS;
}

export function dealerOf(deal: number): number {
  return deal % EUCHRE_SEATS;
}

/** The suit of the same colour: clubs and spades, diamonds and hearts. */
export function sameColour(suit: CardSuit): CardSuit {
  return ({ C: "S", S: "C", D: "H", H: "D" } as const)[suit];
}

/** The suit a card belongs to once trumps are made: the left bower is a trump. */
export function suitIn(card: CardId, trump: CardSuit | null): CardSuit {
  if (trump !== null && rankOf(card) === JACK && suitOf(card) === sameColour(trump)) return trump;
  return suitOf(card);
}

/** A card's height within its suit as the hand is played: ace high; in trumps the right bower, then the left, above everything. */
export function euchreHeight(card: CardId, trump: CardSuit | null): number {
  if (trump !== null && rankOf(card) === JACK) {
    if (suitOf(card) === trump) return 20;
    if (suitOf(card) === sameColour(trump)) return 19;
  }
  const rank = rankOf(card);
  return rank === 1 ? 14 : rank;
}

/** A hand sorted as a player holds it: by suit (trumps last once made), high cards to the right. */
export function sortEuchre(hand: readonly CardId[], trump: CardSuit | null = null): CardId[] {
  const order = (card: CardId) => {
    const suit = suitIn(card, trump);
    return suit === trump ? 4 : "SHCD".indexOf(suit);
  };
  return [...hand].sort((a, b) => order(a) - order(b) || euchreHeight(a, trump) - euchreHeight(b, trump));
}

function dealEuchre(game: Omit<EuchreGame, "hands" | "upcard" | "trump" | "maker" | "passes" | "trick" | "played" | "toPlay" | "tricks" | "phase">): EuchreGame {
  const { hands, stock } = dealRound(shuffledDeck(game.seed, game.deal, LEFT_OUT), EUCHRE_SEATS, DEALT);
  return {
    ...game,
    phase: "order",
    hands: hands.map((hand) => sortEuchre(hand)),
    upcard: stock[0],
    trump: null,
    maker: null,
    passes: 0,
    trick: [],
    played: [],
    toPlay: nextSeat(dealerOf(game.deal), EUCHRE_SEATS),
    tricks: new Array<number>(EUCHRE_SEATS).fill(0),
  };
}

export function startEuchre(size: number, players: readonly string[], _language?: unknown, dealt?: number, computers?: readonly boolean[]): EuchreGame | null {
  if (!(EUCHRE_SIZES as readonly number[]).includes(size)) return null;
  if (players.length !== EUCHRE_SEATS) return null;
  return dealEuchre({ size, players: [...players], computers: computerSeats(players.length, computers), seed: dealt ?? 1, moves: [], deal: 0, lastTrick: null, scores: [0, 0], results: [] });
}

/** The cards the seat to play may lay on the trick: the suit led (the left bower counting as a trump) if it holds any. */
export function euchrePlayable(game: EuchreGame): CardId[] {
  if (game.phase !== "playing" || game.toPlay === null) return [];
  const hand = game.hands[game.toPlay];
  if (game.trick.length === 0) return hand;
  const led = suitIn(game.trick[0].card, game.trump);
  const following = hand.filter((card) => suitIn(card, game.trump) === led);
  return following.length > 0 ? following : hand;
}

/** Who is taking a trick: the highest trump, or else the highest card of the suit led. */
export function euchreTrickWinner(trick: readonly EuchrePlay[], trump: CardSuit): number {
  const led = suitIn(trick[0].card, trump);
  const power = (card: CardId) => {
    const suit = suitIn(card, trump);
    if (suit === trump) return 100 + euchreHeight(card, trump);
    return suit === led ? euchreHeight(card, trump) : 0;
  };
  return trick.reduce((best, play) => (power(play.card) > power(best.card) ? play : best)).seat;
}

export function euchreMoves(game: EuchreGame): EuchreMove[] {
  if (game.toPlay === null) return [];
  if (game.phase === "order") return [{ order: true }, { pass: true }];
  if (game.phase === "call") {
    const calls = SUITS.filter((suit) => suit !== suitOf(game.upcard)).map((suit): EuchreMove => ({ call: suit }));
    // The dealer, last to speak in the second round, must name a suit.
    return game.toPlay === dealerOf(game.deal) ? calls : [...calls, { pass: true }];
  }
  if (game.phase === "discard") return game.hands[game.toPlay].map((card) => ({ discard: card }));
  return euchrePlayable(game).map((play) => ({ play }));
}

/** Trumps are made: the tricks begin, led by the dealer's left. */
function beginPlay(game: EuchreGame, trump: CardSuit, maker: number): EuchreGame {
  return { ...game, trump, maker, hands: game.hands.map((hand) => sortEuchre(hand, trump)), phase: "playing", toPlay: nextSeat(dealerOf(game.deal), EUCHRE_SEATS) };
}

function speak(game: EuchreGame, seat: number, move: EuchreMove): EuchreGame | null {
  const dealer = dealerOf(game.deal);
  if ("pass" in move) {
    if (game.phase === "call" && seat === dealer) return null;
    const passes = game.passes + 1;
    if (passes < EUCHRE_SEATS) return { ...game, passes, toPlay: nextSeat(seat, EUCHRE_SEATS) };
    // Everybody passed the turned card: it is turned down, and the second round begins at the dealer's left.
    return { ...game, phase: "call", passes: 0, toPlay: nextSeat(dealer, EUCHRE_SEATS) };
  }
  if ("order" in move && game.phase === "order") {
    const trump = suitOf(game.upcard);
    // The dealer picks the turned card up, and throws one away before play.
    const hands = game.hands.map((hand, at) => (at === dealer ? sortEuchre([...hand, game.upcard], trump) : sortEuchre(hand, trump)));
    return { ...game, hands, trump, maker: seat, phase: "discard", toPlay: dealer };
  }
  if ("call" in move && game.phase === "call") {
    if (!SUITS.includes(move.call) || move.call === suitOf(game.upcard)) return null;
    return beginPlay(game, move.call, seat);
  }
  return null;
}

function discardCard(game: EuchreGame, seat: number, card: CardId): EuchreGame | null {
  const hand = without(game.hands[seat], [card]);
  if (hand === null) return null;
  const hands = game.hands.map((held, at) => (at === seat ? hand : held));
  return beginPlay({ ...game, hands }, game.trump!, game.maker!);
}

function playCard(game: EuchreGame, seat: number, card: CardId): EuchreGame | null {
  if (!euchrePlayable(game).includes(card)) return null;
  const hands = game.hands.map((hand, at) => (at === seat ? hand.filter((held) => held !== card) : hand));
  const trick = [...game.trick, { seat, card }];
  if (trick.length < EUCHRE_SEATS) return { ...game, hands, trick, toPlay: nextSeat(seat, EUCHRE_SEATS) };
  const winner = euchreTrickWinner(trick, game.trump!);
  const tricks = game.tricks.map((had, at) => (at === winner ? had + 1 : had));
  const after: EuchreGame = { ...game, hands, trick: [], tricks, played: [...game.played, ...trick.map((play) => play.card)], lastTrick: { plays: trick, winner }, toPlay: winner };
  return hands[0].length === 0 ? endHand(after) : after;
}

/** What a hand scores: one to the makers for three or four tricks, two for all five, and two to the other side when the makers take two or fewer. */
export function handPoints(makers: 0 | 1, tricks: number): [number, number] {
  const points: [number, number] = [0, 0];
  if (tricks === DEALT) points[makers] = 2;
  else if (tricks >= 3) points[makers] = 1;
  else points[1 - makers] = 2;
  return points;
}

function endHand(game: EuchreGame): EuchreGame {
  const makers = teamOf(game.maker!);
  const taken = game.tricks[makers] + game.tricks[makers + 2];
  const points = handPoints(makers, taken);
  const scores: [number, number] = [game.scores[0] + points[0], game.scores[1] + points[1]];
  const result: EuchreHandScore = { makers, trump: game.trump!, tricks: taken, points };
  const finished = { ...game, scores, results: [...game.results, result] };
  if (scores.some((score) => score >= game.size)) return { ...finished, phase: "over", toPlay: null };
  return dealEuchre({ ...finished, deal: game.deal + 1 });
}

export function playEuchre(game: EuchreGame, move: EuchreMove): EuchreGame | null {
  if (game.toPlay === null) return null;
  const seat = game.toPlay;
  let next: EuchreGame | null = null;
  if ("play" in move) next = game.phase === "playing" ? playCard(game, seat, move.play) : null;
  else if ("discard" in move) next = game.phase === "discard" ? discardCard(game, seat, move.discard) : null;
  else if (game.phase === "order" || game.phase === "call") next = speak(game, seat, move);
  return next === null ? null : { ...next, moves: [...game.moves, move] };
}

/** The partnership with the higher score wins, both its seats. */
export function euchreWinners(game: EuchreGame): number[] {
  if (game.phase !== "over") return [];
  const team = game.scores[0] > game.scores[1] ? 0 : 1;
  return [team, team + 2];
}
