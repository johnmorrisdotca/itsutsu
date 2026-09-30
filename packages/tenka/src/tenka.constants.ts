import type { TenkaCardKind, TenkaMoveKind, TenkaPhase, TenkaPlacing } from "./tenka.types.ts";

/**
 * THE NUMBERS TENKA IS PLAYED BY: the classic world-conquest game's, which no
 * one owns — the rules of a game are not anybody's property, only its name,
 * its art and its wording are, and none of those is used here.
 */

export const TENKA_PHASES = {
  setUp: "setUp",
  reinforce: "reinforce",
  attack: "attack",
  occupy: "occupy",
  fortify: "fortify",
  shift: "shift",
  over: "over",
} as const satisfies Record<TenkaPhase, TenkaPhase>;

export const TENKA_MOVES = {
  place: "place",
  trade: "trade",
  attack: "attack",
  blitz: "blitz",
  occupy: "occupy",
  endAttack: "endAttack",
  fortify: "fortify",
  shift: "shift",
  endTurn: "endTurn",
} as const satisfies Record<TenkaMoveKind, TenkaMoveKind>;

export const TENKA_PLACING = { auto: "auto", hand: "hand" } as const satisfies Record<TenkaPlacing, TenkaPlacing>;

/** The owner of the territories nobody at a table of two holds: the neutral army, which never takes a turn. */
export const TENKA_NEUTRAL = -1;

/**
 * THE ARMIES EACH PLAYER STARTS WITH, by how many are playing: the standard
 * table. Two players are joined by a neutral army with forty of its own,
 * holding a third of the world, which never moves and only defends.
 */
export const TENKA_STARTING_ARMIES: Readonly<Record<number, number>> = { 2: 40, 3: 35, 4: 30, 5: 25, 6: 20 };

/** The fewest armies a turn brings, however little is held; otherwise one for every three territories. */
export const TENKA_LEAST_REINFORCEMENT = 3;
export const TENKA_TERRITORIES_PER_ARMY = 3;

/** The most dice each side throws. */
export const TENKA_ATTACK_DICE = 3;
export const TENKA_DEFEND_DICE = 2;

/**
 * WHAT A SET OF CARDS IS WORTH, by how many sets anybody has traded in
 * before it: 4, 6, 8, 10, 12, 15, and five more for every set after that —
 * the escalating standard schedule. And two armies more, placed straight
 * onto it, when a card in the set shows a territory the trader holds.
 */
export const TENKA_TRADE_VALUES: readonly number[] = [4, 6, 8, 10, 12, 15];
export const TENKA_TRADE_STEP = 5;
export const TENKA_TERRITORY_CARD_BONUS = 2;

/** With this many cards in hand a player must trade before placing; after knocking somebody out, down to fewer than this. */
export const TENKA_MUST_TRADE_AT = 5;

/** The three kinds a territory's card shows, in turn round the map, and the wild card that is any of them. */
export const TENKA_CARD_KINDS: readonly TenkaCardKind[] = ["land", "sea", "air"];
export const TENKA_WILD: TenkaCardKind = "wild";
export const TENKA_WILD_CARDS = 2;

/**
 * THE LENGTHS OF GAME ON OFFER, as rounds before the count — `TENKA_LENGTHS`. A round is one turn for every player
 * still in. At the end of the last round the player holding the most
 * territories wins (most armies breaking a tie). The whole world is the
 * game played to the last player standing; it too is counted, at the end of
 * round sixty, so that a stalemate between two players who will not attack
 * still ends.
 */
export const TENKA_SHORT_ROUNDS = 10;
export const TENKA_MEDIUM_ROUNDS = 20;
export const TENKA_WORLD_ROUNDS = 60;
export const TENKA_LENGTHS: readonly number[] = [TENKA_SHORT_ROUNDS, TENKA_MEDIUM_ROUNDS, TENKA_WORLD_ROUNDS];

/** How many sit at a table: two (with the neutral army) to six. */
export const TENKA_FEWEST_PLAYERS = 2;
export const TENKA_MOST_PLAYERS = 6;

/** The longest name a seat keeps. */
export const TENKA_NAME_MOST = 20;
