import { computerSeats } from "../cardGameCodec.ts";
import { CRIBBAGE_SIZES } from "../cardGames.constants.ts";
import type { CardId } from "../cardGames.types.ts";
import { dealRound, rankOf, shuffledDeck, suitOf, without } from "../cards.ts";

import type { CribbageCount, CribbageGame, CribbageHandScore, CribbageMove, CribbagePeg } from "./cribbage.types.ts";

/**
 * CRIBBAGE: the rules, and nothing else.
 *
 * Two players, six cards each. Each lays two away to the crib, which is the
 * dealer's, and the top of the pack is cut as the starter (a jack cut scores
 * the dealer two, "his heels"). Then the pegging: from the dealer's other
 * hand, the players lay their cards in turn, calling the running total, which
 * may not pass thirty-one. Fifteen and thirty-one score two; a pair two, three
 * alike six, four alike twelve; a run of three or more, in any order, a point
 * a card. A player who cannot play says go, and the other plays on while they
 * can; whoever played last scores one for the go (or the two for thirty-one),
 * and the count starts again. The last card of all scores one. Then the show:
 * each hand of four, with the starter, scores two for every fifteen, two a
 * pair, a point a card of every run, four for a flush in the hand (five with
 * the starter; the crib only for all five) and one for the jack of the
 * starter's suit ("his nobs"). The other player shows first, then the dealer,
 * then the dealer's crib. The first to the game's total wins, the moment they
 * reach it.
 *
 * Pure: every function returns a new game and leaves the one given alone.
 */

export const CRIBBAGE_SEATS = 2;
const DEALT = 6;
const MOST = 31;
const JACK = 11;

/** A card's worth in the count: ace one, court cards ten. */
export function cardValue(card: CardId): number {
  return Math.min(10, rankOf(card));
}

export function dealerOf(deal: number): number {
  return deal % CRIBBAGE_SEATS;
}

/** The seat that is not this one. */
export function otherOf(seat: number): number {
  return 1 - seat;
}

/** A hand sorted as a player holds it: ace low to king, by rank then suit. */
export function sortCribbage(hand: readonly CardId[]): CardId[] {
  return [...hand].sort((a, b) => rankOf(a) - rankOf(b) || "SHCD".indexOf(suitOf(a)) - "SHCD".indexOf(suitOf(b)));
}

function dealCribbage(game: Omit<CribbageGame, "phase" | "hands" | "kept" | "crib" | "cut" | "starter" | "count" | "run" | "pegged" | "peg" | "toPlay">): CribbageGame {
  const { hands, stock } = dealRound(shuffledDeck(game.seed, game.deal), CRIBBAGE_SEATS, DEALT);
  return {
    ...game,
    phase: "crib",
    hands: hands.map(sortCribbage),
    kept: [[], []],
    crib: [],
    cut: stock[0],
    starter: null,
    count: 0,
    run: [],
    pegged: [],
    peg: null,
    // The dealer's other hand lays away first, as it leads the pegging.
    toPlay: otherOf(dealerOf(game.deal)),
  };
}

export function startCribbage(size: number, players: readonly string[], _language?: unknown, dealt?: number, computers?: readonly boolean[]): CribbageGame | null {
  if (!(CRIBBAGE_SIZES as readonly number[]).includes(size)) return null;
  if (players.length !== CRIBBAGE_SEATS) return null;
  return dealCribbage({ size, players: [...players], computers: computerSeats(players.length, computers), seed: dealt ?? 1, moves: [], deal: 0, scores: [0, 0], results: [] });
}

/** The cards a seat may play on the count now: any that keeps it to thirty-one. */
export function cribbagePlayable(hand: readonly CardId[], count: number): CardId[] {
  return hand.filter((card) => count + cardValue(card) <= MOST);
}

/** Every way to lay two of a hand away. */
export function cribPairs(hand: readonly CardId[]): [CardId, CardId][] {
  const pairs: [CardId, CardId][] = [];
  for (let a = 0; a < hand.length; a += 1) for (let b = a + 1; b < hand.length; b += 1) pairs.push([hand[a], hand[b]]);
  return pairs;
}

export function cribbageMoves(game: CribbageGame): CribbageMove[] {
  if (game.toPlay === null) return [];
  const hand = game.hands[game.toPlay];
  if (game.phase === "crib") return cribPairs(hand).map((crib) => ({ crib }));
  return cribbagePlayable(hand, game.count).map((play) => ({ play }));
}

/** The longest run the last cards played make, three or more, in any order; 0 for none. */
function runAtEnd(cards: readonly CardId[]): number {
  for (let length = cards.length; length >= 3; length -= 1) {
    const ranks = cards.slice(-length).map(rankOf).sort((a, b) => a - b);
    if (ranks.every((rank, at) => at === 0 || rank === ranks[at - 1] + 1)) return length;
  }
  return 0;
}

/** What laying the last card of `cards` scores, the count now `count`: fifteen, thirty-one, pairs and runs. */
export function pegPoints(cards: readonly CardId[], count: number): { points: number; why: string[] } {
  let points = 0;
  const why: string[] = [];
  if (count === 15) {
    points += 2;
    why.push("fifteen");
  }
  if (count === MOST) {
    points += 2;
    why.push("thirty-one");
  }
  let alike = 1;
  while (alike < cards.length && rankOf(cards[cards.length - 1 - alike]) === rankOf(cards[cards.length - 1])) alike += 1;
  if (alike >= 2) {
    points += [0, 0, 2, 6, 12][alike];
    why.push(["", "", "a pair", "three alike", "four alike"][alike]);
  } else {
    const run = runAtEnd(cards);
    if (run > 0) {
      points += run;
      why.push(`a run of ${run}`);
    }
  }
  return { points, why };
}

/** What four cards and the starter are worth in the show. A crib's flush counts only when all five are one suit. */
export function showCount(four: readonly CardId[], starter: CardId, crib = false): CribbageCount {
  const all = [...four, starter];
  let fifteens = 0;
  for (let mask = 1; mask < 1 << all.length; mask += 1) {
    let sum = 0;
    for (let at = 0; at < all.length; at += 1) if (mask & (1 << at)) sum += cardValue(all[at]);
    if (sum === 15) fifteens += 2;
  }
  const byRank = new Array<number>(14).fill(0);
  for (const card of all) byRank[rankOf(card)] += 1;
  let pairs = 0;
  for (const held of byRank) pairs += held * (held - 1);
  let runs = 0;
  for (let rank = 1; rank <= 13; ) {
    if (byRank[rank] === 0) {
      rank += 1;
      continue;
    }
    let end = rank;
    let ways = 1;
    while (end <= 13 && byRank[end] > 0) {
      ways *= byRank[end];
      end += 1;
    }
    if (end - rank >= 3) runs += (end - rank) * ways;
    rank = end;
  }
  const suit = suitOf(four[0]);
  const handFlush = four.every((card) => suitOf(card) === suit);
  const flush = !handFlush ? 0 : suitOf(starter) === suit ? 5 : crib ? 0 : 4;
  const nobs = four.some((card) => rankOf(card) === JACK && suitOf(card) === suitOf(starter)) ? 1 : 0;
  return { fifteens, pairs, runs, flush, nobs, total: fifteens + pairs + runs + flush + nobs };
}

/** Points added to a seat, and the game over the moment either reaches the total. */
function score(game: CribbageGame, seat: number, points: number): CribbageGame {
  if (points === 0) return game;
  const scores = game.scores.map((had, at) => (at === seat ? had + points : had)) as [number, number];
  const after = { ...game, scores };
  return scores[seat] >= game.size ? { ...after, phase: "over", toPlay: null } : after;
}

function layAway(game: CribbageGame, seat: number, cards: readonly CardId[]): CribbageGame | null {
  if (cards.length !== 2 || cards[0] === cards[1]) return null;
  const hand = without(game.hands[seat], cards);
  if (hand === null) return null;
  const hands = game.hands.map((held, at) => (at === seat ? hand : held));
  const kept = game.kept.map((held, at) => (at === seat ? hand : held));
  const crib = [...game.crib, ...cards];
  const dealer = dealerOf(game.deal);
  if (crib.length < 2 * CRIBBAGE_SEATS) return { ...game, hands, kept, crib, toPlay: dealer };
  // Both have laid away: the starter is cut, and a jack scores the dealer two.
  const cut: CribbageGame = { ...game, hands, kept, crib: sortCribbage(crib), starter: game.cut, phase: "pegging", toPlay: otherOf(dealer) };
  return rankOf(game.cut) === JACK ? score({ ...cut, peg: { seat: dealer, points: 2, why: ["his heels"] } }, dealer, 2) : cut;
}

/** The pegging is played out: the show, the other player's hand first, then the dealer's, then the crib, and the next hand dealt. */
function show(game: CribbageGame): CribbageGame {
  const dealer = dealerOf(game.deal);
  const pone = otherOf(dealer);
  const starter = game.starter!;
  const counts = game.kept.map((four) => showCount(four, starter)) as [CribbageCount, CribbageCount];
  const cribCount = showCount(game.crib, starter, true);
  const result: CribbageHandScore = { dealer, starter, hands: [game.kept[0], game.kept[1]], crib: game.crib, counts, cribCount };
  let after: CribbageGame = { ...game, results: [...game.results, result] };
  for (const [seat, points] of [[pone, counts[pone].total], [dealer, counts[dealer].total], [dealer, cribCount.total]] as const) {
    after = score(after, seat, points);
    if (after.phase === "over") return after;
  }
  return dealCribbage({ size: after.size, players: after.players, computers: after.computers, seed: after.seed, moves: after.moves, deal: game.deal + 1, scores: after.scores, results: after.results });
}

function playCard(game: CribbageGame, seat: number, card: CardId): CribbageGame | null {
  if (!cribbagePlayable(game.hands[seat], game.count).includes(card)) return null;
  const hands = game.hands.map((held, at) => (at === seat ? held.filter((one) => one !== card) : held));
  const count = game.count + cardValue(card);
  const run = [...game.run, { seat, card }];
  const made = pegPoints(run.map((play) => play.card), count);
  const other = otherOf(seat);
  const canPlay = (at: number) => cribbagePlayable(hands[at], count).length > 0;
  let next: CribbageGame = { ...game, hands, count, run, pegged: [...game.pegged, { seat, card }] };
  let toPlay: number;
  let reset = false;
  if (count === MOST) {
    reset = true;
    toPlay = hands[other].length > 0 ? other : seat;
  } else if (canPlay(other)) toPlay = other;
  else if (canPlay(seat)) toPlay = seat;
  else {
    // Neither can lay a card: a go, or the last card of all, for one.
    made.points += 1;
    made.why.push(hands[seat].length + hands[other].length === 0 ? "last card" : "go");
    reset = true;
    toPlay = hands[other].length > 0 ? other : seat;
  }
  const peg: CribbagePeg | null = made.points > 0 ? { seat, points: made.points, why: made.why } : null;
  next = score({ ...next, peg, toPlay }, seat, made.points);
  if (next.phase === "over") return next;
  if (reset) next = { ...next, count: 0, run: [] };
  return hands.every((held) => held.length === 0) ? show(next) : next;
}

export function playCribbage(game: CribbageGame, move: CribbageMove): CribbageGame | null {
  if (game.toPlay === null) return null;
  const seat = game.toPlay;
  let next: CribbageGame | null = null;
  if ("crib" in move) next = game.phase === "crib" && Array.isArray(move.crib) ? layAway({ ...game, peg: null }, seat, move.crib) : null;
  else if ("play" in move) next = game.phase === "pegging" ? playCard(game, seat, move.play) : null;
  return next === null ? null : { ...next, moves: [...game.moves, move] };
}

/** The first to the total. */
export function cribbageWinners(game: CribbageGame): number[] {
  if (game.phase !== "over") return [];
  return [game.scores[0] >= game.size ? 0 : 1];
}
