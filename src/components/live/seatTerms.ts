import type { SeatOnBoard } from "@/components/mine/startGame.types";
import { hasHandicap } from "@/lib/gomoku/rules/handicap";

import type { RulesDraft } from "./rulesDraft";
import type { SeatTerms } from "./setUp.types";

/** The settings a game is compared on, whichever side of a match it is. */
type Comparable = Pick<
  RulesDraft & SeatOnBoard,
  "variant" | "moveTimeMs" | "opening" | "obstacles" | "rated" | "handicap" | "headStart" | "clockMode" | "timeoutPenalty"
>;

/**
 * WHAT MAKES A POSTED SEAT'S GAME THE GAME SOMEBODY CHOSE, besides the board.
 *
 * Asking for a game somebody is already asking for sits you down at their
 * seat. "The same game" was the game, the board and the pace, so somebody who
 * chose Pro with nobody named was sat down at a stranger's Free seat, and the
 * page before the game stated the stranger's rules instead of theirs. Every
 * setting that changes how the game is played, or how it is won or lost, is
 * part of the game:
 *
 * - the OPENING, which decides where the first stones may go;
 * - the OBSTACLES — star points blocked is a different board;
 * - WHETHER IT COUNTS: a friendly game that moves a rating is not the one chosen;
 * - on a clock, HOW THE CLOCK RUNS — three days a move and three days for the
 *   whole game share a number and nothing else — and, on a per-move clock,
 *   WHAT RUNNING OUT COSTS, a turn or the game.
 *
 * Settings only a clock reads are left out where there is no clock, rather
 * than compared: a draft carries a penalty whether or not anything will ever
 * read it, and two untimed games that differ only there are the same game.
 *
 * A HANDICAP GAME IS NEVER MATCHED, either way round — null here, no terms to
 * match on. A handicap is laid on one colour, and taking a posted seat gives
 * you whichever colour is free; the chooser's handicap and the poster's cannot
 * be compared as "the same" without knowing who sits where, so a game with one
 * posts its own seat. A head start is laid on one colour too, so the same.
 *
 * WHETHER A PLAYER MAY RESIGN IS NOT A TERM. It changes neither the play nor
 * how the board is won, only whether a player may concede early; the doorstep
 * states it before anyone presses Begin; and matching on it would split
 * otherwise identical seats between people whose saved habits differ, which is
 * the two-people-waiting-for-each-other this matching exists to prevent.
 */
export function seatTermsFor(game: Comparable): SeatTerms | null {
  if (hasHandicap(game)) return null;
  const timed = game.moveTimeMs !== null;
  const perMove = timed && game.clockMode !== "game";
  return {
    variant: game.variant,
    moveTimeMs: game.moveTimeMs,
    opening: game.opening,
    obstacles: game.obstacles,
    rated: game.rated,
    clockMode: timed ? game.clockMode : null,
    timeoutPenalty: perMove ? game.timeoutPenalty : null,
  };
}

/** Whether a posted seat's game is the game asked for, board aside. */
export function seatIsThisGame(seat: SeatOnBoard, asked: RulesDraft): boolean {
  const theirs = seatTermsFor(seat);
  const wanted = seatTermsFor(asked);
  if (theirs === null || wanted === null) return false;
  return (Object.keys(wanted) as (keyof SeatTerms)[]).every((term) => theirs[term] === wanted[term]);
}
