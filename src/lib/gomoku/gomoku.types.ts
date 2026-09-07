/**
 * Domain types for the gomoku engine. The engine is pure: every function in
 * `engine.ts` takes a `GameState` and returns a new one, so the UI can hold a
 * single state value and the rules can be tested without a browser.
 */

export type Stone = "black" | "white";

/** One intersection of the board: a stone, or nothing. */
export type Cell = Stone | null;

/** Zero-based board coordinates. Row 0 is the top, column 0 is the left. */
export type Point = {
  row: number;
  col: number;
};

export type Move = Point & {
  stone: Stone;
};

/**
 * `freestyle`: five or more in a row wins.
 * `standard`: exactly five wins; an overline (six or more) does not.
 */
export type RuleVariant = "freestyle" | "standard";

export type GameStatus = "playing" | "won" | "draw";

export type GameSettings = {
  /** Board is `size` × `size` intersections. */
  size: number;
  /** Stones in a line needed to win. */
  winLength: number;
  variant: RuleVariant;
};

export type GameState = {
  settings: GameSettings;
  /** Row-major, `size * size` entries. See `indexOf` / `pointOf`. */
  board: Cell[];
  /** Every move played so far, in order. Drives undo. */
  moves: Move[];
  toPlay: Stone;
  status: GameStatus;
  winner: Stone | null;
  /** The stones that completed the winning line, empty until someone wins. */
  winningLine: Point[];
};
