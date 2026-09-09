import { GAME_STATUS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameState } from "@/lib/gomoku/gomoku.types";
import type { GameDetail } from "./gameHistory.types";

/**
 * A game the server has closed without a closing move — a resignation, or a
 * strict timeout — as the board should show it.
 *
 * The engine decides the game from the moves, and these games end by something
 * that is not a move: nobody plays a stone to resign. Replaying the move list
 * alone therefore leaves a finished game looking unfinished, and the loser's
 * opponent staring at "Your move" until they reload.
 *
 * So the record has the last word, and only ever to close a game the engine
 * still thinks is running: a state the engine has already settled is returned
 * untouched, so this can never overrule a win the rules produced.
 *
 * Lifted out of SharedGame when that file went past the size gate. It was
 * always a pure function about a game rather than anything to do with drawing
 * one, and out here it can be tested without a browser.
 */
export function settleFromRecord(state: GameState, detail: GameDetail): GameState {
  if (detail.status !== "finished" || state.status !== GAME_STATUS.playing) return state;
  if (detail.result === "draw") return { ...state, status: GAME_STATUS.draw };
  const winner = detail.winner === STONES.black || detail.winner === STONES.white ? detail.winner : null;
  if (winner === null) return state;
  return { ...state, status: GAME_STATUS.won, winner, winBy: null };
}
