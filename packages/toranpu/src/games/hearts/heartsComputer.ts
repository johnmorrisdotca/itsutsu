import type { CardId } from "../cardGames.types.ts";
import { suitOf } from "../cards.ts";

import { QUEEN_OF_SPADES, heartsHeight, heartsMoves, heartsPlayable, heartsPoints, trickWinner } from "./hearts.ts";
import type { HeartsGame, HeartsMove, HeartsPlay } from "./hearts.types.ts";

/**
 * A COMPUTER AT THE HEARTS TABLE, playing as a careful player does: pass the
 * queen of spades and the high cards that would catch her, and a short suit
 * so it can be thrown away; duck under a trick when it can, dump the queen on
 * somebody else the moment it is safe, and never lead a heart for nothing.
 * It does not try to shoot the moon.
 *
 * It reads a view of the game (`heartsView`) holding its own hand and what
 * the whole table has seen, and nothing else: it cannot look at a hand it is
 * not holding.
 */

/** What the seat to move can see: its own hand and the table. */
export type HeartsView = {
  seat: number;
  seats: number;
  hand: readonly CardId[];
  phase: HeartsGame["phase"];
  trick: readonly HeartsPlay[];
  /** Every card already played this deal, finished tricks and the one on the table. */
  seen: ReadonlySet<CardId>;
  playable: readonly CardId[];
};

export function heartsView(game: HeartsGame): HeartsView {
  const seat = game.toPlay ?? 0;
  return {
    seat,
    seats: game.players.length,
    hand: game.hands[seat],
    phase: game.phase,
    trick: game.trick,
    seen: new Set([...game.played, ...game.trick.map((play) => play.card)]),
    playable: heartsPlayable(game),
  };
}

export function heartsComputer(game: HeartsGame): HeartsMove {
  const view = heartsView(game);
  if (view.phase === "passing") {
    // In the order the hand holds them, as the rules list a pass.
    const chosen = choosePass(view.hand);
    return { pass: view.hand.filter((card) => chosen.includes(card)) };
  }
  const card = chooseCard(view);
  // Never a card the rules would refuse: fall back on the first they offer.
  return view.playable.includes(card) ? { play: card } : heartsMoves(game)[0];
}

/** How much a card is worth passing on: the queen and her guards, high hearts, and the last cards of a short suit. */
function passWorth(card: CardId, hand: readonly CardId[]): number {
  const suit = suitOf(card);
  const count = hand.filter((held) => suitOf(held) === suit).length;
  const height = heartsHeight(card);
  if (suit === "S") {
    // Four or five spades below her keep the queen safe; fewer, and she and the cards above her must go.
    const guarded = count >= 5;
    if (card === QUEEN_OF_SPADES) return guarded ? 0 : 100;
    if (height > 12) return guarded ? 5 : 80 + height;
    return 0;
  }
  if (suit === "H") return height >= 11 ? 40 + height : height;
  // A club or diamond from a short suit, highest first, to leave a void to throw points into.
  return height * 2 + (count <= 3 ? 30 - count * 5 : 0);
}

export function choosePass(hand: readonly CardId[]): CardId[] {
  return [...hand]
    .sort((a, b) => passWorth(b, hand) - passWorth(a, hand) || heartsHeight(b) - heartsHeight(a))
    .slice(0, 3);
}

const highest = (cards: readonly CardId[]) => cards.reduce((best, card) => (heartsHeight(card) > heartsHeight(best) ? card : best));
const lowest = (cards: readonly CardId[]) => cards.reduce((best, card) => (heartsHeight(card) < heartsHeight(best) ? card : best));

function chooseCard(view: HeartsView): CardId {
  const { playable } = view;
  if (playable.length === 1) return playable[0];
  const queenOut = !view.seen.has(QUEEN_OF_SPADES) && !view.hand.includes(QUEEN_OF_SPADES);
  if (view.trick.length === 0) return lead(view, queenOut);
  const led = suitOf(view.trick[0].card);
  const following = playable.filter((card) => suitOf(card) === led);
  return following.length > 0 ? follow(view, following) : discard(view, queenOut);
}

/**
 * Leading: the lowest card that is safe to lead. A low spade when the queen is
 * still out and it cannot be caught under her; never the queen, and never a
 * spade above her while she is out; a heart only when it is low.
 */
function lead(view: HeartsView, queenOut: boolean): CardId {
  const holdsQueen = view.hand.includes(QUEEN_OF_SPADES);
  const cost = (card: CardId) => {
    const height = heartsHeight(card);
    const suit = suitOf(card);
    if (card === QUEEN_OF_SPADES) return 100;
    if (suit === "S") {
      if (height > 12 && (queenOut || holdsQueen)) return 90 + height;
      // Flushing her out: lead low spades while she is out and nothing of ours can catch her.
      return queenOut && !view.hand.some((held) => suitOf(held) === "S" && heartsHeight(held) > 12) ? height - 10 : height;
    }
    return suit === "H" ? height + 4 : height;
  };
  return view.playable.reduce((best, card) => (cost(card) < cost(best) ? card : best));
}

/** Following suit: duck under the trick with the highest card that still loses it, or win it as cheaply as the trick allows. */
function follow(view: HeartsView, following: readonly CardId[]): CardId {
  const winning = view.trick.find((play) => play.seat === trickWinner(view.trick))!.card;
  const top = heartsHeight(winning);
  // The queen goes on the king or ace of spades the moment one is winning.
  if (following.includes(QUEEN_OF_SPADES) && top > 12) return QUEEN_OF_SPADES;
  const under = following.filter((card) => heartsHeight(card) < top);
  if (under.length > 0) return highest(under);
  const last = view.trick.length === view.seats - 1;
  const notQueen = following.filter((card) => card !== QUEEN_OF_SPADES);
  const pointsOnIt = view.trick.some((play) => heartsPoints(play.card) > 0);
  if (notQueen.length === 0) return following[0];
  // This trick is ours whatever we play: last to play on a clean trick, take it with the highest; otherwise the lowest risks least.
  return last && !pointsOnIt ? highest(notQueen) : last ? lowest(notQueen) : highest(notQueen);
}

/** Nothing of the suit led: throw the queen, then the spades that would catch her, then the highest heart, then the highest card. */
function discard(view: HeartsView, queenOut: boolean): CardId {
  const { playable } = view;
  if (playable.includes(QUEEN_OF_SPADES)) return QUEEN_OF_SPADES;
  const guards = playable.filter((card) => suitOf(card) === "S" && heartsHeight(card) > 12);
  if (queenOut && guards.length > 0) return highest(guards);
  const hearts = playable.filter((card) => suitOf(card) === "H");
  if (hearts.length > 0) return highest(hearts);
  return highest(playable);
}
