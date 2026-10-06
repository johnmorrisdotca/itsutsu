import { cardFromId } from "../cards/deck";
import { cardSays, suitSays } from "../cards/cardSays";
import type { Speaker } from "../i18n/i18n";
import type { PhraseKey } from "../i18n/i18n.constants";

import { rankWords } from "./cards";
import type { CardId, CardRank, CardSuit } from "./cardGames.types";

/*
 * THE CARD GAMES' WORDS FOR A CARD, A SUIT AND A RANK, in the reader's language.
 *
 * The table's own ids ("QS", "S") are Toranpu's; the names a reader hears for them are the puzzles' (`cardSays`),
 * so Hearts and Solitaire say "queen of spades" and スペードのクイーン in one voice. English is Toranpu's own
 * wording, unchanged.
 */

const SUIT_NAMES = { S: "spades", H: "hearts", D: "diamonds", C: "clubs" } as const;

const FACES: Partial<Record<CardRank, PhraseKey>> = { 1: "pcard.rank.ace", 11: "pcard.rank.jack", 12: "pcard.rank.queen", 13: "pcard.rank.king" };

/** A card's name in full, as a screen reader and a sentence say it: "queen of spades", or スペードのクイーン. */
export function cardNamed(card: CardId, say: Speaker): string {
  const found = cardFromId(card);
  return found === null ? card : cardSays(say, found);
}

/** A suit's name: "spades", or スペード. */
export function suitNamed(suit: CardSuit, say: Speaker): string {
  return suitSays(say, SUIT_NAMES[suit]);
}

/** A rank as a request names it: "sevens" and "queens", or 7 and クイーン. */
export function ranksNamed(rank: CardRank, say: Speaker): string {
  if (say.locale !== "ja") return rankWords(rank);
  const face = FACES[rank];
  return face === undefined ? String(rank) : say.say(face);
}
