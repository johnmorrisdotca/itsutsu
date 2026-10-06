import type { Card, Rank, Suit } from "@johnmorrisdotca/toranpu/deck";

import type { Speaker } from "../i18n/i18n";
import type { PhraseKey } from "../i18n/i18n.constants";

import { cardName } from "./deck";

const SUITS_SAID: Record<Suit, PhraseKey> = {
  spades: "pcard.suit.spades",
  hearts: "pcard.suit.hearts",
  diamonds: "pcard.suit.diamonds",
  clubs: "pcard.suit.clubs",
};

const FACES_SAID: Partial<Record<Rank, PhraseKey>> = { 1: "pcard.rank.ace", 11: "pcard.rank.jack", 12: "pcard.rank.queen", 13: "pcard.rank.king" };

/** A suit's name in the reader's language: "hearts", or ハート. */
export function suitSays(say: Speaker, suit: Suit): string {
  return say.say(SUITS_SAID[suit]);
}

/**
 * A card's name for a screen reader, in the reader's language: "queen of hearts", or ハートのクイーン.
 * English is the package's own name for it (`cardName`), unchanged.
 */
export function cardSays(say: Speaker, card: Card): string {
  if (say.locale !== "ja") return cardName(card);
  const face = FACES_SAID[card.rank];
  return say.say("pcard.card.name", { rank: face === undefined ? String(card.rank) : say.say(face), suit: suitSays(say, card.suit) });
}
