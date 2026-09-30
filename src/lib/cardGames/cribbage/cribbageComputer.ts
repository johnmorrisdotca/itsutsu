import type { CardId } from "../cardGames.types";
import { FULL_DECK, rankOf } from "../cards";

import { cardValue, cribPairs, cribbageMoves, cribbagePlayable, dealerOf, pegPoints, showCount } from "./cribbage";
import type { CribbageGame, CribbageMove } from "./cribbage.types";

/**
 * A COMPUTER AT THE CRIBBAGE TABLE. Laying away, it tries every two cards it
 * could throw and keeps the four whose show is worth most on average over
 * every starter it might be cut, adding what the two thrown are worth to its
 * own crib or taking it off the other player's. Pegging, it takes the most
 * points a card can make now, and otherwise keeps the count off five and
 * twenty-one (a ten makes fifteen or thirty-one of them), leads low, and
 * never leads a five.
 *
 * It reads a view of the game (`cribbageView`): its own hand and what is on
 * the table — nothing of the other hand, the crib, or the card to be cut.
 */
export type CribbageView = {
  seat: number;
  dealer: number;
  phase: CribbageGame["phase"];
  hand: readonly CardId[];
  count: number;
  run: readonly CardId[];
};

export function cribbageView(game: CribbageGame): CribbageView {
  const seat = game.toPlay ?? 0;
  return { seat, dealer: dealerOf(game.deal), phase: game.phase, hand: game.hands[seat], count: game.count, run: game.run.map((play) => play.card) };
}

/** What two cards thrown to a crib are worth to it, roughly: a pair, a fifteen, fives, and cards close enough to run. */
export function throwWorth([a, b]: readonly [CardId, CardId]): number {
  let worth = 0;
  if (rankOf(a) === rankOf(b)) worth += 2;
  if (cardValue(a) + cardValue(b) === 15) worth += 2;
  worth += [a, b].filter((card) => rankOf(card) === 5).length * 1.5;
  if (Math.abs(rankOf(a) - rankOf(b)) === 1) worth += 0.5;
  return worth;
}

/** The two cards to lay away: the four kept worth most on average with every starter, the crib counted for or against. */
export function chooseCrib(hand: readonly CardId[], ownCrib: boolean): [CardId, CardId] {
  const starters = FULL_DECK.filter((card) => !hand.includes(card));
  let best = cribPairs(hand)[0];
  let bestWorth = -Infinity;
  for (const pair of cribPairs(hand)) {
    const kept = hand.filter((card) => !pair.includes(card));
    let total = 0;
    for (const starter of starters) total += showCount(kept, starter).total;
    const worth = total / starters.length + (ownCrib ? 1 : -1) * throwWorth(pair);
    if (worth > bestWorth) {
      bestWorth = worth;
      best = pair;
    }
  }
  return best;
}

/** The card to peg: most points now, then a count kept off five and twenty-one, a low lead that is not a five. */
export function choosePeg(view: CribbageView): CardId {
  const playable = cribbagePlayable(view.hand, view.count);
  const worth = (card: CardId) => {
    const count = view.count + cardValue(card);
    let value = pegPoints([...view.run, card], count).points * 10;
    if (count === 5 || count === 21) value -= 3;
    if (view.count === 0) value += rankOf(card) === 5 ? -4 : cardValue(card) < 5 ? 2 : 0;
    // Otherwise spend the higher cards, keeping the low ones for the end of a count.
    return value + cardValue(card) / 20;
  };
  return playable.reduce((best, card) => (worth(card) > worth(best) ? card : best));
}

export function cribbageComputer(game: CribbageGame): CribbageMove {
  const view = cribbageView(game);
  if (view.phase === "crib") return { crib: chooseCrib(view.hand, view.seat === view.dealer) };
  const moves = cribbageMoves(game);
  return moves.length === 0 ? { play: view.hand[0] } : { play: choosePeg(view) };
}
