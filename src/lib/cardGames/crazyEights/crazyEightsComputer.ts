import type { CardId, CardSuit } from "../cardGames.types";
import { rankOf, suitOf } from "../cards";

import { EIGHT, crazyEightsMoves, crazyPoints } from "./crazyEights";
import type { CrazyEightsGame, CrazyEightsMove } from "./crazyEights.types";

/**
 * A COMPUTER AT THE CRAZY EIGHTS TABLE, which saves its eights.
 *
 * It plays an ordinary card whenever it has one, choosing the card that keeps
 * the play in the suit it holds most of and sheds the most points; it plays
 * an eight only when nothing else will go (or when it is nearly out), and
 * then calls the suit it is longest in. A drawn eight is kept for later
 * rather than played at once. It reads its own hand, the pile, the suit to
 * follow and how many cards each player holds, and nothing else.
 */

export type CrazyEightsView = {
  seat: number;
  hand: readonly CardId[];
  counts: readonly number[];
  drawn: CardId | null;
  legal: readonly CrazyEightsMove[];
};

export function crazyEightsView(game: CrazyEightsGame): CrazyEightsView {
  const seat = game.toPlay ?? 0;
  return { seat, hand: game.hands[seat], counts: game.hands.map((hand) => hand.length), drawn: game.drawn, legal: crazyEightsMoves(game) };
}

/** The suit this hand holds most of, eights aside; clubs first among equals so the choice is always the same. */
export function longestSuit(hand: readonly CardId[]): CardSuit {
  const suits: CardSuit[] = ["C", "D", "H", "S"];
  const count = (suit: CardSuit) => hand.filter((card) => suitOf(card) === suit && rankOf(card) !== EIGHT).length;
  return suits.reduce((best, suit) => (count(suit) > count(best) ? suit : best));
}

export function crazyEightsComputer(game: CrazyEightsGame): CrazyEightsMove {
  const view = crazyEightsView(game);
  const plays = view.legal.flatMap((move) => ("play" in move ? [move] : []));
  const fallback = view.legal[0];
  if (plays.length === 0) return fallback;
  const nearlyOut = view.hand.length <= 2;
  const ordinary = plays.filter((move) => rankOf(move.play) !== EIGHT);
  if (ordinary.length > 0) {
    const after = (card: CardId) => view.hand.filter((held) => held !== card);
    const worth = (card: CardId) => {
      const left = after(card);
      const sameSuit = left.filter((held) => suitOf(held) === suitOf(card) && rankOf(held) !== EIGHT).length;
      return sameSuit * 10 + crazyPoints(card);
    };
    return ordinary.reduce((best, move) => (worth(move.play) > worth(best.play) ? move : best));
  }
  // Only eights will go. One just drawn is kept for later, unless the hand is nearly gone.
  if (view.drawn !== null && !nearlyOut && view.legal.some((move) => "pass" in move)) return { pass: true };
  const eight = plays[0].play;
  const suit = longestSuit(view.hand.filter((card) => card !== eight));
  return plays.find((move) => move.suit === suit) ?? plays[0];
}
