import { GAME_STATUS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameState, GameStatus, Stone } from "@/lib/gomoku/gomoku.types";

/**
 * What the writer knows and the reader would otherwise replay to find out:
 * whose turn it is, and whether the engine still considers the game running.
 *
 * A list of games asked those two questions by replaying every move of every
 * game in it, which is work that grows with total play rather than with what
 * is on screen. The side that APPLIES a move already holds the settled state,
 * so it writes the answer down and the reader reads two columns.
 *
 * WHY IT IS A PAIR AND NOT ONE COLUMN. A stored `toPlay` alone cannot say the
 * three things there are to say. Null in it would mean both "the game is over,
 * so nobody is to move" and "nothing has ever written here" — and the second
 * must fall back to a replay while the first must not. `settledStatus` is the
 * column that tells them apart, exactly as `Game.result` needs `Game.status`
 * to say whether it means anything. A null status is the only "nothing said".
 *
 * WHY NEITHER IS WRITTEN BY HAND. Both come out of `settledTurn`, and nothing
 * else names either column, so the pair cannot be written half-right: there is
 * no path that stores "playing" with nobody to move. That is the whole safety
 * property, and it is why this is a module rather than two lines at each of
 * the six writers.
 *
 * WHY MOVE PARITY IS NEVER THE ANSWER. Connect6 lays two stones a turn, a
 * twist game owes a quarter turn before the turn is over, and a swap opening
 * changes which colour a seat is playing. The count of moves says nothing
 * about whose turn it is in any of them. The state does, so the state is what
 * is read.
 */
export type SettledTurn = {
  /** The engine's own status — see `GAME_STATUS`. Never null here: this is a written answer. */
  settledStatus: GameStatus;
  /** The colour to move, and null when the settled position is not one anybody moves in. */
  settledToPlay: Stone | null;
};

/** The pair, from the state the writer has just settled. The only way either column is filled. */
export function settledTurn(state: Pick<GameState, "status" | "toPlay">): SettledTurn {
  const running = state.status === GAME_STATUS.playing;
  return {
    settledStatus: state.status,
    // Nobody is to move in a position the engine has ended, and naming a colour
    // there would be a turn that is not anybody's.
    settledToPlay: running ? state.toPlay : null,
  };
}

/**
 * The pair that says nothing, for a writer that changes the position without
 * being able to settle it.
 *
 * This is the honest answer, not a failure: a fork copies move rows across
 * without replaying them, and a rules change re-decides which colour opens
 * without a stone being played. Neither holds a settled state, so neither may
 * leave one behind — and a reader seeing null replays, which is always right.
 */
export const UNSETTLED = { settledStatus: null, settledToPlay: null } as const;

/** What a reader gets back, once it has been told: whether it runs, and whose move. */
export type SettledPosition = {
  /** The engine still has the game running. */
  running: boolean;
  /** Whose move, while it runs; null once it does not. */
  toPlay: Stone | null;
};

/**
 * Reads the pair back, or null when nothing has been written — which is not a
 * failure either, and the caller replays.
 *
 * Every value is checked against the domain rather than cast into it. A column
 * is a string as far as the database is concerned, and a row carrying
 * something that is not a status this engine knows has to read as "nothing
 * said" rather than as a status: trusting it would put a game in the wrong
 * group for ever, silently, which is the one outcome storing this at all must
 * not buy.
 */
export function settledPosition(row: {
  settledStatus: string | null;
  settledToPlay: string | null;
}): SettledPosition | null {
  const status = row.settledStatus;
  if (status === null || !(status in GAME_STATUS)) return null;
  if (status !== GAME_STATUS.playing) return { running: false, toPlay: null };
  const stone = row.settledToPlay;
  /*
   * "Playing" with nobody to move is a pair `settledTurn` cannot produce, so a
   * row holding one was written by something else and is not a row to reason
   * from. Back to the replay, which can always answer.
   */
  if (stone === null || !(stone in STONES)) return null;
  return { running: true, toPlay: stone as Stone };
}
