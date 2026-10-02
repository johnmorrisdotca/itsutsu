import type { GameResult, GameState, Match, Position, Settings, Strength } from "@johnmorrisdotca/sugoroku";

import type { SugorokuKind } from "./sugoroku.constants";

/**
 * A GAME OF ONE OF THE SEVEN, AS A TABLE KEEPS IT: who sits where and the
 * record of the match so far — the package's own text (`replayRecord`), with the
 * dice held to `seed` — and nothing else. Every number a board draws is read
 * again from the record (`viewOf`), so a game read back out of storage is
 * exactly the game its moves make, or none; and the table is plain data that two
 * equal games share, whichever way they were reached.
 *
 * Seat 0 is white and seat 1 is black. A match is one table: the games of it
 * follow one another in the one record.
 */
export type SugorokuTable = {
  readonly kind: SugorokuKind;
  /** The match length in points: 1 is a single game. */
  readonly points: number;
  /** The dice are the ones this seed makes, in the order the game asks for them. */
  readonly seed: number;
  /** The names in seat order; blank where none was given. */
  readonly players: readonly string[];
  /** Which seats a computer plays. */
  readonly computers: readonly boolean[];
  /** Each computer seat's strength, and "" for a person's seat. */
  readonly levels: readonly string[];
  /** The record of the match so far, in the package's text. */
  readonly text: string;
};

/**
 * A MOVE, as a browser sends it and the rules take it. The roll is not a move:
 * the dice are the seed's, so the next roll is already known to the table
 * (`peekRoll`), and the turn is one move — the roll as it was and the play made
 * with it — which is how the package writes a turn in its record.
 *
 * A play is a list of steps, a checker from its own point to its own point (the
 * bar is 25, off the board is 0), made one after another.
 */
export type SugorokuMove =
  | { t: "play"; steps: readonly (readonly [number, number])[] }
  | { t: "double" }
  | { t: "take" }
  | { t: "drop" }
  | { t: "concede" };

/** The table as a board reads it: replayed from the record once, and kept by its identity. */
export type SugorokuView = {
  readonly settings: Settings;
  readonly match: Match;
  /** The game in play, or null once the match is over. */
  readonly game: GameState | null;
  /** The match's last finished game, for the position it ended in; null before any. */
  readonly last: { readonly result: GameResult; readonly position: Position } | null;
  /** Dice taken from the seed so far. */
  readonly drawn: number;
};

export type { Strength };
