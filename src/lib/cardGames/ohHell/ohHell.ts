import { computerSeats } from "../cardGameCodec";
import { OH_HELL_DEALS } from "../cardGames.constants";
import type { CardId } from "../cardGames.types";
import { dealRound, nextSeat, rankOf, shuffledDeck, suitOf } from "../cards";

import type { OhHellDealScore, OhHellGame, OhHellMove, OhHellPlay } from "./ohHell.types";

/**
 * OH HELL: the rules, and nothing else.
 *
 * Three or four players, each for themselves. The first deal is one card
 * each, the next two, and so up to seven (and, in the long game, back down to
 * one); after each deal the next card is turned up, and its suit is trumps.
 * From the dealer's left, each player bids exactly how many tricks they will
 * take. The dealer bids last and may not bid the number that would make the
 * bids add up to the tricks there are, so somebody must miss. Follow suit if
 * you can; the highest trump, or else the highest card of the suit led, takes
 * the trick. Take exactly what you bid and score ten and your bid; take any
 * other number and score nothing. The highest score after the last deal
 * wins.
 *
 * Pure: every function returns a new game and leaves the one given alone.
 */

export const OH_HELL_MOST_CARDS = 7;
const MADE = 10;

/** A card's height in a trick: ace high. */
export function ohHellHeight(card: CardId): number {
  const rank = rankOf(card);
  return rank === 1 ? 14 : rank;
}

/** The cards dealt to each seat in each deal of a game of this length: up to seven, and back down in the long game. */
export function dealSizes(size: number): number[] {
  const up = Array.from({ length: OH_HELL_MOST_CARDS }, (_, at) => at + 1);
  return size <= OH_HELL_MOST_CARDS ? up : [...up, ...up.slice(0, -1).reverse()];
}

export function dealerOf(deal: number, seats: number): number {
  return deal % seats;
}

/** A hand as a player holds it: by suit, trumps last, high cards to the right. */
export function sortOhHell(hand: readonly CardId[], trump: string): CardId[] {
  const order = (card: CardId) => (suitOf(card) === trump ? 4 : "SHCD".indexOf(suitOf(card)));
  return [...hand].sort((a, b) => order(a) - order(b) || ohHellHeight(a) - ohHellHeight(b));
}

function dealOhHell(game: Omit<OhHellGame, "phase" | "cards" | "hands" | "turned" | "trump" | "bids" | "trick" | "played" | "toPlay" | "tricks">): OhHellGame {
  const seats = game.players.length;
  const cards = dealSizes(game.size)[game.deal];
  const { hands, stock } = dealRound(shuffledDeck(game.seed, game.deal), seats, cards);
  const turned = stock[0];
  const trump = suitOf(turned);
  return {
    ...game,
    phase: "bidding",
    cards,
    hands: hands.map((hand) => sortOhHell(hand, trump)),
    turned,
    trump,
    bids: new Array<number | null>(seats).fill(null),
    trick: [],
    played: [],
    toPlay: nextSeat(dealerOf(game.deal, seats), seats),
    tricks: new Array<number>(seats).fill(0),
  };
}

export function startOhHell(size: number, players: readonly string[], _language?: unknown, dealt?: number, computers?: readonly boolean[]): OhHellGame | null {
  if (!(OH_HELL_DEALS as readonly number[]).includes(size)) return null;
  if (players.length < 3 || players.length > 4) return null;
  return dealOhHell({ size, players: [...players], computers: computerSeats(players.length, computers), seed: dealt ?? 1, moves: [], deal: 0, lastTrick: null, scores: new Array<number>(players.length).fill(0), dealScores: [] });
}

/** The bids open to the seat to bid: nought to the cards in hand, less the one a dealer may not make. */
export function ohHellBids(game: OhHellGame): number[] {
  if (game.phase !== "bidding" || game.toPlay === null) return [];
  const all = Array.from({ length: game.cards + 1 }, (_, bid) => bid);
  if (game.toPlay !== dealerOf(game.deal, game.players.length)) return all;
  const others = game.bids.reduce<number>((sum, bid) => sum + (bid ?? 0), 0);
  return all.filter((bid) => others + bid !== game.cards);
}

/** The cards the seat to play may lay: the suit led if it holds any. */
export function ohHellPlayable(game: OhHellGame): CardId[] {
  if (game.phase !== "playing" || game.toPlay === null) return [];
  const hand = game.hands[game.toPlay];
  if (game.trick.length === 0) return hand;
  const led = suitOf(game.trick[0].card);
  const following = hand.filter((card) => suitOf(card) === led);
  return following.length > 0 ? following : hand;
}

/** Who takes a trick: the highest trump, or else the highest card of the suit led. */
export function ohHellTrickWinner(trick: readonly OhHellPlay[], trump: string): number {
  const led = suitOf(trick[0].card);
  const power = (card: CardId) => (suitOf(card) === trump ? 100 : suitOf(card) === led ? 0 : -100) + ohHellHeight(card);
  return trick.reduce((best, play) => (power(play.card) > power(best.card) ? play : best)).seat;
}

export function ohHellMoves(game: OhHellGame): OhHellMove[] {
  if (game.phase === "bidding") return ohHellBids(game).map((bid) => ({ bid }));
  return ohHellPlayable(game).map((play) => ({ play }));
}

/** What a seat scores for a deal: ten and its bid for exactly what it bid, nothing otherwise. */
export function dealPoints(bid: number, tricks: number): number {
  return bid === tricks ? MADE + bid : 0;
}

function bid(game: OhHellGame, seat: number, tricks: number): OhHellGame | null {
  if (!ohHellBids(game).includes(tricks)) return null;
  const bids = game.bids.map((had, at) => (at === seat ? tricks : had));
  const seats = game.players.length;
  // The dealer bids last; then the dealer's left leads.
  if (bids.every((one) => one !== null)) return { ...game, bids, phase: "playing", toPlay: nextSeat(dealerOf(game.deal, seats), seats) };
  return { ...game, bids, toPlay: nextSeat(seat, seats) };
}

function endDeal(game: OhHellGame): OhHellGame {
  const bids = game.bids as number[];
  const points = bids.map((one, seat) => dealPoints(one, game.tricks[seat]));
  const row: OhHellDealScore = { cards: game.cards, bids, tricks: game.tricks, points };
  const finished = { ...game, scores: game.scores.map((score, seat) => score + points[seat]), dealScores: [...game.dealScores, row] };
  if (game.deal + 1 >= dealSizes(game.size).length) return { ...finished, phase: "over", toPlay: null };
  return dealOhHell({ ...finished, deal: game.deal + 1 });
}

function playCard(game: OhHellGame, seat: number, card: CardId): OhHellGame | null {
  if (!ohHellPlayable(game).includes(card)) return null;
  const seats = game.players.length;
  const hands = game.hands.map((hand, at) => (at === seat ? hand.filter((held) => held !== card) : hand));
  const trick = [...game.trick, { seat, card }];
  if (trick.length < seats) return { ...game, hands, trick, toPlay: nextSeat(seat, seats) };
  const winner = ohHellTrickWinner(trick, game.trump);
  const tricks = game.tricks.map((had, at) => (at === winner ? had + 1 : had));
  const after: OhHellGame = { ...game, hands, trick: [], tricks, played: [...game.played, ...trick.map((play) => play.card)], lastTrick: { plays: trick, winner }, toPlay: winner };
  return hands[0].length === 0 ? endDeal(after) : after;
}

export function playOhHell(game: OhHellGame, move: OhHellMove): OhHellGame | null {
  if (game.toPlay === null) return null;
  const seat = game.toPlay;
  const next = "bid" in move ? (game.phase === "bidding" ? bid(game, seat, move.bid) : null) : game.phase === "playing" ? playCard(game, seat, move.play) : null;
  return next === null ? null : { ...next, moves: [...game.moves, move] };
}

/** The highest score after the last deal: every seat that has it. */
export function ohHellWinners(game: OhHellGame): number[] {
  if (game.phase !== "over") return [];
  const best = Math.max(...game.scores);
  return game.scores.flatMap((score, seat) => (score === best ? [seat] : []));
}
