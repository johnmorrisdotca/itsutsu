import { computerSeats } from "../cardGameCodec";
import { CRAZY_EIGHTS_SIZES } from "../cardGames.constants";
import type { CardId, CardSuit } from "../cardGames.types";
import { dealRound, nextSeat, rankOf, reshuffled, shuffledDeck, suitOf } from "../cards";

import type { CrazyEightsGame, CrazyEightsMove, CrazyEightsResult } from "./crazyEights.types";

/**
 * CRAZY EIGHTS: the rules, and nothing else. The old public-domain game the
 * commercial colour-card games are built on.
 *
 * Two to seven players; seven cards each for two, five for more, and the top
 * card of the stock turned up to start the discard pile (an eight turned up
 * goes back under the stock). On your turn, play a card that matches the top
 * card's suit or rank. Eights are wild: play one on anything and name the
 * suit that must follow. If you cannot play, draw one card; if it can be
 * played you may play it, and otherwise your turn is over. When the stock
 * runs out the discards under the top card are shuffled into a new one; when
 * there are none, a player who cannot play passes, and a hand in which every
 * player passes in turn is blocked.
 *
 * The first out wins the hand and scores what everybody else still holds:
 * fifty for an eight, ten for a picture card, one for an ace and the face
 * value for the rest. A blocked hand goes to whoever holds the least, and
 * they score the rest. The first to the game's size wins.
 *
 * Pure: every function returns a new game and leaves the one given alone.
 */

export const EIGHT = 8;
const SUITS_CALLED: readonly CardSuit[] = ["C", "D", "H", "S"];

/** What a card left in hand is worth to the winner of the hand. */
export function crazyPoints(card: CardId): number {
  const rank = rankOf(card);
  if (rank === EIGHT) return 50;
  return rank >= 11 ? 10 : rank;
}

/** Seven cards each for two players, five for more. */
export function crazyHandSize(seats: number): number {
  return seats === 2 ? 7 : 5;
}

/** A hand as a player holds it: eights last, the rest by suit and rank. */
export function sortCrazy(hand: readonly CardId[]): CardId[] {
  const order = "CDSH";
  const key = (card: CardId) => (rankOf(card) === EIGHT ? 100 : order.indexOf(suitOf(card)) * 20 + rankOf(card));
  return [...hand].sort((a, b) => key(a) - key(b) || a.localeCompare(b));
}

function dealHand(game: Omit<CrazyEightsGame, "hands" | "stock" | "discard" | "suit" | "toPlay" | "drawn" | "passes" | "turnovers" | "phase">): CrazyEightsGame {
  const seats = game.players.length;
  const dealt = dealRound(shuffledDeck(game.seed, game.hand), seats, crazyHandSize(seats));
  let stock = dealt.stock;
  // An eight turned up to start goes back under the stock, and the next card is turned instead.
  while (rankOf(stock[0]) === EIGHT) stock = [...stock.slice(1), stock[0]];
  const [start, ...rest] = stock;
  return {
    ...game,
    phase: "playing",
    hands: dealt.hands.map(sortCrazy),
    stock: rest,
    discard: [start],
    suit: suitOf(start),
    toPlay: game.hand % seats,
    drawn: null,
    passes: 0,
    turnovers: 0,
  };
}

export function startCrazyEights(size: number, players: readonly string[], _language?: unknown, dealt?: number, computers?: readonly boolean[]): CrazyEightsGame | null {
  if (!(CRAZY_EIGHTS_SIZES as readonly number[]).includes(size)) return null;
  if (players.length < 2 || players.length > 7) return null;
  return dealHand({
    size,
    players: [...players],
    computers: computerSeats(players.length, computers),
    seed: dealt ?? 1,
    moves: [],
    hand: 0,
    scores: new Array<number>(players.length).fill(0),
    results: [],
  });
}

/** The card on top of the discard pile. */
export function crazyTop(game: CrazyEightsGame): CardId {
  return game.discard[game.discard.length - 1];
}

/** Whether this card may go on the pile now: an eight always; otherwise the suit to follow or the top card's rank. */
export function crazyMatches(game: CrazyEightsGame, card: CardId): boolean {
  return rankOf(card) === EIGHT || suitOf(card) === game.suit || rankOf(card) === rankOf(crazyTop(game));
}

/** Whether a card can still be drawn: from the stock, or from the discards under the top card shuffled into one. */
function canDraw(game: CrazyEightsGame): boolean {
  return game.stock.length > 0 || game.discard.length > 1;
}

/** The cards the player to move may play now: after drawing, only the card drawn. */
export function crazyPlayable(game: CrazyEightsGame): CardId[] {
  if (game.phase === "over" || game.toPlay === null) return [];
  const from = game.drawn !== null ? [game.drawn] : game.hands[game.toPlay];
  return from.filter((card) => crazyMatches(game, card));
}

export function crazyEightsMoves(game: CrazyEightsGame): CrazyEightsMove[] {
  if (game.phase === "over" || game.toPlay === null) return [];
  const plays = crazyPlayable(game).flatMap((card): CrazyEightsMove[] =>
    rankOf(card) === EIGHT ? SUITS_CALLED.map((suit) => ({ play: card, suit })) : [{ play: card }],
  );
  if (game.drawn !== null) return [...plays, { pass: true }];
  if (plays.length > 0) return plays;
  return [canDraw(game) ? { draw: true } : { pass: true }];
}

/** The next player's turn, with nothing drawn. */
function onward(game: CrazyEightsGame, seat: number, passes: number): CrazyEightsGame {
  return { ...game, toPlay: nextSeat(seat, game.players.length), drawn: null, passes };
}

function draw(game: CrazyEightsGame, seat: number): CrazyEightsGame {
  let { stock, discard, turnovers } = game;
  if (stock.length === 0) {
    // The discards under the top card, shuffled, are the new stock.
    turnovers += 1;
    stock = reshuffled(discard.slice(0, -1), game.seed, 1000 * (game.hand + 1) + turnovers);
    discard = discard.slice(-1);
  }
  const [card, ...rest] = stock;
  const hands = game.hands.map((hand, at) => (at === seat ? sortCrazy([...hand, card]) : hand));
  const after = { ...game, hands, stock: rest, discard, turnovers };
  return crazyMatches(after, card) ? { ...after, drawn: card, passes: 0 } : onward(after, seat, 0);
}

function play(game: CrazyEightsGame, seat: number, card: CardId, called: CardSuit | undefined): CrazyEightsGame | null {
  if (!crazyPlayable(game).includes(card)) return null;
  const eight = rankOf(card) === EIGHT;
  if (eight ? called === undefined || !SUITS_CALLED.includes(called) : called !== undefined) return null;
  const hands = game.hands.map((hand, at) => (at === seat ? hand.filter((held) => held !== card) : hand));
  const after = { ...game, hands, discard: [...game.discard, card], suit: eight ? (called as CardSuit) : suitOf(card) };
  return hands[seat].length === 0 ? endHand(after, [seat], false) : onward(after, seat, 0);
}

/** What the hand is worth to its winners: everything the others still hold. */
function endHand(game: CrazyEightsGame, winners: number[], blocked: boolean): CrazyEightsGame {
  const points = game.hands.reduce((sum, hand, seat) => (winners.includes(seat) ? sum : sum + hand.reduce((held, card) => held + crazyPoints(card), 0)), 0);
  const scores = game.scores.map((score, seat) => (winners.includes(seat) ? score + points : score));
  const result: CrazyEightsResult = { winners, points, blocked };
  const finished = { ...game, scores, results: [...game.results, result] };
  if (Math.max(...scores) >= game.size) return { ...finished, phase: "over", toPlay: null, drawn: null };
  return dealHand({ ...finished, hand: game.hand + 1 });
}

function pass(game: CrazyEightsGame, seat: number): CrazyEightsGame | null {
  if (game.drawn !== null) return onward(game, seat, 0);
  if (crazyPlayable(game).length > 0 || canDraw(game)) return null;
  const passes = game.passes + 1;
  if (passes < game.players.length) return onward(game, seat, passes);
  // Blocked: nobody can play or draw. The least held wins.
  const held = game.hands.map((hand) => hand.reduce((sum, card) => sum + crazyPoints(card), 0));
  const least = Math.min(...held);
  return endHand(game, held.flatMap((points, at) => (points === least ? [at] : [])), true);
}

export function playCrazyEights(game: CrazyEightsGame, move: CrazyEightsMove): CrazyEightsGame | null {
  const seat = game.toPlay;
  if (game.phase === "over" || seat === null) return null;
  let next: CrazyEightsGame | null;
  if ("play" in move) next = play(game, seat, move.play, move.suit);
  else if ("draw" in move) next = move.draw === true && game.drawn === null && crazyPlayable(game).length === 0 && canDraw(game) ? draw(game, seat) : null;
  else next = move.pass === true ? pass(game, seat) : null;
  return next === null ? null : { ...next, moves: [...game.moves, move] };
}

/** The highest score wins, once somebody reaches the game's size; level on it shares the win. */
export function crazyEightsWinners(game: CrazyEightsGame): number[] {
  if (game.phase !== "over") return [];
  const top = Math.max(...game.scores);
  return game.scores.flatMap((score, seat) => (score === top ? [seat] : []));
}
