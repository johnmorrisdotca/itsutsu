/**
 * Domain types for the gomoku engine. The engine is pure: every function in
 * `engine.ts` takes a `GameState` and returns a new one, so the UI can hold a
 * single state value and the rules can be tested without a browser.
 */

export type Stone = "black" | "white";

/** An intersection the rules have taken out of play. See `obstacles.ts`. */
export type Blocked = "blocked";

/** One intersection of the board: a stone, an obstacle, or nothing. */
export type Cell = Stone | Blocked | null;

/** Zero-based board coordinates. Row 0 is the top, column 0 is the left. */
export type Point = {
  row: number;
  col: number;
};

/**
 * `place`: an ordinary stone.
 * `skip`: a deliberately wasted move, dropped on the emptiest corner.
 */
export type MoveKind = "place" | "skip";

export type Move = Point & {
  stone: Stone;
  kind: MoveKind;
};

/**
 * `freestyle`: five or more in a row wins.
 * `standard`: exactly five wins; an overline (six or more) does not.
 */
export type RuleVariant = "freestyle" | "standard";

export type GameStatus = "playing" | "won" | "draw";

/**
 * Who opens. `random` is resolved once when the game is created — the engine
 * stays pure by taking the roll as an argument, see `resolveOpener`.
 */
export type FirstPlayer = Stone | "random";

/**
 * `none`: every intersection is playable.
 * `hoshi`: the star points are blocked, except tengen at the centre.
 */
export type ObstacleLayout = "none" | "hoshi";

/**
 * The two people at the board. Seats are distinct from stone colours because
 * `swapSeats` exchanges them mid-game — see `GameState.seats`.
 */
export type Seat = "one" | "two";

export type GameSettings = {
  /** Board is `size` × `size` intersections. */
  size: number;
  /** Stones in a line needed to win. */
  winLength: number;
  variant: RuleVariant;
  firstPlayer: FirstPlayer;
  obstacles: ObstacleLayout;
  /** Taking a move back. Off by default in the stricter variants. */
  allowUndo: boolean;
  /** Burning a turn on a corner stone rather than playing where it matters. */
  allowSkip: boolean;
  /** Trading seats with the opponent. `swapsPerSeat` caps how often. */
  allowSwap: boolean;
  swapsPerSeat: number;
};

export type GameState = {
  settings: GameSettings;
  /** Row-major, `size * size` entries. See `indexOf` / `pointOf`. */
  board: Cell[];
  /** Every move played so far, in order. */
  moves: Move[];
  /** The colour that opened, kept so the game can be replayed from move zero. */
  opener: Stone;
  /** Which seat currently holds each colour. Exchanged by `swapSeats`. */
  seats: Record<Stone, Seat>;
  /** Swaps each seat has spent, counted against `settings.swapsPerSeat`. */
  swapsUsed: Record<Seat, number>;
  toPlay: Stone;
  status: GameStatus;
  winner: Stone | null;
  /** The stones that completed the winning line, empty until someone wins. */
  winningLine: Point[];
};
