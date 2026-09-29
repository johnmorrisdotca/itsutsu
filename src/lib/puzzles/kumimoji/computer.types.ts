import type { PartyGame } from "./party.types";

/** What a computer did in one step of its turn, for the line over its table. */
export type ComputerSaid =
  | { kind: "rebuilt" }
  | { kind: "laid"; word: string }
  | { kind: "drew" }
  | { kind: "traded"; tile: string }
  | { kind: "done"; out: boolean }
  | { kind: "resigned" };

/** One step of a computer's turn: the game after it, and what it did. The last step's game is the one kept. */
export type ComputerStep = { game: PartyGame; said: ComputerSaid };
