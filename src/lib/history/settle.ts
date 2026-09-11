import { GAME_STATUS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameState } from "@/lib/gomoku/gomoku.types";
import type { GameDetail, GameLifecycle } from "./gameHistory.types";

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

/**
 * Whether the page around the board has gone out of date.
 *
 * A match has one address in two presentations, and the SERVER picks between
 * them — `MatchPage` reads the status once and renders either the live board
 * or the filed record. Nothing told it to look again. So a game that ended
 * while somebody was sitting in front of it kept the live page for ever: the
 * board settled correctly (that is `settleFromRecord`, just above, which is
 * why the result banner appears and reads right), and everything AROUND the
 * board stayed as it was — no rematch, no heading naming the two players, no
 * applause, no verdict, a composer for a game nobody can speak into again.
 *
 * John found it on a game he lost to a computer player, which is the ordinary
 * way to meet it: a program answers at once, so most games here end with the
 * losing move arriving on a page the loser is looking at.
 *
 * Resigning was the one ending that worked, because `ResignButton` calls
 * `router.refresh()` for itself. Every other ending — their winning move, your
 * winning move, a draw, a flag claimed on time — had no such call anywhere in
 * the live board's tree. That asymmetry is the whole bug: the mechanism was
 * written once, for one button, and the endings that arrive by themselves
 * never got it.
 *
 * Asked of the two statuses rather than of the game, because that is all it
 * needs and it makes the answer testable without a browser. It is true exactly
 * once per game — on the poll that brings the result back — so the cost is one
 * re-render at the end of a game, on a page that has just stopped polling.
 */
export function settledSinceRendered(rendered: GameLifecycle, now: GameLifecycle): boolean {
  return rendered === "active" && now !== "active";
}
