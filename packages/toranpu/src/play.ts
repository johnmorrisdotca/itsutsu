import { CARD_GAME_RULES } from "./games/cardGameRules.ts";
import type { CardGamePlays } from "./games/cardGameRules.ts";
import { CARD_GAME_TABLES } from "./games/cardGames.constants.ts";
import type { CardGameKind } from "./games/cardGames.constants.ts";
import type { CardGameRules } from "./games/cardGames.types.ts";

/**
 * THE FRIENDLY FRONT DOOR: start any game by name, let the computers take
 * their turns, and play yours. Everything here is a thin layer over each
 * game's `CardGameRules`, which a caller can always reach for directly.
 */

/** A game of that kind, in progress. */
export type GameOf<K extends CardGameKind> = CardGamePlays[K]["game"];
/** A move in a game of that kind. */
export type MoveOf<K extends CardGameKind> = CardGamePlays[K]["move"];

/** How to seat a new game. Everything but `players` has a sensible default. */
export type NewGameOptions = {
  /** One name a seat. The number of names is the number of players. */
  players: readonly string[];
  /** How long the game lasts, in its own terms (`CARD_GAME_TABLES`); the usual length when left out. */
  size?: number;
  /** The seed every deal is shuffled from; a random one when left out. The same seed deals the same cards. */
  seed?: number;
  /** One a seat: true where a computer plays. Seats not given are people's. */
  computers?: readonly boolean[];
};

/** A game's rules by its kind, with its own game and move types. */
export function rulesFor<K extends CardGameKind>(kind: K): CardGameRules<GameOf<K>, MoveOf<K>> {
  return CARD_GAME_RULES[kind] as unknown as CardGameRules<GameOf<K>, MoveOf<K>>;
}

/** A seed for a game nobody asked for by number: a whole number from 1 to 2³¹ − 1. */
export function randomSeed(): number {
  return 1 + Math.floor(Math.random() * 0x7ffffffe);
}

/**
 * A new game of that kind, or null when the game is not offered for that
 * table (too many players, or a size it does not play to).
 *
 * ```ts
 * const game = newGame("hearts", { players: ["You", "Ann", "Ben", "Cy"], computers: [false, true, true, true] });
 * ```
 */
export function newGame<K extends CardGameKind>(kind: K, options: NewGameOptions): GameOf<K> | null {
  const table = CARD_GAME_TABLES[kind];
  const size = options.size ?? table.defaultSize;
  return rulesFor(kind).start(size, options.players, undefined, options.seed ?? randomSeed(), options.computers);
}

/**
 * Every computer move due, played in turn until a person is to move or the
 * game is over. Returns the game and the moves the computers made, in order,
 * so a table can show them one at a time.
 */
export function playComputers<K extends CardGameKind>(kind: K, game: GameOf<K>): { game: GameOf<K>; moves: MoveOf<K>[] } {
  const rules = rulesFor(kind);
  const moves: MoveOf<K>[] = [];
  let now = game;
  for (;;) {
    const seat = rules.toPlay(now);
    if (seat === null || rules.over(now) || !rules.seats(now).computers[seat]) return { game: now, moves };
    const move = rules.computer(now);
    const next = rules.play(now, move);
    if (next === null) throw new Error(`the computer in seat ${seat} chose a move the ${kind} rules refuse`);
    moves.push(move);
    now = next;
  }
}
