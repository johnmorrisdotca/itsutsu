import type { CardId } from "../cardGames.types";
import type { ClimbMove, ClimbPlay } from "../climbing/climbing.types";

import { bigTwoMoves } from "./bigTwo";
import { bigTwoRank, bigTwoValue } from "./bigTwoHands";
import type { BigTwoGame } from "./bigTwo.types";

/**
 * A COMPUTER AT THE BIG TWO TABLE, playing as a sensible player does: lead
 * the play that sheds the most low cards (a run from the bottom of the hand
 * before a lone three), beat the table as cheaply as it can without breaking
 * up a pair or a triple it could play whole, and keep its aces and twos back
 * until somebody is close to going out or its own hand is nearly gone. When a
 * player is down to one card it stops leading singles they could beat.
 *
 * It reads a view of the game (`bigTwoView`): its own hand, what is on the
 * table, how many cards each player holds, and nothing else.
 */

export type BigTwoView = {
  seat: number;
  hand: readonly CardId[];
  pile: ClimbPlay | null;
  /** How many cards each seat holds: counted in the open at any table. */
  counts: readonly number[];
  legal: readonly ClimbMove[];
};

export function bigTwoView(game: BigTwoGame): BigTwoView {
  const seat = game.toPlay ?? 0;
  return { seat, hand: game.hands[seat], pile: game.pile, counts: game.hands.map((hand) => hand.length), legal: bigTwoMoves(game) };
}

/** The top rank a play reaches: 0 for a three, 11 an ace, 12 a two. */
const topRank = (cards: readonly CardId[]) => Math.max(...cards.map(bigTwoRank));

/** How much of a pair, triple or four of a kind a play breaks up: a card taken from a group it does not play whole. */
function broken(cards: readonly CardId[], hand: readonly CardId[]): number {
  let count = 0;
  for (const rank of new Set(cards.map(bigTwoRank))) {
    const held = hand.filter((card) => bigTwoRank(card) === rank).length;
    const used = cards.filter((card) => bigTwoRank(card) === rank).length;
    if (held > 1 && used < held) count += 1;
  }
  return count;
}

export function bigTwoComputer(game: BigTwoGame): ClimbMove {
  const view = bigTwoView(game);
  const plays = view.legal.flatMap((move) => ("play" in move ? [move.play] : []));
  if (plays.length === 0) return { pass: true };
  const others = view.counts.filter((_, seat) => seat !== view.seat);
  const danger = Math.min(...others) <= 3;
  const lastCard = Math.min(...others) === 1;
  if (view.pile === null) return { play: lead(view, plays, lastCard) };
  const chosen = follow(view, plays, danger, lastCard);
  return chosen === null ? { pass: true } : { play: chosen };
}

function lead(view: BigTwoView, plays: CardId[][], lastCard: boolean): CardId[] {
  const noTwos = plays.filter((cards) => topRank(cards) < 12);
  const pool = noTwos.length > 0 ? noTwos : plays;
  const worth = (cards: CardId[]) => {
    // A single the player on one card could beat is the worst lead there is.
    const lone = lastCard && cards.length === 1 ? 40 - topRank(cards) * 3 : 0;
    return cards.length * 6 - topRank(cards) * 1.5 - broken(cards, view.hand) * 5 - lone;
  };
  return pool.reduce((best, cards) => (worth(cards) > worth(best) ? cards : best));
}

function follow(view: BigTwoView, plays: CardId[][], danger: boolean, lastCard: boolean): CardId[] | null {
  const strength = (cards: CardId[]) => bigTwoValue(cards)?.strength ?? 0;
  // The player on one card must not be let out on a single: beat it with the highest single held.
  if (lastCard && view.pile !== null && view.pile.cards.length === 1) return plays.reduce((best, cards) => (strength(cards) > strength(best) ? cards : best));
  const cost = (cards: CardId[]) => strength(cards) + broken(cards, view.hand) * 60;
  const cheapest = plays.reduce((best, cards) => (cost(cards) < cost(best) ? cards : best));
  const nearlyOut = view.hand.length - cheapest.length <= 3;
  // Aces and twos are kept for when they are needed.
  if (topRank(cheapest) >= 11 && !danger && !nearlyOut) return null;
  return cheapest;
}
