import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { PARTY_PLAY_GAMES } from "@/lib/gomoku/party/partyGames";

import { PairGoGame } from "./PairGoGame";
import { PairGoOffer } from "./PairGoOffer";
import { PartyCheckersGame, PartyCheckersOffer } from "./PartyCheckersGame";
import { PartyHalmaGame, PartyHalmaOffer } from "./PartyHalmaGame";
import { PAIR_GO_COPY } from "./pairGo.constants";
import { PARTY_COPY, PARTY_GAME_COPY } from "./party.constants";
import type { PartyTable } from "./party.types";

/**
 * EACH GAME'S TABLE AT `/games/<slug>/pass-and-play`: its title, its first
 * words, the component that plays it and the way to it on the game's page, one row a game in `PARTY_PLAY_GAMES`
 * (`partyTables.test.ts` holds the two lists to one another).
 */
export const PARTY_TABLES: Partial<Record<RuleVariant, PartyTable>> = {
  [RULE_VARIANTS.chineseCheckers]: {
    title: PARTY_COPY.title,
    kanji: PARTY_COPY.kanji,
    lead: PARTY_GAME_COPY.chineseCheckers.lead,
    Game: PartyCheckersGame,
    Offer: PartyCheckersOffer,
  },
  [RULE_VARIANTS.go]: { title: PAIR_GO_COPY.title, kanji: PAIR_GO_COPY.kanji, lead: PAIR_GO_COPY.lead, Game: PairGoGame, Offer: PairGoOffer },
  [RULE_VARIANTS.halma]: { title: PARTY_COPY.title, kanji: PARTY_COPY.kanji, lead: PARTY_GAME_COPY.halma.lead, Game: PartyHalmaGame, Offer: PartyHalmaOffer },
};

/** The table this game is played at on one device, or null when it has none. */
export function partyTableFor(variant: RuleVariant | null): PartyTable | null {
  if (variant === null || !PARTY_PLAY_GAMES.includes(variant)) return null;
  return PARTY_TABLES[variant] ?? null;
}
