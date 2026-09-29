// Relative: the engine boundary (`boundary.coverage.test.ts`) allows no alias under src/lib/gomoku.
import type { RULE_VARIANTS } from "../gomoku.constants";
import type { Point } from "../gomoku.types";

/** The race games with a table for more than two: Chinese Checkers round the star, Halma round the square. */
export type RaceVariant = typeof RULE_VARIANTS.chineseCheckers | typeof RULE_VARIANTS.halma;

/** One move, by the player whose turn it was: a step, or the end of a chain of jumps. */
export type PartyMove = { player: number; from: Point; to: Point };

/**
 * Where a game stands. `stuck` is the answer to a question the rules never
 * have to ask in practice — nobody left with a move — and is here so that the
 * answer is a state rather than a turn that can never be taken.
 */
export type PartyStatus = "playing" | "won" | "stuck";

/**
 * WHAT EVERY RACE TABLE ON ONE DEVICE HAS, whichever race: players in turn
 * order, a board saying whose piece stands where, whose turn it is, the moves,
 * and how it stands.
 *
 * Its own state, not the engine's `GameState`: that one has two colours all
 * the way down (`Stone` is black or white in the ratings, the seats, the bots
 * and every stored game), and a game for four or six is not a two-player game
 * with extra colours. Each game says where its players sit — a point of the
 * star, a corner of the square — in `P`, its player.
 */
export type PartyRaceState<P extends { name: string } = { name: string }> = {
  /** In turn order; player `i` plays colour `i`. */
  players: readonly P[];
  /** One entry per square of the board's array: the player standing there, or null. */
  board: readonly (number | null)[];
  /** Whose turn it is, by place in `players`. */
  toPlay: number;
  moves: readonly PartyMove[];
  status: PartyStatus;
  /** Who filled their far camp first, once somebody has. */
  winner: number | null;
};

/**
 * ONE GAME'S RULES FOR A TABLE, as the page asks them: how many may sit, how a
 * game starts, where a piece may go, what a move leaves, and how the game is
 * written down to be kept. `S` is the game's own state and `C` the counts of
 * players it is played by, so a page drawing one game can never be handed
 * another game's board.
 */
export type PartyRaceRules<S extends PartyRaceState, C extends number> = {
  variant: RaceVariant;
  /** The side of the board's square array. */
  size: number;
  /** The counts of players the game is played by, smallest first. */
  counts: readonly C[];
  /** The count the set-up screen opens on. */
  firstCount: C;
  start: (count: C, names?: readonly string[]) => S;
  /** A new game for the same table: the same seats and names. */
  again: (game: S) => S;
  destinations: (game: S, from: Point) => Point[];
  move: (game: S, from: Point, to: Point) => S | null;
  /** How many of a player's pieces stand in the camp they are racing to. */
  piecesHome: (game: S, player: number) => number;
  /** How many pieces fill a camp in this game: what "home" is counted out of. */
  piecesEach: (game: S) => number;
  /** A name for a player's seat that no other seat in the game has, for a list's key. */
  seatOf: (game: S, player: number) => string;
  encode: (game: S) => string;
  decode: (text: string | null) => S | null;
};
