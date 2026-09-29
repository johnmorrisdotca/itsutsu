// Relative: the engine boundary (`boundary.coverage.test.ts`) allows no alias under src/lib/gomoku.
import type { GameState, Stone } from "../gomoku.types";

/**
 * The two players of one colour, in the order they take that colour's turns:
 * the first plays its first stone, the second its second, and so on.
 */
export type PairTeam = readonly [string, string];

/** Both teams, by the colour each plays. Black is players 1 and 3 at the table, White 2 and 4. */
export type PairTeams = Record<Stone, PairTeam>;

/** Which of a team's two is meant: its first player or its second. */
export type PairPlace = 0 | 1;

/**
 * One of the four at the board: the colour they play, which of their team's
 * two they are, their place in the order round the table (0 to 3, the order a
 * game's first four turns are taken in), and the name the table reads.
 */
export type PairPlayer = { stone: Stone; place: PairPlace; turnOrder: number; name: string };

/**
 * A game of Pair Go on one device.
 *
 * The game itself is the engine's own `GameState` for Go, untouched: the
 * board, the captures, ko, passing and the count are all the engine's. The
 * pair layer adds only who the four are, and a resignation — a thing that
 * happens at a table and leaves no move in the record for a replay to find.
 */
export type PairGoGame = {
  teams: PairTeams;
  state: GameState;
  /** The colour whose team resigned, or null while nobody has. */
  resigned: Stone | null;
};
