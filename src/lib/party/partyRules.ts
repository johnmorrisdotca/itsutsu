// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { DOTS_RULES } from "./dotsAndBoxes/dotsAndBoxes";
import type { PartyKind, PartyPlays, PartyRules } from "./party.types";

/**
 * EVERY PARTY GAME'S RULES, by kind: what the New Game Gate plays out at every
 * table a game offers (`party.coverage.test.ts`). A mapped type over
 * `PartyKind`, so a new party game does not compile until its rules are here.
 */
export const PARTY_RULES: { [K in PartyKind]: PartyRules<PartyPlays[K]["game"], PartyPlays[K]["move"]> } = {
  dotsAndBoxes: DOTS_RULES,
};
