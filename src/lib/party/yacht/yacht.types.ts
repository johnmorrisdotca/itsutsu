/**
 * Yacht, the dice game, as its rules module (`yacht.ts`) speaks of it.
 *
 * Five dice, up to three rolls a turn, and a score sheet of thirteen boxes
 * each filled once. A die is its face, 1 to 6, or 0 before the turn's first
 * roll. A box is a number: its place on the sheet (`YACHT_BOXES`).
 */

/** Who sits where: 0 is the first player, round the table in the order the set-up named them. */
export type YachtSeat = number;

/** A box on the score sheet, by its key. */
export type YachtBox =
  | "ones"
  | "twos"
  | "threes"
  | "fours"
  | "fives"
  | "sixes"
  | "threeKind"
  | "fourKind"
  | "fullHouse"
  | "smallStraight"
  | "largeStraight"
  | "yacht"
  | "chance";

/**
 * One move at the table.
 *
 * - `roll`: throw every die not held. `hold` is a mask of five bits, bit `i`
 *   set to keep die `i` as it lies; the turn's first roll holds nothing.
 * - `score`: write the dice into an empty box on your sheet, and pass the dice on.
 */
export type YachtMove = { kind: "roll"; hold: number } | { kind: "score"; box: number };

export type YachtPhase = "playing" | "finished";

/**
 * A game, as its table and moves make it. Only the seed, the seats and the
 * moves are ever kept (`encodeYacht`); the dice and the sheets are read again
 * from them (`replayYacht`), and every roll is drawn from the seed and how
 * many rolls came before it, so a reload throws exactly what it threw.
 */
export type YachtGame = {
  /** Boxes on the sheet: 13. The party game's one "board size". */
  size: number;
  /** What every roll of this game is drawn from. */
  seed: number;
  /** The names given at the table, in seat order: "" for one left blank. */
  players: readonly string[];
  /** Which seats a computer plays. */
  computers: readonly boolean[];
  /** Every move made, in order. A whole game is at most four moves a box, so a list copies little. */
  moves: readonly YachtMove[];
  /** How many rolls the game has thrown: the next roll is drawn from this and the seed. */
  thrown: number;
  /** The five dice as they lie, 0 before the turn's first roll. */
  dice: readonly number[];
  /** The dice the last roll kept where they lay, as a mask of five bits: the table draws them still. */
  held: number;
  /** Rolls taken this turn, 0 to 3. */
  rolls: number;
  /** Each seat's sheet: a score in each box written, null in each still empty. */
  sheets: readonly (readonly (number | null)[])[];
  toPlay: YachtSeat;
  /** Counts every change of the player to move: a new number is a new turn. */
  turn: number;
  phase: YachtPhase;
  /** On a finished game, every seat with the highest total. */
  winners: readonly YachtSeat[];
  /** The last move played, and by whom, for the line that says what just happened. */
  last: { seat: YachtSeat; move: YachtMove; score?: number } | null;
};
