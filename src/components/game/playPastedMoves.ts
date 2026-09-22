import { createGame } from "@/lib/gomoku/engine";
import { playMove } from "@/lib/gomoku/engine";
import { passesOwed } from "@/lib/gomoku/rules/forcedPass";
import { MOVE_KINDS } from "@/lib/gomoku/gomoku.constants";
import type { GameSettings, GameState, Point } from "@/lib/gomoku/gomoku.types";

/**
 * A LIST OF POINTS PLAYED OUT ON A FRESH BOARD, position by position.
 *
 * Pure, and beside the engine rather than inside it: every move goes through
 * `playMove`, so what comes back is the rules' own answer and not this
 * module's. Nothing here knows whether a move is legal — it asks, and stops at
 * the first refusal.
 *
 * FROM AN EMPTY BOARD OF THE SAME GAME. Pasting onto a position somebody had
 * already clicked out would play one game on top of another and call the
 * result theirs.
 *
 * EVERY POSITION, not just the last. The board's record lists them and its
 * forward and back controls walk them, which is the whole of "paste a moves
 * list to view that game and browse around" — a final position alone would be
 * a picture, not a game.
 */
export type PastedGame = {
  /** The empty board, then one state per move that could be played. */
  states: GameState[];
  /** How many moves went down. */
  played: number;
  /**
   * The 1-based number of the first move the rules refused, or null when the
   * whole list went down. Said out loud rather than dropped: a list that goes
   * wrong halfway is a different game, and somebody has to be told which move.
   */
  refusedAt: number | null;
};

export function playPastedMoves(settings: GameSettings, points: readonly Point[], seed: number): PastedGame {
  const first = createGame(settings, seed);
  const states: GameState[] = [first];
  let at = first;
  for (const [index, point] of points.entries()) {
    /*
     * A pass the move leaves owed is taken here, as the board itself takes it
     * when a person clicks — otherwise a pasted game and a played one would
     * diverge at the first forced pass, in a flipping game especially.
     */
    const next = passesOwed(playMove(at, point, MOVE_KINDS.place, null));
    // `playMove` hands back the state it was given when a move is not legal.
    if (next === at) return { states, played: index, refusedAt: index + 1 };
    at = next;
    states.push(next);
  }
  return { states, played: points.length, refusedAt: null };
}
