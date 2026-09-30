import type { CardId } from "../cardGames.types";
import { rankOf, suitOf, without } from "../cards";

import { bestLayout, canKnockWith, deadwoodIn, deadwoodValue, ginMoves } from "./ginRummy";
import type { GinGame, GinMove } from "./ginRummy.types";

/**
 * A COMPUTER AT THE GIN RUMMY TABLE: it takes the discard only when the card
 * goes straight into a meld, throws the card that leaves the least deadwood
 * (the highest of those that tie, and never one the other player has shown
 * they are collecting when another will do), and knocks the moment it can.
 *
 * It reads a view of the game (`ginView`): its own hand, the discard pile and
 * what the other player took from it — and nothing of their hand or the stock.
 */
export type GinView = {
  hand: readonly CardId[];
  phase: GinGame["phase"];
  /** The card on top of the discard pile, if any. */
  top: CardId | null;
  /** The card just taken from the pile, which may not go straight back. */
  taken: CardId | null;
  /** Every card the other player has taken from the discard pile this hand and still holds: the table watched them take it. */
  theirPicks: readonly CardId[];
};

export function ginView(game: GinGame): GinView {
  const seat = game.toPlay ?? 0;
  return { hand: game.hands[seat], phase: game.phase, top: game.discard.at(-1) ?? null, taken: game.taken, theirPicks: game.picked[1 - seat] ?? [] };
}

export function ginComputer(game: GinGame): GinMove {
  const view = ginView(game);
  if (view.phase === "draw") return view.top !== null && wanted(view.hand, view.top) ? { draw: "discard" } : { draw: "stock" };
  const card = chooseThrow(view);
  const move: GinMove = canKnockWith(view.hand, card) ? { knock: card } : { discard: card };
  const offered = ginMoves(game);
  return offered.some((one) => JSON.stringify(one) === JSON.stringify(move)) ? move : offered[0];
}

/** Whether the discard would go straight into a meld: the hand with it and its best throw has less deadwood than now. */
export function wanted(hand: readonly CardId[], card: CardId): boolean {
  const withIt = [...hand, card];
  if (!bestLayout(withIt).melds.some((meld) => meld.includes(card))) return false;
  const after = Math.min(...hand.map((thrown) => deadwoodIn(without(withIt, [thrown])!)));
  return after < deadwoodIn(hand);
}

/** The card to throw: the one leaving the least deadwood; of those, not a card the other player could use, and the highest. */
export function chooseThrow(view: GinView): CardId {
  const throwable = view.hand.filter((card) => card !== view.taken);
  const helps = (card: CardId) =>
    view.theirPicks.some((pick) => (rankOf(pick) === rankOf(card)) || (suitOf(pick) === suitOf(card) && Math.abs(rankOf(pick) - rankOf(card)) <= 2)) ? 1 : 0;
  const cost = (card: CardId) => deadwoodIn(without(view.hand, [card])!);
  return throwable.reduce((best, card) => {
    const a = cost(card);
    const b = cost(best);
    if (a !== b) return a < b ? card : best;
    if (helps(card) !== helps(best)) return helps(card) < helps(best) ? card : best;
    return deadwoodValue(card) > deadwoodValue(best) ? card : best;
  });
}

/**
 * A player the party gate can play at random who still ends a hand: a random
 * draw and a random throw, but a knock whenever the card thrown allows one.
 * A player choosing every move uniformly would almost never knock, and hand
 * after hand would run the stock down to a draw with nobody scoring.
 */
export function ginSensible(game: GinGame, random: () => number): GinMove {
  const offered = ginMoves(game);
  const knocks = offered.filter((move) => "knock" in move);
  if (knocks.length > 0) return knocks[Math.floor(random() * knocks.length)];
  return offered[Math.floor(random() * offered.length)];
}
