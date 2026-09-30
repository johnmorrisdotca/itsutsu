import {
  TENKA_CARD_KINDS,
  TENKA_TRADE_STEP,
  TENKA_TRADE_VALUES,
  TENKA_WILD,
  TENKA_WILD_CARDS,
} from "./tenka.constants.ts";
import type { TenkaCard, TenkaCardKind } from "./tenka.types.ts";
import { TENKA_TERRITORY_COUNT } from "./tenkaMap.ts";

/**
 * THE CARDS: one for every territory, each showing one of three kinds (land,
 * sea, air, dealt round the map in turn so there are fourteen of each), and
 * two wild cards that stand for any kind. A card is earned at the end of any
 * turn in which the player took a territory; three that make a set are
 * traded for armies.
 */

/** Every card in the game: the territories' cards, then the wild cards. */
export const TENKA_DECK: readonly TenkaCard[] = Array.from({ length: TENKA_TERRITORY_COUNT + TENKA_WILD_CARDS }, (_, card) => card);

export function isWild(card: TenkaCard): boolean {
  return card >= TENKA_TERRITORY_COUNT;
}

export function cardKind(card: TenkaCard): TenkaCardKind {
  return isWild(card) ? TENKA_WILD : TENKA_CARD_KINDS[card % TENKA_CARD_KINDS.length];
}

/** The territory a card shows, or null for a wild card. */
export function cardTerritory(card: TenkaCard): number | null {
  return isWild(card) ? null : card;
}

/**
 * Whether three cards make a set: three of one kind, one of each kind, or
 * any two with a wild card (a wild card stands for whatever the set needs).
 */
export function isSet(cards: readonly TenkaCard[]): boolean {
  if (cards.length !== 3 || new Set(cards).size !== 3) return false;
  const kinds = cards.filter((card) => !isWild(card)).map(cardKind);
  if (kinds.length < 3) return true;
  const different = new Set(kinds).size;
  return different === 1 || different === 3;
}

/** Every set a hand holds, each as its three cards smallest first, in order. */
export function setsIn(hand: readonly TenkaCard[]): TenkaCard[][] {
  const sorted = [...hand].sort((a, b) => a - b);
  const sets: TenkaCard[][] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      for (let k = j + 1; k < sorted.length; k += 1) {
        const three = [sorted[i], sorted[j], sorted[k]];
        if (isSet(three)) sets.push(three);
      }
    }
  }
  return sets;
}

/** What the next set traded in is worth, when `trades` sets have been traded before it: 4, 6, 8, 10, 12, 15, 20, 25… */
export function tradeValue(trades: number): number {
  if (trades < TENKA_TRADE_VALUES.length) return TENKA_TRADE_VALUES[trades];
  return TENKA_TRADE_VALUES.at(-1)! + TENKA_TRADE_STEP * (trades - TENKA_TRADE_VALUES.length + 1);
}
