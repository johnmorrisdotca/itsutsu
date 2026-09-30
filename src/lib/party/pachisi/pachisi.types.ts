/**
 * Pachisi, the race game of the cross and circle, as its rules module
 * (`pachisi.ts`) speaks of it.
 *
 * A PAWN IS A NUMBER: how far it has come. `PACHISI_NEST` (-1) waiting to
 * enter; 0 on its own entry square; up to `PACHISI_LAST_TRACK` (63) round the
 * shared track, where its square is `(entry + progress) % 68`; then its own
 * home path, and `PACHISI_HOME` (71) home. A pawn's square on the track is
 * read from its progress and its arm (`squareOf`), never stored.
 */

/** Who sits where: 0 is the first player, round the table in the order the set-up named them. */
export type PachisiSeat = number;

/**
 * One move at the table.
 *
 * - `roll`: throw the two dice.
 * - `move`: move one pawn by one of the values waiting (`pending[use]`): a die,
 *   or a bonus of 20 for a capture or 10 for a pawn home.
 * - `enter`: enter a pawn with both dice together, when they add to five.
 */
export type PachisiMove = { kind: "roll" } | { kind: "move"; pawn: number; use: number } | { kind: "enter"; pawn: number };

export type PachisiPhase = "roll" | "move" | "finished";

/**
 * A game, as its table and moves make it. Only the seed, the seats and the
 * moves are ever kept (`encodePachisi`); everything else is read again from
 * them (`replayPachisi`), and every throw is drawn from the seed and how many
 * throws came before it, so a reload throws exactly what it threw.
 */
export type PachisiGame = {
  /** The board's track: 68 squares, its one "size". */
  size: number;
  seed: number;
  players: readonly string[];
  computers: readonly boolean[];
  /** Which arm of the cross each seat starts from, 0 to 3: opposite arms for two. */
  arms: readonly number[];
  moves: readonly PachisiMove[];
  /** How many throws the game has made. */
  thrown: number;
  /** Each seat's four pawns, by progress. */
  pawns: readonly (readonly number[])[];
  toPlay: PachisiSeat;
  phase: PachisiPhase;
  /** The last throw's two dice, [0, 0] before the first. */
  dice: readonly [number, number];
  /** The values still to be used this throw: dice not yet moved, and any bonus earned. */
  pending: readonly number[];
  /** Doubles thrown in a row this turn: a third sends the leading pawn back. */
  doubles: number;
  /** Counts every change of the player to move. */
  turn: number;
  winners: readonly PachisiSeat[];
  /** What the last move did, for the line that says so. */
  last: PachisiEvent | null;
};

/** What just happened, in the terms the turn line says it. */
export type PachisiEvent =
  | { kind: "rolled"; seat: PachisiSeat; dice: readonly [number, number]; stuck: boolean }
  | { kind: "moved"; seat: PachisiSeat; pawn: number; by: number; took: PachisiSeat | null; home: boolean; stuck: boolean }
  | { kind: "entered"; seat: PachisiSeat; pawn: number; took: PachisiSeat | null; stuck: boolean }
  | { kind: "thirdDouble"; seat: PachisiSeat; pawn: number | null };
