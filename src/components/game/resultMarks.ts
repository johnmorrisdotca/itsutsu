import type { ResultOutcome } from "@/lib/history/gameResult.types";

import { RESULT_MARKS } from "./resultMark.constants";
import type { ResultMarkKind } from "./resultMark.types";

/**
 * WHICH MARK AN OUTCOME GETS, decided here and nowhere else, so a win is a
 * tick on every page that says it.
 *
 * - A tick: solved, found, won, "you won", a winner named at a shared screen.
 * - A cross: lost, given up, out of time, out of guesses, somebody else won
 *   where the reader is the one "you" at the table.
 * - A bar: a draw, and anything not finished or finished with nobody winning.
 *
 * A game at one screen is said by colour ("Black wins") because both people at
 * it are "you"; it is marked as a result reached, a tick, never a loss.
 */
export function markOfOutcome(outcome: ResultOutcome): ResultMarkKind {
  if (outcome === "won" || outcome === "decided") return RESULT_MARKS.success;
  if (outcome === "lost") return RESULT_MARKS.failure;
  return RESULT_MARKS.other;
}

/** A game's result from one seat's side: won, lost, or neither (a draw, or not over). */
export function markOfSeat(winner: string | null, seat: string, ended: boolean): ResultMarkKind {
  if (!ended || winner === null) return RESULT_MARKS.other;
  return winner === seat ? RESULT_MARKS.success : RESULT_MARKS.failure;
}

/** What a filed game's result says, from one seat's side, and its mark. */
export type SeatResult = { mark: ResultMarkKind; words: string };

/**
 * A FILED GAME'S RESULT, told to one reader: "You won", "You lost", a draw,
 * or a game nobody finished. With no seat (a game at one screen, or a reader
 * who played in neither chair), the colour that won is named instead, with a
 * tick, because a result was reached and it was nobody's loss here.
 */
export function seatResult(result: "black" | "white" | "draw" | "abandoned", seat: string | null, colourWon: string): SeatResult {
  if (result === "draw") return { mark: RESULT_MARKS.other, words: "Draw" };
  if (result === "abandoned") return { mark: RESULT_MARKS.other, words: "Unfinished" };
  if (seat === null) return { mark: RESULT_MARKS.success, words: colourWon };
  return result === seat ? { mark: RESULT_MARKS.success, words: "You won" } : { mark: RESULT_MARKS.failure, words: "You lost" };
}
