import type { CardId, CardSuit } from "../cardGames.types.ts";
import { suitOf } from "../cards.ts";

import { NIL, SPADES_SEATS, partnerOf, spadesHeight, spadesMoves, spadesPlayable, spadesTrickWinner } from "./spades.ts";
import type { SpadesGame, SpadesMove, SpadesPlay } from "./spades.types.ts";

/**
 * A COMPUTER AT THE SPADES TABLE, bidding and playing as a steady partner:
 * it bids the tricks its hand is worth — aces, guarded kings, long and high
 * spades, the short suits it can trump — and nil only with a hand of nothing.
 * Playing, it takes the tricks its partnership still needs as cheaply as it
 * can, leaves a trick its partner is winning alone, ducks once the contract
 * is made (every overtrick is a bag), keeps out of the tricks when it bid nil,
 * and covers its partner's nil.
 *
 * It reads a view of the game (`spadesView`) holding its own hand, the bids
 * and what the whole table has seen, and nothing else: it cannot look at a
 * hand it is not holding.
 */

/** What the seat to move can see: its own hand, every bid, the tricks taken and the cards played. */
export type SpadesView = {
  seat: number;
  hand: readonly CardId[];
  phase: SpadesGame["phase"];
  bids: readonly (number | null)[];
  tricks: readonly number[];
  trick: readonly SpadesPlay[];
  /** Every card already played this deal, finished tricks and the one on the table. */
  seen: ReadonlySet<CardId>;
  playable: readonly CardId[];
};

export function spadesView(game: SpadesGame): SpadesView {
  const seat = game.toPlay ?? 0;
  return {
    seat,
    hand: game.hands[seat],
    phase: game.phase,
    bids: game.bids,
    tricks: game.tricks,
    trick: game.trick,
    seen: new Set([...game.played, ...game.trick.map((play) => play.card)]),
    playable: spadesPlayable(game),
  };
}

export function spadesComputer(game: SpadesGame): SpadesMove {
  const view = spadesView(game);
  if (view.phase === "bidding") return { bid: chooseBid(view.hand, view.bids[partnerOf(view.seat)]) };
  const card = chooseCard(view);
  // Never a card the rules would refuse: fall back on the first they offer.
  return view.playable.includes(card) ? { play: card } : spadesMoves(game)[0];
}

const ofSuit = (hand: readonly CardId[], suit: CardSuit) => hand.filter((card) => suitOf(card) === suit);

/** The tricks a hand is worth, counted as a card player counts them before bidding. */
export function handWorth(hand: readonly CardId[]): number {
  let worth = 0;
  const spades = ofSuit(hand, "S");
  for (const suit of ["C", "D", "H"] as const) {
    const cards = ofSuit(hand, suit);
    const heights = cards.map(spadesHeight);
    if (heights.includes(14)) worth += cards.length <= 6 ? 1 : 0.6;
    if (heights.includes(13)) worth += cards.length >= 2 && cards.length <= 5 ? 0.75 : 0.25;
    if (heights.includes(12) && cards.length >= 3 && cards.length <= 4) worth += 0.35;
    // A short suit is a trick for a spade not otherwise needed, beside three or four spades; five or more are counted by length below.
    const short = spades.length >= 3 && spades.length <= 4;
    if (short && cards.length === 0) worth += 0.8;
    else if (short && cards.length === 1) worth += 0.4;
  }
  const high = spades.map(spadesHeight);
  if (high.includes(14)) worth += 1;
  if (high.includes(13)) worth += spades.length >= 2 ? 0.9 : 0.3;
  if (high.includes(12)) worth += spades.length >= 3 ? 0.6 : 0.2;
  // Every spade past the third is all but sure to take a trick at the end.
  worth += Math.max(0, spades.length - 3) * 0.85;
  return worth;
}

/** Nil for a hand of nothing (and never beside a partner's nil); otherwise what the hand is worth, at least one. */
export function chooseBid(hand: readonly CardId[], partnerBid: number | null): number {
  const worth = handWorth(hand);
  const spades = ofSuit(hand, "S").map(spadesHeight);
  const safeForNil = worth < 1 && spades.length <= 3 && spades.every((height) => height <= 10) && hand.every((card) => spadesHeight(card) <= 12);
  if (safeForNil && partnerBid !== NIL) return NIL;
  return Math.max(1, Math.min(13, Math.round(worth + 0.25)));
}

const highest = (cards: readonly CardId[]) => cards.reduce((best, card) => (spadesHeight(card) > spadesHeight(best) ? card : best));
const lowest = (cards: readonly CardId[]) => cards.reduce((best, card) => (spadesHeight(card) < spadesHeight(best) ? card : best));

/** Whether this card, laid now, would be taking the trick. */
function wouldWin(trick: readonly SpadesPlay[], seat: number, card: CardId): boolean {
  return spadesTrickWinner([...trick, { seat, card }]) === seat;
}

/** Whether nobody still to play can hold a card above this one of its suit: every higher card of it is seen or ours. */
function topOfSuit(card: CardId, view: SpadesView): boolean {
  const suit = suitOf(card);
  for (let height = spadesHeight(card) + 1; height <= 14; height += 1) {
    const rank = height === 14 ? "A" : "23456789TJQK"[height - 2];
    const higher = `${rank}${suit}`;
    if (!view.seen.has(higher) && !view.hand.includes(higher)) return false;
  }
  return true;
}

function chooseCard(view: SpadesView): CardId {
  const { playable, seat } = view;
  if (playable.length === 1) return playable[0];
  const partner = partnerOf(seat);
  const myNil = view.bids[seat] === NIL && view.tricks[seat] === 0;
  const partnerNil = view.bids[partner] === NIL && view.tricks[partner] === 0;
  const contract = [seat, partner].reduce((sum, at) => sum + (view.bids[at] ?? 0), 0);
  const taken = [seat, partner].reduce((sum, at) => sum + (view.bids[at] === NIL ? 0 : view.tricks[at]), 0);
  const needed = contract - taken > 0;

  if (myNil) return keepOut(view);
  if (view.trick.length === 0) return lead(view, needed || partnerNil);
  const winning = spadesTrickWinner(view.trick);
  const last = view.trick.length === SPADES_SEATS - 1;
  const winners = playable.filter((card) => wouldWin(view.trick, seat, card));
  // Covering a partner's nil: take the trick from them whenever they are winning it, or may yet.
  if (partnerNil && (winning === partner || !view.trick.some((play) => play.seat === partner))) {
    return winners.length > 0 ? (last ? lowest(winners) : highest(winners)) : lowest(playable);
  }
  if (winning === partner) {
    const safe = last || topOfSuit(view.trick.find((play) => play.seat === partner)!.card, view);
    if (safe) return needed ? shed(view) : duck(view);
  }
  if (!needed) return duck(view);
  if (winners.length === 0) return shed(view);
  // Take it: the cheapest card that wins when last, or the surest when others are still to play.
  if (last) return lowest(winners);
  const sure = winners.filter((card) => topOfSuit(card, view) && suitOf(card) === suitOf(view.trick[0].card));
  if (sure.length > 0) return lowest(sure);
  // Trumping, the lowest spade that wins; following, the highest card, the hardest to overtake.
  return suitOf(winners[0]) === "S" && suitOf(view.trick[0].card) !== "S" ? lowest(winners) : highest(winners);
}

/** Giving the trick up while tricks are still wanted: the lowest card that loses it, keeping the high ones for later. */
function shed(view: SpadesView): CardId {
  const losing = view.playable.filter((card) => !wouldWin(view.trick, view.seat, card));
  if (losing.length === 0) return lowest(view.playable);
  const offSuit = losing.filter((card) => suitOf(card) !== "S");
  return lowest(offSuit.length > 0 ? offSuit : losing);
}

/** Losing the trick once the contract is made, since every trick over it is a bag: the highest card that still loses, else — having to win it — the lowest. */
function duck(view: SpadesView): CardId {
  const losing = view.playable.filter((card) => !wouldWin(view.trick, view.seat, card));
  if (losing.length === 0) return lowest(view.playable);
  // Throwing off: a card of a short side suit, keeping spades for later.
  const offSuit = losing.filter((card) => suitOf(card) !== "S");
  return highest(offSuit.length > 0 ? offSuit : losing);
}

/** Leading: a card sure to win when tricks are wanted, else a low card of a short side suit, making a void to trump. */
function lead(view: SpadesView, wanted: boolean): CardId {
  const { playable } = view;
  if (wanted) {
    const sure = playable.filter((card) => topOfSuit(card, view) && (suitOf(card) === "S" || spadesHeight(card) >= 12));
    if (sure.length > 0) return highest(sure);
  }
  const side = playable.filter((card) => suitOf(card) !== "S");
  if (side.length === 0) return wanted ? highest(playable) : lowest(playable);
  const length = (card: CardId) => ofSuit(view.hand, suitOf(card)).length;
  return side.reduce((best, card) => (length(card) < length(best) || (length(card) === length(best) && spadesHeight(card) < spadesHeight(best)) ? card : best));
}

/** Bid nil and clean so far: lead low, stay under whatever is winning, and throw the high cards when void. */
function keepOut(view: SpadesView): CardId {
  const { playable } = view;
  if (view.trick.length === 0) {
    const side = playable.filter((card) => suitOf(card) !== "S");
    return lowest(side.length > 0 ? side : playable);
  }
  const under = playable.filter((card) => !wouldWin(view.trick, view.seat, card));
  if (under.length === 0) return lowest(playable);
  // Following, the highest card that still loses; void, the most dangerous card in the hand.
  return highest(under);
}
