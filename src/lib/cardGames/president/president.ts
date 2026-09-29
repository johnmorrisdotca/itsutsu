import { computerSeats } from "../cardGameCodec";
import { PRESIDENT_ROUNDS } from "../cardGames.constants";
import type { CardId, CardSuit } from "../cardGames.types";
import { dealRound, rankOf, shuffledDeck, suitOf, without } from "../cards";
import { afterTurn, freshTrick, laid, passedOn, seatsIn } from "../climbing/climbing";
import type { ClimbMove } from "../climbing/climbing.types";

import type { PresidentGame, PresidentMove } from "./president.types";

/**
 * PRESIDENT: the rules, and nothing else. Known in Japan as Daifugō 大富豪,
 * "the grand millionaire", and at many a North American table by a ruder name.
 *
 * Three to eight players, the whole pack dealt round. Twos are high and threes
 * low, and suits do not count. The lead is one card, or two, three or four of
 * one rank; round the table each player plays the same number of cards of a
 * higher rank, or passes, and a pass holds until the trick is over. When
 * everybody else has passed, the last to play leads again. The first out is
 * President, then Vice-President, and the last is the Beggar. From the second
 * round, before play, the Beggar hands the President their two best cards and
 * gets two of the President's choosing back, and the Vice-Beggar and the
 * Vice-President swap one the same way (three at the table: one card, between
 * the President and the Beggar); then the Beggar leads.
 *
 * Every round scores a point for each player who went out after you, and the
 * most points after the game's rounds wins.
 *
 * Pure: every function returns a new game and leaves the one given alone.
 */

const SUIT_ORDER: Record<CardSuit, number> = { C: 0, D: 1, H: 2, S: 3 };

/** A rank's height: the three lowest (0), the two highest (12). */
export function presidentRank(card: CardId): number {
  return (rankOf(card) + 10) % 13;
}

/** Cards in President's order, lowest first, suits in a fixed order only so a hand always sorts the same way. */
export function sortPresident(cards: readonly CardId[]): CardId[] {
  return [...cards].sort((a, b) => presidentRank(a) - presidentRank(b) || SUIT_ORDER[suitOf(a)] - SUIT_ORDER[suitOf(b)]);
}

/** The cards handed up at the start of a round: the giver's best. */
function best(hand: readonly CardId[], count: number): CardId[] {
  return sortPresident(hand).slice(-count);
}

/** How many cards the President and the Beggar swap: two, or one when only three are at the table. */
export function presidentSwapCount(seats: number): number {
  return seats >= 4 ? 2 : 1;
}

/** A new round: every card dealt round, and — from the second round — the best cards handed up, and the hands-back owed. */
function newRound(game: Omit<PresidentGame, "hands" | "pile" | "passed" | "toPlay" | "played" | "out" | "owed" | "swaps" | "phase">): PresidentGame {
  const seats = game.players.length;
  // The deal starts at a different seat each round, so the odd cards (some hold one more) go round the table.
  const dealt = dealRound(shuffledDeck(game.seed, game.round), seats).hands;
  const first = (game.seed + game.round) % seats;
  const hands = dealt.map((_, seat) => dealt[(seat - first + seats) % seats]);
  const titles = game.titles;
  if (titles === null) {
    const leader = hands.findIndex((hand) => hand.includes("3C"));
    return { ...game, ...freshTrick(hands.map(sortPresident), leader), phase: "playing", out: [], owed: [], swaps: [] };
  }
  const pairs = [{ high: titles[0], low: titles[seats - 1], count: presidentSwapCount(seats) }];
  if (seats >= 4) pairs.push({ high: titles[1], low: titles[seats - 2], count: 1 });
  let held = hands;
  const swaps = pairs.map(({ high, low, count }) => {
    const cards = best(held[low], count);
    held = held.map((hand, seat) => (seat === low ? (without(hand, cards) as CardId[]) : seat === high ? [...hand, ...cards] : hand));
    return { from: low, to: high, cards };
  });
  const owed = pairs.map(({ high, low, count }) => ({ from: high, to: low, count }));
  return { ...game, ...freshTrick(held.map(sortPresident), owed[0].from), phase: "exchange", out: [], owed, swaps };
}

export function startPresident(size: number, players: readonly string[], _language?: unknown, dealt?: number, computers?: readonly boolean[]): PresidentGame | null {
  if (!(PRESIDENT_ROUNDS as readonly number[]).includes(size)) return null;
  if (players.length < 3 || players.length > 8) return null;
  return newRound({
    size,
    players: [...players],
    computers: computerSeats(players.length, computers),
    seed: dealt ?? 1,
    moves: [],
    round: 0,
    titles: null,
    scores: new Array<number>(players.length).fill(0),
    rounds: [],
  });
}

/** Whether these cards may be played now by the seat to play: one rank, one to four of it, higher than the table's and as many. */
export function presidentMayPlay(game: PresidentGame, cards: readonly CardId[]): boolean {
  if (game.phase !== "playing" || game.toPlay === null) return false;
  if (cards.length < 1 || cards.length > 4 || new Set(cards).size !== cards.length) return false;
  if (!cards.every((card) => presidentRank(card) === presidentRank(cards[0]))) return false;
  if (without(game.hands[game.toPlay], cards) === null) return false;
  if (game.pile === null) return true;
  return game.pile.cards.length === cards.length && presidentRank(cards[0]) > presidentRank(game.pile.cards[0]);
}

export function presidentMoves(game: PresidentGame): PresidentMove[] {
  if (game.toPlay === null) return [];
  const hand = game.hands[game.toPlay];
  if (game.phase === "exchange") {
    // What is handed back is the giver's choice; one move a choice of distinct cards.
    const count = game.owed[0].count;
    const sorted = sortPresident(hand);
    return count === 1 ? sorted.map((card) => ({ give: [card] })) : sorted.flatMap((a, at) => sorted.slice(at + 1).map((b) => ({ give: [a, b] })));
  }
  if (game.phase !== "playing") return [];
  // One move a rank and a count: which suits go down makes no difference to the game.
  const plays: PresidentMove[] = [];
  for (const rank of new Set(hand.map(presidentRank))) {
    const same = sortPresident(hand.filter((card) => presidentRank(card) === rank));
    for (let count = 1; count <= same.length; count += 1) if (presidentMayPlay(game, same.slice(0, count))) plays.push({ play: same.slice(0, count) });
  }
  return game.pile === null ? plays : [...plays, { pass: true }];
}

function give(game: PresidentGame, cards: readonly CardId[]): PresidentGame | null {
  const [owing, ...rest] = game.owed;
  if (owing === undefined || cards.length !== owing.count || new Set(cards).size !== cards.length) return null;
  const left = without(game.hands[owing.from], cards);
  if (left === null) return null;
  const hands = game.hands.map((hand, seat) => (seat === owing.from ? left : seat === owing.to ? sortPresident([...hand, ...cards]) : hand));
  const swaps = [...game.swaps, { from: owing.from, to: owing.to, cards: [...cards] }];
  if (rest.length > 0) return { ...game, hands, swaps, owed: rest, toPlay: rest[0].from };
  // Everything is handed over: the Beggar leads.
  const beggar = (game.titles as number[])[game.players.length - 1];
  return { ...game, hands, swaps, owed: [], phase: "playing", toPlay: beggar };
}

function endRound(game: PresidentGame): PresidentGame {
  const order = [...game.out, ...seatsIn(game)];
  const seats = game.players.length;
  const scores = game.scores.map((score, seat) => score + (seats - 1 - order.indexOf(seat)));
  const finished = { ...game, out: order, scores, rounds: [...game.rounds, order] };
  if (finished.rounds.length >= game.size) return { ...finished, phase: "over", toPlay: null, pile: null };
  return newRound({ ...finished, round: game.round + 1, titles: order });
}

function climb(game: PresidentGame, seat: number, move: ClimbMove): PresidentGame | null {
  if ("pass" in move) return move.pass === true && game.pile !== null ? afterTurn(passedOn(game, seat), seat) : null;
  if (!presidentMayPlay(game, move.play)) return null;
  const after = laid(game, seat, move.play);
  if (after === null) return null;
  const out = after.hands[seat].length === 0 ? [...after.out, seat] : after.out;
  const next = { ...after, out };
  return seatsIn(next).length <= 1 ? endRound(next) : afterTurn(next, seat);
}

export function playPresident(game: PresidentGame, move: PresidentMove): PresidentGame | null {
  if (game.toPlay === null) return null;
  const next = "give" in move ? (game.phase === "exchange" ? give(game, move.give) : null) : game.phase === "playing" ? climb(game, game.toPlay, move) : null;
  return next === null ? null : { ...next, moves: [...game.moves, move] };
}

/** The most points wins; level on the most shares it. */
export function presidentWinners(game: PresidentGame): number[] {
  if (game.phase !== "over") return [];
  const top = Math.max(...game.scores);
  return game.scores.flatMap((score, seat) => (score === top ? [seat] : []));
}

/** Each seat's title from a round's finishing order: 0 President, 1 Vice-President, the last two Vice-Beggar and Beggar, everybody else a Citizen. */
export type PresidentTitle = "president" | "vicePresident" | "citizen" | "viceBeggar" | "beggar";

export function presidentTitle(order: readonly number[], seat: number): PresidentTitle {
  const place = order.indexOf(seat);
  const seats = order.length;
  if (place === 0) return "president";
  if (place === seats - 1) return "beggar";
  if (seats >= 4 && place === 1) return "vicePresident";
  if (seats >= 4 && place === seats - 2) return "viceBeggar";
  return "citizen";
}
