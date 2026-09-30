import type { CardId, CardSuit } from "../cardGames.types";
import { rankOf, suitOf } from "../cards";

import { EUCHRE_SEATS, dealerOf, euchreHeight, euchreMoves, euchrePlayable, euchreTrickWinner, partnerOf, suitIn, teamOf } from "./euchre";
import type { EuchreGame, EuchreMove, EuchrePlay } from "./euchre.types";

/**
 * A COMPUTER AT THE EUCHRE TABLE. Making trumps, it weighs its hand in each
 * suit — the bowers, the trump ace and king, the aces outside and the suits
 * it is short in — and orders up or names a suit only with a hand that should
 * take three tricks with its partner's help, counting the turned card for its
 * own side when it or its partner deals. Stuck as dealer, it names its best.
 * Playing, it leads its best trump when its side made them, cashes aces,
 * leaves a trick its partner has won alone, and takes a trick as cheaply as
 * it can.
 *
 * It reads a view of the game (`euchreView`): its own hand, the card turned
 * up, the making so far and the cards played — nothing of another hand.
 */
export type EuchreView = {
  seat: number;
  dealer: number;
  hand: readonly CardId[];
  phase: EuchreGame["phase"];
  upcard: CardId;
  trump: CardSuit | null;
  maker: number | null;
  trick: readonly EuchrePlay[];
  tricks: readonly number[];
  seen: ReadonlySet<CardId>;
  playable: readonly CardId[];
};

export function euchreView(game: EuchreGame): EuchreView {
  const seat = game.toPlay ?? 0;
  return {
    seat,
    dealer: dealerOf(game.deal),
    hand: game.hands[seat],
    phase: game.phase,
    upcard: game.upcard,
    trump: game.trump,
    maker: game.maker,
    trick: game.trick,
    tricks: game.tricks,
    seen: new Set([...game.played, ...game.trick.map((play) => play.card)]),
    playable: euchrePlayable(game),
  };
}

/** How much a hand is worth with this suit as trumps, roughly in tricks. */
export function trumpWorth(hand: readonly CardId[], trump: CardSuit): number {
  let worth = 0;
  const trumps = hand.filter((card) => suitIn(card, trump) === trump);
  for (const card of trumps) {
    const height = euchreHeight(card, trump);
    worth += height === 20 ? 1.2 : height === 19 ? 1 : height === 14 ? 0.85 : height === 13 ? 0.65 : 0.45;
  }
  for (const suit of ["C", "D", "H", "S"] as const) {
    if (suit === trump) continue;
    const side = hand.filter((card) => suitIn(card, trump) === suit);
    if (side.some((card) => rankOf(card) === 1)) worth += side.length <= 2 ? 0.8 : 0.5;
    // A suit missing is a trick to trump, if there are trumps to do it with.
    if (side.length === 0 && trumps.length >= 2) worth += 0.35;
  }
  return worth;
}

/** The worth a side needs to make trumps: three tricks between two hands, one of them this one. */
const MAKE = 2.1;

export function euchreComputer(game: EuchreGame): EuchreMove {
  const view = euchreView(game);
  const offered = euchreMoves(game);
  const choice = choose(view);
  return offered.some((move) => JSON.stringify(move) === JSON.stringify(choice)) ? choice : offered[0];
}

function choose(view: EuchreView): EuchreMove {
  if (view.phase === "order") {
    const suit = suitOf(view.upcard);
    let worth = trumpWorth(view.hand, suit);
    // The turned card goes to the dealer: a gift to the dealer's side, and to the other side a trump handed over.
    const upcardWorth = trumpWorth([view.upcard], suit);
    if (view.seat === view.dealer) worth = trumpWorth([...view.hand, view.upcard], suit) - 0.3;
    else if (partnerOf(view.seat) === view.dealer) worth += upcardWorth * 0.8;
    else worth -= upcardWorth * 0.6;
    return worth >= MAKE ? { order: true } : { pass: true };
  }
  if (view.phase === "call") {
    const suits = (["C", "D", "H", "S"] as const).filter((suit) => suit !== suitOf(view.upcard));
    const best = suits.reduce((a, b) => (trumpWorth(view.hand, b) > trumpWorth(view.hand, a) ? b : a));
    if (view.seat === view.dealer || trumpWorth(view.hand, best) >= MAKE) return { call: best };
    return { pass: true };
  }
  if (view.phase === "discard") return { discard: throwAway(view.hand, view.trump!) };
  return { play: chooseCard(view) };
}

/** After picking the turned card up: the lowest card outside trumps, from the shortest suit, never an ace. */
export function throwAway(hand: readonly CardId[], trump: CardSuit): CardId {
  const side = hand.filter((card) => suitIn(card, trump) !== trump);
  const pool = side.length > 0 ? side : [...hand];
  const length = (card: CardId) => hand.filter((held) => suitIn(held, trump) === suitIn(card, trump)).length;
  const cost = (card: CardId) => (rankOf(card) === 1 ? 50 : 0) + length(card) * 5 + euchreHeight(card, trump);
  return pool.reduce((best, card) => (cost(card) < cost(best) ? card : best));
}

function chooseCard(view: EuchreView): CardId {
  const { playable, trump, seat } = view;
  const t = trump!;
  if (playable.length === 1) return playable[0];
  const height = (card: CardId) => (suitIn(card, t) === t ? 100 : 0) + euchreHeight(card, t);
  const highest = (cards: readonly CardId[]) => cards.reduce((a, b) => (height(b) > height(a) ? b : a));
  const lowest = (cards: readonly CardId[]) => cards.reduce((a, b) => (height(b) < height(a) ? b : a));
  const trumps = playable.filter((card) => suitIn(card, t) === t);

  if (view.trick.length === 0) {
    // Our side made trumps: draw them out with the top trump. Otherwise cash an ace, else lead low.
    if (view.maker !== null && teamOf(view.maker) === teamOf(seat) && trumps.length > 0) {
      const top = highest(trumps);
      if (euchreHeight(top, t) >= 19 || trumps.length >= 3) return top;
    }
    const aces = playable.filter((card) => suitIn(card, t) !== t && rankOf(card) === 1);
    if (aces.length > 0) return aces[0];
    const side = playable.filter((card) => suitIn(card, t) !== t);
    return lowest(side.length > 0 ? side : playable);
  }
  const wins = (card: CardId) => euchreTrickWinner([...view.trick, { seat, card }], t) === seat;
  const winners = playable.filter(wins);
  const winning = euchreTrickWinner(view.trick, t);
  const last = view.trick.length === EUCHRE_SEATS - 1;
  const partnerCard = view.trick.find((play) => play.seat === winning)?.card;
  const partnerSafe = winning === partnerOf(seat) && partnerCard !== undefined && (last || height(partnerCard) >= 114 || (suitIn(partnerCard, t) !== t && rankOf(partnerCard) === 1));
  if (partnerSafe || winners.length === 0) return lowest(playable);
  // Last to play, or not: take it with the least that wins when last, the most when others are still to come.
  return last ? lowest(winners) : highest(winners);
}
