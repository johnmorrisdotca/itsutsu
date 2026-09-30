import type { CardId, CardSuit } from "../cardGames.types.ts";
import { choices, rankOf, suitOf } from "../cards.ts";

/**
 * WHAT A PLAY IS WORTH IN BIG TWO, and every play a hand could make.
 *
 * The ranks run 3 low to 2 high (3 4 5 6 7 8 9 10 J Q K A 2), and between
 * cards of one rank the suits run diamonds, clubs, hearts, spades — so the
 * three of diamonds is the lowest card in the pack and the two of spades the
 * highest. A play is a single, a pair, three of a kind, or a five-card hand:
 * a straight, a flush, a full house, four of a kind with any fifth card, or a
 * straight flush, ranked in that order. A straight is five ranks in a row
 * from 3-4-5-6-7 up to 10-J-Q-K-A; a two never sits in one.
 */

export type BigTwoKind = "single" | "pair" | "triple" | "straight" | "flush" | "fullHouse" | "fourKind" | "straightFlush";

/** A play's kind and how strong it is among plays of the same number of cards. */
export type BigTwoValue = { kind: BigTwoKind; size: number; strength: number };

const SUIT_ORDER: Record<CardSuit, number> = { D: 0, C: 1, H: 2, S: 3 };
const FIVE_TIERS: BigTwoKind[] = ["straight", "flush", "fullHouse", "fourKind", "straightFlush"];

/** A rank's height, the three lowest (0) and the two highest (12). */
export function bigTwoRank(card: CardId): number {
  return (rankOf(card) + 10) % 13;
}

/** A card's height in the whole pack, 0 (three of diamonds) to 51 (two of spades). */
export function bigTwoCard(card: CardId): number {
  return bigTwoRank(card) * 4 + SUIT_ORDER[suitOf(card)];
}

/** Cards in Big Two's order, lowest first: how a hand is held. */
export function sortBigTwo(cards: readonly CardId[]): CardId[] {
  return [...cards].sort((a, b) => bigTwoCard(a) - bigTwoCard(b));
}

const topOf = (cards: readonly CardId[]) => Math.max(...cards.map(bigTwoCard));

/** What these cards are worth played together, or null for cards that make no play. */
export function bigTwoValue(cards: readonly CardId[]): BigTwoValue | null {
  if (new Set(cards).size !== cards.length) return null;
  const ranks = cards.map(bigTwoRank);
  const sameRank = ranks.every((rank) => rank === ranks[0]);
  if (cards.length === 1) return { kind: "single", size: 1, strength: bigTwoCard(cards[0]) };
  if (cards.length === 2) return sameRank ? { kind: "pair", size: 2, strength: topOf(cards) } : null;
  if (cards.length === 3) return sameRank ? { kind: "triple", size: 3, strength: topOf(cards) } : null;
  if (cards.length !== 5) return null;
  const sorted = [...ranks].sort((a, b) => a - b);
  const flush = cards.every((card) => suitOf(card) === suitOf(cards[0]));
  const straight = sorted.every((rank, at) => at === 0 || rank === sorted[at - 1] + 1) && sorted[4] <= 11;
  const counts = [...new Set(sorted)].map((rank) => ({ rank, count: sorted.filter((held) => held === rank).length })).sort((a, b) => b.count - a.count);
  const tier = (kind: BigTwoKind, strength: number): BigTwoValue => ({ kind, size: 5, strength: FIVE_TIERS.indexOf(kind) * 100 + strength });
  if (straight && flush) return tier("straightFlush", topOf(cards));
  if (counts[0].count === 4) return tier("fourKind", counts[0].rank);
  if (counts[0].count === 3 && counts[1].count === 2) return tier("fullHouse", counts[0].rank);
  if (flush) return tier("flush", topOf(cards));
  if (straight) return tier("straight", topOf(cards));
  return null;
}

/** Whether a play beats the one on the table: the same number of cards, and stronger. */
export function bigTwoBeats(play: BigTwoValue, table: BigTwoValue): boolean {
  return play.size === table.size && play.strength > table.strength;
}

/** A play's key, the same for the same cards in any order. */
const keyOf = (cards: readonly CardId[]) => sortBigTwo(cards).join(" ");

/** Every play this hand could make, each once, lowest cards first within a kind. */
export function bigTwoPlays(hand: readonly CardId[]): CardId[][] {
  const sorted = sortBigTwo(hand);
  const byRank = new Map<number, CardId[]>();
  for (const card of sorted) byRank.set(bigTwoRank(card), [...(byRank.get(bigTwoRank(card)) ?? []), card]);
  const found = new Map<string, CardId[]>();
  const add = (cards: CardId[]) => {
    if (bigTwoValue(cards) !== null) found.set(keyOf(cards), sortBigTwo(cards));
  };
  for (const card of sorted) add([card]);
  for (const same of byRank.values()) {
    for (const pair of choices(same, 2)) add(pair);
    for (const triple of choices(same, 3)) add(triple);
  }
  if (sorted.length >= 5) {
    // Straights: one card of each of five ranks in a row, every way.
    for (let low = 0; low <= 7; low += 1) {
      const runs = [0, 1, 2, 3, 4].map((step) => byRank.get(low + step) ?? []);
      if (runs.some((run) => run.length === 0)) continue;
      let built: CardId[][] = [[]];
      for (const run of runs) built = built.flatMap((cards) => run.map((card) => [...cards, card]));
      built.forEach(add);
    }
    // Flushes: five of one suit.
    for (const suit of ["D", "C", "H", "S"]) choices(sorted.filter((card) => suitOf(card) === suit), 5).forEach(add);
    // Full houses and four of a kind.
    const groups = [...byRank.entries()];
    for (const [rank, same] of groups) {
      if (same.length === 4) for (const card of sorted) if (bigTwoRank(card) !== rank) add([...same, card]);
      for (const triple of choices(same, 3)) {
        for (const [other, pairFrom] of groups) if (other !== rank) for (const pair of choices(pairFrom, 2)) add([...triple, ...pair]);
      }
    }
  }
  return [...found.values()];
}
