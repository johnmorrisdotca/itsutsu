import { computerSeats } from "../cardGameCodec.ts";
import { GIN_SIZES } from "../cardGames.constants.ts";
import type { CardId } from "../cardGames.types.ts";
import { dealRound, rankOf, shuffledDeck, suitOf, without } from "../cards.ts";

import type { GinGame, GinLayout, GinMeld, GinMove, GinResult } from "./ginRummy.types.ts";

/**
 * GIN RUMMY: the rules, and nothing else.
 *
 * Two players, ten cards each; the rest is the stock, its top card turned up
 * to start the discard pile. On your turn draw one card — the stock's top or
 * the discard pile's — then throw one onto the pile (never the one you just
 * took from it). Melds are three or four of a rank, or three or more in a row
 * of one suit, ace low. Every card in no meld is deadwood: an ace one, a face
 * card ten, the rest their number. With ten or fewer points of deadwood you
 * may knock instead of throwing: the other player lays their own melds, lays
 * off what fits onto yours, and the difference in deadwood is yours — unless
 * they have as little or less, which is an undercut and theirs, with 25 more.
 * Knock with no deadwood at all and it is gin: 25 and all their deadwood, and
 * nothing laid off. With two cards left in the stock and nobody out, the hand
 * is drawn. The first to the game's total wins.
 *
 * Pure: every function returns a new game and leaves the one given alone.
 */

export const GIN_SEATS = 2;
const DEALT = 10;
/** The most deadwood a player may knock with. */
export const KNOCK_MOST = 10;
/** The bonus for gin, and for an undercut. */
export const GIN_BONUS = 25;
export const UNDERCUT_BONUS = 25;
/** The stock is played down to this many, and then the hand is drawn. */
const STOCK_LEFT = 2;

/** A card's deadwood: an ace one, the numbers their number, a jack, queen or king ten. */
export function deadwoodValue(card: CardId): number {
  return Math.min(10, rankOf(card));
}

export function deadwoodOf(cards: readonly CardId[]): number {
  return cards.reduce((sum, card) => sum + deadwoodValue(card), 0);
}

/** A hand sorted as a player holds it: by suit (spades, hearts, clubs, diamonds, as the colours alternate), ace low. */
export function sortGin(hand: readonly CardId[]): CardId[] {
  const order = "SHCD";
  return [...hand].sort((a, b) => order.indexOf(suitOf(a)) - order.indexOf(suitOf(b)) || rankOf(a) - rankOf(b));
}

/** Whether these cards are a meld: three or four of a rank, or three or more in a row in one suit. */
export function isMeld(cards: readonly CardId[]): boolean {
  if (cards.length < 3) return false;
  if (cards.every((card) => rankOf(card) === rankOf(cards[0]))) return cards.length <= 4;
  if (!cards.every((card) => suitOf(card) === suitOf(cards[0]))) return false;
  const ranks = cards.map(rankOf).sort((a, b) => a - b);
  return ranks.every((rank, at) => at === 0 || rank === ranks[at - 1] + 1);
}

/** Every meld that can be made from these cards: each set of three or four, and each run of three or more. */
export function meldsIn(hand: readonly CardId[]): GinMeld[] {
  const melds: GinMeld[] = [];
  for (let rank = 1; rank <= 13; rank += 1) {
    const same = hand.filter((card) => rankOf(card) === rank);
    if (same.length >= 3) melds.push(same);
    if (same.length === 4) for (let skip = 0; skip < 4; skip += 1) melds.push(same.filter((_, at) => at !== skip));
  }
  for (const suit of ["C", "D", "H", "S"] as const) {
    const cards = hand.filter((card) => suitOf(card) === suit).sort((a, b) => rankOf(a) - rankOf(b));
    for (let from = 0; from < cards.length; from += 1) {
      for (let to = from + 2; to < cards.length; to += 1) {
        const run = cards.slice(from, to + 1);
        if (rankOf(run.at(-1)!) - rankOf(run[0]) !== run.length - 1) break;
        melds.push(run);
      }
    }
  }
  return melds;
}

/**
 * The hand laid out to leave the least deadwood: the melds chosen, none
 * sharing a card, and what is left. Searched exhaustively over the cards as
 * a bitmask, which for eleven cards at most is quick.
 */
export function bestLayout(hand: readonly CardId[]): GinLayout {
  const cards = [...hand];
  const masks = meldsIn(cards).map((meld) => meld.reduce((mask, card) => mask | (1 << cards.indexOf(card)), 0));
  const memo = new Map<number, { dead: number; melds: number[] }>();
  const best = (mask: number): { dead: number; melds: number[] } => {
    if (mask === 0) return { dead: 0, melds: [] };
    const known = memo.get(mask);
    if (known !== undefined) return known;
    const low = mask & -mask;
    const at = 31 - Math.clz32(low);
    // The lowest card left is deadwood, or it is in one of the melds that fits in what is left.
    const rest = best(mask & ~low);
    let found = { dead: rest.dead + deadwoodValue(cards[at]), melds: rest.melds };
    for (const meld of masks) {
      if ((meld & low) === 0 || (meld & mask) !== meld) continue;
      const after = best(mask & ~meld);
      if (after.dead < found.dead) found = { dead: after.dead, melds: [meld, ...after.melds] };
    }
    memo.set(mask, found);
    return found;
  };
  const { melds } = best((1 << cards.length) - 1);
  const used = melds.reduce((all, mask) => all | mask, 0);
  return {
    melds: melds.map((mask) => sortGin(cards.filter((_, at) => (mask & (1 << at)) !== 0))),
    deadwood: sortGin(cards.filter((_, at) => (used & (1 << at)) === 0)),
  };
}

/** The deadwood left in a hand at its best. */
export function deadwoodIn(hand: readonly CardId[]): number {
  return deadwoodOf(bestLayout(hand).deadwood);
}

/** A new hand: ten each, the stock's top card turned up, and the first player alternating hand by hand. */
function dealGin(game: Omit<GinGame, "hands" | "stock" | "discard" | "taken" | "toPlay" | "phase" | "picked" | "throws">): GinGame {
  const { hands, stock } = dealRound(shuffledDeck(game.seed, game.hand), GIN_SEATS, DEALT);
  return { ...game, phase: "draw", hands: hands.map(sortGin), stock: stock.slice(1), discard: [stock[0]], taken: null, picked: [[], []], throws: 0, toPlay: game.hand % GIN_SEATS };
}

export function startGin(size: number, players: readonly string[], _language?: unknown, dealt?: number, computers?: readonly boolean[]): GinGame | null {
  if (!(GIN_SIZES as readonly number[]).includes(size)) return null;
  if (players.length !== GIN_SEATS) return null;
  return dealGin({ size, players: [...players], computers: computerSeats(players.length, computers), seed: dealt ?? 1, moves: [], hand: 0, scores: [0, 0], results: [] });
}

/** Whether throwing this card, from a hand of eleven, leaves little enough deadwood to knock with. */
export function canKnockWith(hand: readonly CardId[], card: CardId): boolean {
  const left = without(hand, [card]);
  return left !== null && deadwoodIn(left) <= KNOCK_MOST;
}

export function ginMoves(game: GinGame): GinMove[] {
  if (game.toPlay === null) return [];
  if (game.phase === "draw") return game.discard.length > 0 ? [{ draw: "stock" }, { draw: "discard" }] : [{ draw: "stock" }];
  if (game.phase !== "discard") return [];
  const hand = game.hands[game.toPlay];
  const throwable = hand.filter((card) => card !== game.taken);
  return [...throwable.map((card): GinMove => ({ discard: card })), ...throwable.filter((card) => canKnockWith(hand, card)).map((card): GinMove => ({ knock: card }))];
}

/** Whether a card can be laid off onto a meld: the fourth of a set, or the next card at either end of a run. */
function fits(meld: readonly CardId[], card: CardId): boolean {
  return !meld.includes(card) && isMeld([...meld, card]);
}

/**
 * The defender's side of a knock: their own melds first, then every card left
 * that fits one of the knocker's melds laid off onto it — a run grown one card
 * at a time, so a six can follow the five just laid.
 */
export function layOff(defender: readonly CardId[], knockerMelds: readonly GinMeld[]): { layout: GinLayout; laidOff: CardId[]; melds: GinMeld[] } {
  const layout = bestLayout(defender);
  const melds = knockerMelds.map((meld) => [...meld]);
  let deadwood = [...layout.deadwood];
  const laidOff: CardId[] = [];
  for (let grew = true; grew; ) {
    grew = false;
    for (const card of deadwood) {
      const onto = melds.find((meld) => fits(meld, card));
      if (onto === undefined) continue;
      onto.push(card);
      laidOff.push(card);
      deadwood = deadwood.filter((held) => held !== card);
      grew = true;
    }
  }
  return { layout: { melds: layout.melds, deadwood }, laidOff, melds: melds.map(sortGin) };
}

/** The hand is over: a knock scored (or gin, or an undercut), or the stock run down; then the game ends or the next hand is dealt. */
function endHand(game: GinGame, result: GinResult): GinGame {
  const scores = game.scores.map((score, seat) => (seat === result.winner ? score + result.points : score));
  const finished: GinGame = { ...game, scores, results: [...game.results, result], taken: null };
  if (scores.some((score) => score >= game.size)) return { ...finished, phase: "over", toPlay: null };
  return dealGin({ ...finished, hand: game.hand + 1 });
}

/** A knock, with this hand of ten left after the card thrown: every hand laid out and scored. */
function knock(game: GinGame, knocker: number, hands: CardId[][]): GinResult {
  const defender = 1 - knocker;
  const mine = bestLayout(hands[knocker]);
  const mineDead = deadwoodOf(mine.deadwood);
  if (mineDead === 0) {
    const theirs = bestLayout(hands[defender]);
    const layouts = [mine, theirs];
    if (knocker === 1) layouts.reverse();
    return { knocker, winner: knocker, points: GIN_BONUS + deadwoodOf(theirs.deadwood), kind: "gin", layouts, laidOff: [] };
  }
  const { layout, laidOff, melds } = layOff(hands[defender], mine.melds);
  const theirDead = deadwoodOf(layout.deadwood);
  const knocked: GinLayout = { melds, deadwood: mine.deadwood };
  const layouts = knocker === 0 ? [knocked, layout] : [layout, knocked];
  if (theirDead <= mineDead) return { knocker, winner: defender, points: mineDead - theirDead + UNDERCUT_BONUS, kind: "undercut", layouts, laidOff };
  return { knocker, winner: knocker, points: theirDead - mineDead, kind: "knock", layouts, laidOff };
}

function draw(game: GinGame, seat: number, from: "stock" | "discard"): GinGame | null {
  if (from === "stock") {
    if (game.stock.length === 0) return null;
    const hands = game.hands.map((hand, at) => (at === seat ? sortGin([...hand, game.stock[0]]) : hand));
    return { ...game, hands, stock: game.stock.slice(1), phase: "discard", taken: null };
  }
  const top = game.discard.at(-1);
  if (top === undefined) return null;
  const hands = game.hands.map((hand, at) => (at === seat ? sortGin([...hand, top]) : hand));
  const picked = game.picked.map((cards, at) => (at === seat ? [...cards, top] : cards));
  return { ...game, hands, discard: game.discard.slice(0, -1), phase: "discard", taken: top, picked };
}

function throwCard(game: GinGame, seat: number, card: CardId, knocking: boolean): GinGame | null {
  if (card === game.taken) return null;
  const left = without(game.hands[seat], [card]);
  if (left === null) return null;
  if (knocking && deadwoodIn(left) > KNOCK_MOST) return null;
  const hands = game.hands.map((hand, at) => (at === seat ? left : hand));
  const picked = game.picked.map((cards, at) => (at === seat ? cards.filter((held) => held !== card) : cards));
  const thrown: GinGame = { ...game, hands, discard: [...game.discard, card], taken: null, picked, throws: game.throws + 1 };
  if (knocking) return endHand(thrown, knock(thrown, seat, hands));
  if (thrown.stock.length <= STOCK_LEFT) {
    const layouts = hands.map(bestLayout);
    return endHand(thrown, { knocker: null, winner: null, points: 0, kind: "drawn", layouts, laidOff: [] });
  }
  return { ...thrown, phase: "draw", toPlay: 1 - seat };
}

export function playGin(game: GinGame, move: GinMove): GinGame | null {
  if (game.toPlay === null) return null;
  const seat = game.toPlay;
  let next: GinGame | null = null;
  if ("draw" in move) next = game.phase === "draw" && (move.draw === "stock" || move.draw === "discard") ? draw(game, seat, move.draw) : null;
  else if ("discard" in move) next = game.phase === "discard" ? throwCard(game, seat, move.discard, false) : null;
  else if ("knock" in move) next = game.phase === "discard" ? throwCard(game, seat, move.knock, true) : null;
  return next === null ? null : { ...next, moves: [...game.moves, move] };
}

/** The first to the game's total wins. */
export function ginWinners(game: GinGame): number[] {
  if (game.phase !== "over") return [];
  const best = Math.max(...game.scores);
  return game.scores.flatMap((score, seat) => (score === best ? [seat] : []));
}
