/**
 * The vocabulary of the party games: a table of people round one device.
 *
 * The third kind of game in the catalogue, beside the rule variants the
 * engine plays between two colours (`RuleVariant`) and the puzzles one person
 * solves (`PuzzleKind`). A party game is neither: it has more players than a
 * board has seats, turns the engine cannot model (Dots and Boxes' extra turn
 * for a finished box), no rating, no bots, and no record kept anywhere but the
 * browser it is played in. So it is a kind of its own, joined to the others
 * through `GameKey` (`lib/catalogue/gameKeys.ts`) — see
 * docs/plans/party-games/README.md for why, and `party.coverage.test.ts` for
 * the New Game Gate asked in its terms.
 *
 * Not to be confused with `lib/gomoku/party/`, which holds the pass-and-play
 * MODES of games that are already variants (Chinese Checkers for six, Pair
 * Go, Halma for four): those are reached from their own variant's page, and
 * are listed on the Party games shelf as guests. A `PartyKind` lives there.
 */

import type { DotsGame } from "./dotsAndBoxes/dotsAndBoxes.types";

export type PartyKind = "dotsAndBoxes";

/** What a party game's set-up offers: how many may sit at the table, and on which boards. */
export type PartySpec = {
  /** The fewest players a table may start with. */
  fewestPlayers: number;
  /** The most. Never more than the six colours the tables share (`PARTY_MARBLES`). */
  mostPlayers: number;
  /** The player count the set-up opens on. */
  defaultPlayers: number;
  /**
   * The boards the set-up offers, smallest first, at most four (the set-up
   * rule every game and puzzle keeps: four tiles, a steady height). What a
   * size counts is the game's own: boxes along a side, for Dots and Boxes.
   */
  sizes: readonly number[];
  /** The board the set-up opens on. */
  defaultSize: number;
};

/**
 * WHAT EVERY PARTY GAME'S RULES ANSWER, whatever the game: enough for the New
 * Game Gate (`party.coverage.test.ts`) to play any of them out at every table
 * it offers, with nothing but the rules, and to keep one and read it back —
 * the questions `simulation.test.ts` asks of every rule variant, in a party
 * game's terms. `S` is a game in progress, `M` one move in it.
 */
export type PartyRules<S, M> = {
  /** A new game at this board size for these names (one a seat), or null for a table the game is not offered for. */
  start: (size: number, players: readonly string[]) => S | null;
  /** Every move the player to move may make now; none once the game is over. */
  moves: (game: S) => readonly M[];
  /** The game after that move, or null for a move that may not be made; the game given is left untouched. */
  play: (game: S, move: M) => S | null;
  over: (game: S) => boolean;
  /** On a game that is over, every seat that won — more than one when it is shared. */
  winners: (game: S) => readonly number[];
  encode: (game: S) => string;
  /** A kept game read back, or null for nothing kept or anything these rules cannot play out again. */
  decode: (text: string | null) => S | null;
};

/** Each party game's game and move, so its rules can be named with their own types (`PARTY_RULES`). */
export type PartyPlays = {
  dotsAndBoxes: { game: DotsGame; move: number };
};
