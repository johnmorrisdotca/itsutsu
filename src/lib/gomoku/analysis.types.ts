import type { Point, Stone } from "./gomoku.types";

/**
 * What a single move would create for the colour playing it. Ordered by
 * severity: a `five` ends the game, an `openFour` cannot be answered, a `four`
 * forces a reply, an `openThree` threatens to become an open four.
 */
export type ThreatKind =
  | "five"
  | "openFour"
  | "doubleThreat"
  | "four"
  | "openThree";

/**
 * What one candidate move would create, in enough detail to spot the combined
 * threats that decide games. `fiveCompletions` counts the ways to make five
 * straight after the move. `openThreeDirections` counts the *lines* along
 * which the move sets up an open four — counted per direction, because a
 * single open three has a follow-up at each end and is still only one threat.
 */
export type MoveThreat = {
  kind: ThreatKind | null;
  fiveCompletions: number;
  openThreeDirections: number;
};

/** Where a colour can create each kind of threat, given the current board. */
export type ThreatReport = {
  stone: Stone;
  /** Completes a winning line immediately. */
  five: Point[];
  /** Creates two separate ways to make five. Unanswerable. */
  openFour: Point[];
  /** Two threats at once — the classic four-and-three (四三). Unanswerable. */
  doubleThreat: Point[];
  /** Creates exactly one way to make five. Forces a reply. */
  four: Point[];
  /** Creates a position where an open four is available next. */
  openThree: Point[];
};

/**
 * How the game looks for one colour. These never change the rules — they only
 * describe the position so a player can see what they are walking into.
 */
export type Outlook =
  | "won"
  | "winning"
  | "ahead"
  | "even"
  | "danger"
  | "critical"
  | "lost";

export type Assessment = {
  toPlay: Stone;
  threats: Record<Stone, ThreatReport>;
  outlook: Record<Stone, Outlook>;
  /** Intersections the player to move must answer, or lose. */
  forcedPoints: Point[];
  /**
   * Where the opponent could *build* a new open three next move.
   *
   * This is one ply earlier than `forcedPoints`, which names threats already
   * on the board. Warning about it hands the defender a move they would
   * otherwise have had to see coming, so it is off unless a game turns it on.
   */
  buildingPoints: Point[];
  /** True once one side has a win the other cannot prevent. */
  decided: boolean;
};

/**
 * A rough read on who is ahead, as a percentage per colour summing to 100.
 *
 * It is an estimate from threats and shape, not a solved value — the engine
 * does not search. Shown to players as a feel for the position, never as a
 * fact about it.
 */
export type WinChance = Record<Stone, number>;

export type SuggestionReason =
  | "win"
  | "blockWin"
  | "openFour"
  | "blockOpenFour"
  | "doubleThreat"
  | "blockDoubleThreat"
  | "four"
  | "openThree"
  | "blockOpenThree"
  | "shape"
  | "opening";

export type Suggestion = {
  point: Point;
  reason: SuggestionReason;
  /** 0-100, how strongly the engine likes this move. */
  confidence: number;
};
