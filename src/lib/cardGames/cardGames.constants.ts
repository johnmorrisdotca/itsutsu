// Relative and free of the rules, like the rest of the party constants: the browser specs import this, and Playwright resolves no alias.
import type { PartySpec } from "../party/party.types";

/**
 * THE FAMILY CARD GAMES, and the tables each offers. Each is a party game
 * (`PartyKind`), so these rows are its `PARTY_SPECS` entry; a card game's
 * "size" is how long the game lasts, in its own terms:
 *
 * - Hearts, three or four: the score that ends it, 50 or 100 (the usual game).
 * - Big Two, two to four: how many deals, 1, 3 or 5, the fewest points winning.
 * - President, three to eight: how many rounds, 3, 5 or 7, the most points winning.
 * - Go Fish, two to six: one deal, played until every book is down.
 * - Crazy Eights, two to seven: the score that wins, 50, 100 or 200.
 * - Spades, four in two partnerships: the score that wins, 200, 300 or 500.
 * - Gin Rummy, two: the score that wins, 50, 100 or 150.
 * - Euchre, four in two partnerships: the score that wins, 5 or 10.
 * - Cribbage, for two: the score that wins, 61 (once round the board) or 121.
 * - Oh Hell, three or four each for themselves: how many deals, 7 (one card up to seven) or 13 (and back down).
 *
 * Every seat may be a person's or a computer's, so a table of one person and
 * three computers is a game of Hearts as much as four people round a phone.
 */
export type CardGameKind = "hearts" | "bigTwo" | "president" | "goFish" | "crazyEights" | "spades" | "ginRummy" | "euchre" | "cribbage" | "ohHell";

export const CARD_GAME_KINDS = {
  hearts: "hearts",
  bigTwo: "bigTwo",
  president: "president",
  goFish: "goFish",
  crazyEights: "crazyEights",
  spades: "spades",
  ginRummy: "ginRummy",
  euchre: "euchre",
  cribbage: "cribbage",
  ohHell: "ohHell",
} as const satisfies Record<CardGameKind, CardGameKind>;

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
];

/** How long each game lasts, in its own terms (see above). */
export const HEARTS_SIZES = { short: 50, full: 100 } as const;
export const BIG_TWO_DEALS = [1, 3, 5] as const;
export const PRESIDENT_ROUNDS = [3, 5, 7] as const;
export const GO_FISH_SIZES = [1] as const;
export const CRAZY_EIGHTS_SIZES = [50, 100, 200] as const;
export const SPADES_SIZES = [200, 300, 500] as const;
export const GIN_SIZES = [50, 100, 150] as const;
export const EUCHRE_SIZES = [5, 10] as const;
export const CRIBBAGE_SIZES = [61, 121] as const;
export const OH_HELL_DEALS = [7, 13] as const;

export const CARD_GAME_SPECS: Record<CardGameKind, PartySpec> = {
  hearts: { fewestPlayers: 3, mostPlayers: 4, defaultPlayers: 4, sizes: [HEARTS_SIZES.short, HEARTS_SIZES.full], defaultSize: HEARTS_SIZES.full },
  bigTwo: { fewestPlayers: 2, mostPlayers: 4, defaultPlayers: 4, sizes: BIG_TWO_DEALS, defaultSize: 3 },
  president: { fewestPlayers: 3, mostPlayers: 8, defaultPlayers: 4, sizes: PRESIDENT_ROUNDS, defaultSize: 3 },
  goFish: { fewestPlayers: 2, mostPlayers: 6, defaultPlayers: 3, sizes: GO_FISH_SIZES, defaultSize: 1 },
  crazyEights: { fewestPlayers: 2, mostPlayers: 7, defaultPlayers: 3, sizes: CRAZY_EIGHTS_SIZES, defaultSize: 100 },
  spades: { fewestPlayers: 4, mostPlayers: 4, defaultPlayers: 4, sizes: SPADES_SIZES, defaultSize: 500 },
  ginRummy: { fewestPlayers: 2, mostPlayers: 2, defaultPlayers: 2, sizes: GIN_SIZES, defaultSize: 100 },
  euchre: { fewestPlayers: 4, mostPlayers: 4, defaultPlayers: 4, sizes: EUCHRE_SIZES, defaultSize: 10 },
  cribbage: { fewestPlayers: 2, mostPlayers: 2, defaultPlayers: 2, sizes: CRIBBAGE_SIZES, defaultSize: 121 },
  ohHell: { fewestPlayers: 3, mostPlayers: 4, defaultPlayers: 4, sizes: OH_HELL_DEALS, defaultSize: 13 },
};
