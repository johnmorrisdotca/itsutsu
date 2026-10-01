// Free of the site's rules, like the rest of the party constants: the browser specs import this, so it reaches only the Toranpu package and party types.
import type { PartySpec } from "../party/party.types";
import { CARD_GAME_KINDS, CARD_GAME_TABLES } from "@johnmorrisdotca/toranpu";
import type { CardGameKind } from "@johnmorrisdotca/toranpu";

/**
 * THE FAMILY CARD GAMES, and the tables each offers. Each is a party game
 * (`PartyKind`), so these rows are its `PARTY_SPECS` entry. The games, their
 * sizes and their tables are Toranpu's (@johnmorrisdotca/toranpu,
 * `cardGames.constants.ts`), which says what each game's "size" counts; the
 * order of the shelf is the site's.
 */
export type { CardGameKind };
export { CARD_GAME_KINDS };
export {
  BIG_TWO_DEALS,
  CRAZY_EIGHTS_SIZES,
  CRIBBAGE_SIZES,
  EUCHRE_SIZES,
  GIN_SIZES,
  GO_FISH_SIZES,
  HEARTS_SIZES,
  OH_HELL_DEALS,
  PRESIDENT_ROUNDS,
  SPADES_SIZES,
  WAR_ROUNDS,
} from "@johnmorrisdotca/toranpu";

/** Every family card game, in the order its shelf shows them. */
export const CARD_GAME_LIST: readonly CardGameKind[] = [
  CARD_GAME_KINDS.hearts,
  CARD_GAME_KINDS.spades,
  CARD_GAME_KINDS.euchre,
  CARD_GAME_KINDS.cribbage,
  CARD_GAME_KINDS.ohHell,
  CARD_GAME_KINDS.crazyEights,
  CARD_GAME_KINDS.goFish,
  CARD_GAME_KINDS.bigTwo,
  CARD_GAME_KINDS.president,
  CARD_GAME_KINDS.ginRummy,
  CARD_GAME_KINDS.war,
];

export const CARD_GAME_SPECS: Record<CardGameKind, PartySpec> = {
  ...CARD_GAME_TABLES,
  /*
   * WAR offers four lengths, not Toranpu's five: a set-up offers at most four
   * boards, so 25 turns, which ends nearly every game on the count of cards
   * before anything has happened, is not offered. 50 is the quick game, 100
   * the usual one, 200 a long one, and 1000 plays it out to the last card.
   */
  war: { ...CARD_GAME_TABLES.war, sizes: [50, 100, 200, 1000], defaultSize: 100 },
};
