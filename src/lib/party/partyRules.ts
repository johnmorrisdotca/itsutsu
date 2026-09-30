// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { DOTS_RULES } from "./dotsAndBoxes/dotsAndBoxes";
import { MANCALA_RULES } from "./mancala/mancala";
import { MEXICAN_TRAIN_RULES } from "./mexicanTrain/trainRules";
import type { PartyKind, PartyPlays, PartyRules } from "./party.types";
import { SUPERGHOST_RULES } from "./superghost/ghostRules";
import { TENKA_RULES } from "./tenka/tenkaRules";
import { PACHISI_RULES } from "./pachisi/pachisiRules";
import { YACHT_RULES } from "./yacht/yachtRules";
import { CARD_GAME_RULES } from "../cardGames/cardGameRules";

/**
 * EVERY PARTY GAME'S RULES, by kind: what the New Game Gate plays out at every
 * table a game offers (`party.coverage.test.ts`). A mapped type over
 * `PartyKind`, so a new party game does not compile until its rules are here.
 */
export const PARTY_RULES: { [K in PartyKind]: PartyRules<PartyPlays[K]["game"], PartyPlays[K]["move"]> } = {
  dotsAndBoxes: DOTS_RULES,
  superghost: SUPERGHOST_RULES,
  mancala: MANCALA_RULES,
  tenka: TENKA_RULES,
  mexicanTrain: MEXICAN_TRAIN_RULES,
  yacht: YACHT_RULES,
  pachisi: PACHISI_RULES,
  ...CARD_GAME_RULES,
};
