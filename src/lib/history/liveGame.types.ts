import type { Handicap, PieceCell, Point } from "@/lib/gomoku/gomoku.types";

/**
 * What a client may send as a move: a stone, a sliding piece, or the quarter
 * turn that finishes a stone in the twist games.
 */
export type MoveRequest =
  | { kind: "place"; row: number; col: number; stone?: "black" | "white" }
  | { kind: "move"; row: number; col: number; from: Point }
  | { kind: "twist"; quadrant: number; clockwise: boolean }
  | { kind: "piece"; cells: PieceCell[] }
  | { kind: "pass" };
import type { GameDetail } from "./gameHistory.types";

/** The rules a shared game is created with, and may change before move one. */
export type LiveGameSettings = {
  size: number;
  variant: string;
  obstacles: string;
  opening: string;
  handicap: Handicap;
  /** Per-move time limit in milliseconds, or null for none. */
  moveTimeMs: number | null;
  /** What a missed deadline costs: "turn" or "game". */
  timeoutPenalty: string;
  /** Whether a seat may give the game up. */
  allowResign: boolean;
  /** The length the players agreed to, see DrawLimit. Absent is "none". */
  drawLimit?: string;
  /** "move": the limit resets each turn. "game": one budget a side for the whole game. */
  clockMode?: string;
  /**
   * Whether the result moves ratings. Required rather than defaulted: both
   * callers (the live-game route and the bot-series runner) already say so
   * explicitly, and a default here is exactly the defect this type used to
   * share with the route's own schema — a caller that forgets the field and
   * a caller that means "no" were the same `undefined`, so the wrong one
   * silently got read as the other. See AGENTS.md, "A board you were only
   * trying out creates a rated game".
   */
  rated: boolean;
  /** Post the white seat on the games page for anyone to take. */
  open: boolean;
};

/** Why a timeout claim was refused. */
export type TimeoutRefusal =
  | "not-found"
  | "finished"
  | "wrong-token"
  | "no-clock"
  | "not-due"
  | "your-own-turn"
  | "not-allowed"
  /** The game is an offer nobody has accepted yet. See `MoveRefusal.offered`. */
  | "offered";

export type TimeoutOutcome =
  | { ok: true; game: GameDetail }
  | { ok: false; reason: TimeoutRefusal };

/** Why a change of rules was refused. `started` means a stone is already down. */
export type SettingsRefusal = "not-found" | "finished" | "wrong-token" | "started" | "settled";

export type SettingsOutcome =
  | { ok: true; game: GameDetail }
  | { ok: false; reason: SettingsRefusal };

/** Why an attempted move was refused. Each maps to one HTTP status. */
export type MoveRefusal =
  | "not-found"
  | "finished"
  | "wrong-token"
  | "not-your-turn"
  | "illegal"
  | "conflict"
  /**
   * The game is an offer nobody has accepted yet.
   *
   * Its own reason rather than `finished` or `not-your-turn`, both of which
   * were in range and both of which would have been lies: the game has not
   * ended and it may well be this seat's turn. What is missing is the other
   * person's agreement, and a board that says "it is not your turn" about
   * that sends somebody looking for a move they have not got.
   */
  | "offered";

export type MoveOutcome =
  | { ok: true; game: GameDetail }
  | { ok: false; reason: MoveRefusal };

/** What the creator of a game gets back: the game, and both seat links. */
export type CreatedGame = {
  id: string;
  blackToken: string;
  whiteToken: string;
};
