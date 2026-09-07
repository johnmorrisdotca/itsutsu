import type { GameDetail } from "./gameHistory.types";

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
