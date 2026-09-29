import { PARTY_CHECKERS_RULES } from "@/lib/gomoku/party/partyCheckers";
import type { PartyCheckersState, PartyPlayerCount } from "@/lib/gomoku/party/partyCheckers.types";
import { PARTY_HALMA_RULES } from "@/lib/gomoku/party/partyHalma";
import type { PartyHalmaCount, PartyHalmaState } from "@/lib/gomoku/party/partyHalma.types";

import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";

import { PartySquareBoard } from "./PartySquareBoard";
import { PartyStarBoard } from "./PartyStarBoard";
import { PARTY_GAME_COPY } from "./party.constants";
import type { PartyRaceKind } from "./party.types";
import { useKeptPartyGame } from "./partyCheckersStore";
import { useKeptHalmaParty } from "./partyHalmaStore";

/**
 * THE RACE TABLES, one per race game with a pass and play of its own: its
 * rules, its board, the game this browser keeps and what it says. The race
 * screens (`PartyRaceGame`, `PartySetUp`, `PartyOffer`, `PartyGameCard`) are
 * written once, for either of these; each game's row in `PARTY_TABLES` binds
 * them to its own (`PartyCheckersGame.tsx`, `PartyHalmaGame.tsx`).
 */

/** Chinese Checkers for two to six, on the star. Its store keeps the key it was first kept under, so no game in progress is lost. */
export const CHECKERS_RACE: PartyRaceKind<PartyCheckersState, PartyPlayerCount> = {
  rules: PARTY_CHECKERS_RULES,
  Board: PartyStarBoard,
  useKept: useKeptPartyGame,
  variant: RULE_VARIANTS.chineseCheckers,
  testId: "party-checkers",
  copy: PARTY_GAME_COPY.chineseCheckers,
};

/** Halma for four, as it was made to be played, or for two, on its own sixteen-square board. */
export const HALMA_RACE: PartyRaceKind<PartyHalmaState, PartyHalmaCount> = {
  rules: PARTY_HALMA_RULES,
  Board: PartySquareBoard,
  useKept: useKeptHalmaParty,
  variant: RULE_VARIANTS.halma,
  testId: "party-halma",
  copy: PARTY_GAME_COPY.halma,
};
