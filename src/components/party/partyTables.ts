import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { PARTY_PLAY_GAMES } from "@/lib/gomoku/party/partyGames";

import { PairGoGame } from "./PairGoGame";
import { PartyBlocksGame } from "./PartyBlocksGame";
import { PartyBlocksOffer } from "./PartyBlocksOffer";
import { PairGoOffer } from "./PairGoOffer";
import { PartyCheckersGame, PartyCheckersOffer } from "./PartyCheckersGame";
import { PartyHalmaGame, PartyHalmaOffer } from "./PartyHalmaGame";
import { blocksWords, pairGoWords, partyScreenWords, raceWords } from "./partyWords";
import type { PartyTable } from "./party.types";

/**
 * EACH GAME'S TABLE AT `/games/<slug>/pass-and-play`: its title, its first
 * words, the component that plays it and the way to it on the game's page, one row a game in `PARTY_PLAY_GAMES`
 * (`partyTables.test.ts` holds the two lists to one another).
 */
export const PARTY_TABLES: Partial<Record<RuleVariant, PartyTable>> = {
  [RULE_VARIANTS.chineseCheckers]: {
    words: (locale) => ({ title: partyScreenWords(locale).title, kanji: partyScreenWords(locale).kanji, lead: raceWords(locale).chineseCheckers.lead }),
    Game: PartyCheckersGame,
    Offer: PartyCheckersOffer,
  },
  [RULE_VARIANTS.go]: { words: (locale) => ({ title: pairGoWords(locale).title, kanji: pairGoWords(locale).kanji, lead: pairGoWords(locale).lead }), Game: PairGoGame, Offer: PairGoOffer },
  [RULE_VARIANTS.halma]: { words: (locale) => ({ title: partyScreenWords(locale).title, kanji: partyScreenWords(locale).kanji, lead: raceWords(locale).halma.lead }), Game: PartyHalmaGame, Offer: PartyHalmaOffer },
  [RULE_VARIANTS.blockFive]: {
    words: (locale) => ({ title: blocksWords(locale).title, kanji: blocksWords(locale).kanji, lead: blocksWords(locale).lead }),
    Game: PartyBlocksGame,
    Offer: PartyBlocksOffer,
  },
};

/** The table this game is played at on one device, or null when it has none. */
export function partyTableFor(variant: RuleVariant | null): PartyTable | null {
  if (variant === null || !PARTY_PLAY_GAMES.includes(variant)) return null;
  return PARTY_TABLES[variant] ?? null;
}
