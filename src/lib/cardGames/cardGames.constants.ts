// Relative and free of the rules, like the rest of the party constants: the browser specs import this, and Playwright resolves no alias.
import type { PartySpec } from "../party/party.types";
import { CARD_GAME_KINDS, CARD_GAME_TABLES } from "../../../packages/toranpu/src/games/cardGames.constants.ts";
import type { CardGameKind } from "../../../packages/toranpu/src/games/cardGames.constants.ts";

/**
 * THE FAMILY CARD GAMES, and the tables each offers. Each is a party game
 * (`PartyKind`), so these rows are its `PARTY_SPECS` entry. The games, their
 * sizes and their tables are Toranpu's (packages/toranpu,
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
  PRESIDENT_ROUNDS,
  SPADES_SIZES,
} from "../../../packages/toranpu/src/games/cardGames.constants.ts";

/** Every family card game, in the order its shelf shows them. */
export const CARD_GAME_LIST: readonly CardGameKind[] = [
  CARD_GAME_KINDS.hearts,
  CARD_GAME_KINDS.spades,
  CARD_GAME_KINDS.euchre,
  CARD_GAME_KINDS.cribbage,
  CARD_GAME_KINDS.crazyEights,
  CARD_GAME_KINDS.goFish,
  CARD_GAME_KINDS.bigTwo,
  CARD_GAME_KINDS.president,
  CARD_GAME_KINDS.ginRummy,
];

export const CARD_GAME_SPECS: Record<CardGameKind, PartySpec> = CARD_GAME_TABLES;
