import type { CardId } from "../cardGames.types";
import type { ClimbPlay } from "../climbing/climbing.types";

import { presidentMoves, presidentRank, sortPresident } from "./president";
import type { PresidentGame, PresidentMove } from "./president.types";

/**
 * A COMPUTER AT THE PRESIDENT TABLE, playing as a sensible player does: hand
 * back its lowest cards, lead its lowest rank whole, beat the table with the
 * lowest rank that matches the count exactly rather than breaking up a pair
 * or a triple, and keep its twos and aces back until the table is nearly
 * empty or it is.
 *
 * It reads a view of the game (`presidentView`): its own hand, what is on the
 * table, how many cards each player holds, and nothing else.
 */

export type PresidentView = {
  seat: number;
  hand: readonly CardId[];
  pile: ClimbPlay | null;
  counts: readonly number[];
  legal: readonly PresidentMove[];
};

export function presidentView(game: PresidentGame): PresidentView {
  const seat = game.toPlay ?? 0;
  return { seat, hand: game.hands[seat], pile: game.pile, counts: game.hands.map((hand) => hand.length), legal: presidentMoves(game) };
}

const heldOf = (hand: readonly CardId[], rank: number) => hand.filter((card) => presidentRank(card) === rank).length;

export function presidentComputer(game: PresidentGame): PresidentMove {
  const view = presidentView(game);
  const gives = view.legal.filter((move): move is { give: CardId[] } => "give" in move);
  if (gives.length > 0) return { give: sortPresident(view.hand).slice(0, gives[0].give.length) };
  const plays = view.legal.flatMap((move) => ("play" in move ? [move.play] : []));
  if (plays.length === 0) return { pass: true };
  // Only plays of a whole rank, or of as much of it as the table asks, are worth weighing.
  const cost = (cards: CardId[]) => {
    const rank = presidentRank(cards[0]);
    const breaks = heldOf(view.hand, rank) > cards.length ? 1 : 0;
    return rank * 2 + breaks * 9 - (view.pile === null ? cards.length * 2 : 0);
  };
  const cheapest = plays.reduce((best, cards) => (cost(cards) < cost(best) ? cards : best));
  if (view.pile === null) return { play: cheapest };
  const others = view.counts.filter((count, seat) => seat !== view.seat && count > 0);
  const danger = others.length > 0 && Math.min(...others) <= 2;
  const nearlyOut = view.hand.length - cheapest.length <= 2;
  // Twos and aces wait for when they are needed.
  if (presidentRank(cheapest[0]) >= 11 && !danger && !nearlyOut) return { pass: true };
  return { play: cheapest };
}
