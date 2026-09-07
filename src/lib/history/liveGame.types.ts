import type { Handicap } from "@/lib/gomoku/gomoku.types";
import type { GameDetail } from "./gameHistory.types";

/** The rules a shared game is created with, and may change before move one. */
export type LiveGameSettings = {
  size: number;
  variant: string;
  obstacles: string;
  opening: string;
  handicap: Handicap;
};

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
