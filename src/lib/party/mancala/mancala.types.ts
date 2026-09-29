/**
 * Mancala, as its rules module (`mancala.ts`) speaks of it.
 *
 * THE HOLES ARE NUMBERED ROUND THE BOARD, counter-clockwise, the way seeds are
 * sown. There are fourteen, whichever rule set is played:
 *
 *   - 0 to 5: the first player's six pits, the row nearest them, left to right;
 *   - 6: the first player's store, at their right-hand end;
 *   - 7 to 12: the second player's six pits, the far row, right to left as the
 *     first player sees it (left to right as its owner does);
 *   - 13: the second player's store, at the first player's left.
 *
 * So the pit opposite pit `p` is `12 - p`, and a sowing goes on to the next
 * number, round from 13 to 0. In Kalah a sowing drops a seed into its own
 * store as it passes and skips the other; in Oware the stores are never sown
 * into and only hold what has been taken, so a sowing goes from 5 to 7 and
 * from 12 to 0.
 */

/** Who moves or holds something: 0 for the first player (the near row), 1 for the second. */
export type MancalaSeat = number;

/** The two rule sets offered: Kalah (the default) and Oware, played by the Abapa rules. */
export type MancalaRuleSet = "kalah" | "oware";

export type MancalaStatus = "playing" | "finished";

/**
 * Why a finished game ended, for the line that says who won to say why.
 *
 * - `rowEmpty` (Kalah): a row ran out, and each player took what was left on their side.
 * - `majority` (Oware): somebody took 25 or more, more than half of the 48.
 * - `even` (Oware): both took 24.
 * - `cannotFeed` (Oware): a player's opponent had no seeds and no sowing of theirs could give them any, so they took the seeds on their own side.
 * - `repeated` (Oware): the same position came round a third time, and each took the seeds on their side.
 */
export type MancalaEnding = "rowEmpty" | "majority" | "even" | "cannotFeed" | "repeated";

/** What one sowing did: what the line under the turn says, and what the board draws seed by seed. */
export type MancalaSowing = {
  /** The pit it was sown from, and whose it was. */
  pit: number;
  by: MancalaSeat;
  /** Every hole a seed fell in, in order: the last is where the last seed fell. */
  path: readonly number[];
  /** Kalah: the last seed fell in the sower's own store, so they sow again. */
  again: boolean;
  /** Seeds taken into the sower's store by this sowing: none when nothing was captured. */
  captured: number;
  /** The pits the capture emptied. */
  takenFrom: readonly number[];
  /** Oware: a capture that would have taken every seed the opponent had, and so took none. */
  grandSlam: boolean;
};

/**
 * A game, as its sowings make it. Only `board`, `players`, `first` and `moves`
 * are ever kept (`encodeMancala`); everything else is read again from them,
 * so a kept game can never hold a board its sowings do not make.
 */
export type MancalaGame = {
  /**
   * The board, counted in the holes a seed may be sown into: 14 for Kalah's
   * (twelve pits and both stores), 12 for Oware's (the pits alone). It is the
   * party game's "board size" (`PARTY_SPECS`), and it decides the rule set.
   */
  board: number;
  ruleSet: MancalaRuleSet;
  /** The names given at the table, in seat order: "" for one left blank. */
  players: readonly string[];
  /** The seat that sowed first. */
  first: MancalaSeat;
  /** Every pit sown from, in order: the game's whole record. */
  moves: readonly number[];
  /** Seeds in each of the fourteen holes, numbered as above. */
  holes: readonly number[];
  /** The seat whose turn it is; on a finished game, whoever sowed last. */
  toPlay: MancalaSeat;
  /** What the last sowing did, or null before the first. */
  last: MancalaSowing | null;
  status: MancalaStatus;
  /** On a finished game, the seat with the most seeds, or both when they are level. Empty while playing. */
  winners: readonly MancalaSeat[];
  ending: MancalaEnding | null;
  /**
   * Oware: every position since the last capture, as `positionKey` writes
   * it, once per time it was reached — how a third time round is noticed.
   * Always empty for Kalah, which cannot go round for ever.
   */
  seen: readonly string[];
};
