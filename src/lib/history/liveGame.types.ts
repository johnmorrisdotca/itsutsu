import type { Handicap, PieceCell, Point } from "@/lib/gomoku/gomoku.types";

/**
 * What a client may send as a move: a stone, a sliding piece, or the quarter
 * turn that finishes a stone in the twist games.
 */
export type MoveRequest =
  | { kind: "place"; row: number; col: number }
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
};

/** Why a timeout claim was refused. */
export type TimeoutRefusal =
  | "not-found"
  | "finished"
  | "wrong-token"
  | "no-clock"
  | "not-due"
  | "your-own-turn";

export type TimeoutOutcome =
  | { ok: true; game: GameDetail }
  | { ok: false; reason: TimeoutRefusal };

/** Why a change of rules was refused. `started` means a stone is already down. */
export type SettingsRefusal = "not-found" | "finished" | "wrong-token" | "started";

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
  | "conflict";

export type MoveOutcome =
  | { ok: true; game: GameDetail }
  | { ok: false; reason: MoveRefusal };

/** What the creator of a game gets back: the game, and both seat links. */
export type CreatedGame = {
  id: string;
  blackToken: string;
  whiteToken: string;
};
