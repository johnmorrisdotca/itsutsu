// Relative: the engine boundary (`boundary.coverage.test.ts`) allows no alias under src/lib/gomoku.
import type { Point } from "../gomoku.types";
import type { StarTip } from "../rules/chineseCheckers";

/** How many can sit round the star: the four counts the game is played with. */
export type PartyPlayerCount = 2 | 3 | 4 | 6;

/**
 * One player at the table: the point of the star their pieces start in, and a
 * name if they gave one. Their colour is their place in the turn order, so it
 * is not stored twice.
 */
export type PartyPlayer = { tip: StarTip; name: string };

/** One move, by the player whose turn it was: a step, or the end of a chain of jumps. */
export type PartyMove = { player: number; from: Point; to: Point };

/**
 * Where a game stands. `stuck` is the answer to a question the rules never
 * have to ask in practice — nobody left with a move — and is here so that the
 * answer is a state rather than a turn that can never be taken.
 */
export type PartyStatus = "playing" | "won" | "stuck";

/**
 * A game of Chinese Checkers for two to six players on one device.
 *
 * Its own state, not the engine's `GameState`: that one has two colours all
 * the way down (`Stone` is black or white in the ratings, the seats, the bots
 * and every stored game), and a game for six is not a two-player game with
 * extra colours. What the two share is the board and how a piece moves, and
 * that is shared — see `partyCheckers.ts`.
 */
export type PartyCheckersState = {
  /** In turn order; player `i` plays colour `i`. */
  players: readonly PartyPlayer[];
  /** One entry per hole of the star's 17×17 array: the player standing there, or null. Off the star is always null. */
  board: readonly (number | null)[];
  /** Whose turn it is, by place in `players`. */
  toPlay: number;
  moves: readonly PartyMove[];
  status: PartyStatus;
  /** Who filled the point opposite first, once somebody has. */
  winner: number | null;
};
