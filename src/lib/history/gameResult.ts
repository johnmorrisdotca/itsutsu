import { drawnByLength } from "@/lib/gomoku/engine";
import { GAME_STATUS, STONES, WIN_REASONS } from "@/lib/gomoku/gomoku.constants";
import type { GameState, Stone } from "@/lib/gomoku/gomoku.types";
import { endingRanOut, repeatedTooOften } from "@/lib/gomoku/rules/checkersDraws";
import { discCount } from "@/lib/gomoku/rules/flips";
import { endedWithNoMoves } from "@/lib/gomoku/rules/forcedPass";
import { scoreArea } from "@/lib/gomoku/rules/go";
import { stalledDrawOf } from "@/lib/gomoku/rules/noProgress";

import { NO_PROGRESS_DRAW_REASONS } from "./gameResult.constants";
import type { DrawReason, GameResultFacts, ResultReason, ResultScore } from "./gameResult.types";

/**
 * HOW A FINISHED GAME CAME OUT, AND WHY, as facts rather than words.
 *
 * John, looking at a finished Mini Reversi board with nothing on it saying who
 * won: "the board sometimes it's not that obvious... like if there were no more
 * moves and you won". So the result card says it, and this decides what it says.
 *
 * THE RECORD SAYS WHO WON; THE ENGINE SAYS WHY. The stored `result` is the verdict
 * every ladder and list already trusts. The reason is the engine's own, from
 * replaying the moves — but only where the replay reaches the same verdict.
 *
 * Two wins are not moves at all and leave the replayed position still running: a
 * resignation, and a loss on time under a strict clock. They are told apart by the
 * one thing the record keeps about them — a timeout counts the loser's forfeit,
 * and a resignation does not.
 *
 * A draw's reason is asked of the engine in the order the board asks it
 * (`GameStatus`), so the card and the board never give one game two reasons.
 *
 * Nothing here is guessed. An unfinished game (`abandoned`) has no result, so it
 * has no facts: null, and no card.
 */
export function gameResultFacts({
  result,
  final,
  forfeits,
  seat,
  hotSeat,
}: {
  /** The stored result: a colour, `draw`, or `abandoned`. */
  result: string;
  /** The position the moves replay to. */
  final: GameState;
  /** Consecutive forfeits each colour ended the game with. */
  forfeits: { black: number; white: number };
  /** The colour this reader held, or null for somebody who did not play. */
  seat: Stone | null;
  /** Two people at one screen, where "you" would be both of them. */
  hotSeat: boolean;
}): GameResultFacts | null {
  if (result === "draw") {
    const reason = drawReasonOf(final);
    return { outcome: "draw", winner: null, reason, score: scoreOf(final, reason) };
  }
  if (result !== STONES.black && result !== STONES.white) return null;

  const winner: Stone = result;
  const loser: Stone = winner === STONES.black ? STONES.white : STONES.black;
  const settledOnBoard = final.status === GAME_STATUS.won && final.winner === winner && final.winBy !== null;
  const reason: ResultReason = settledOnBoard
    ? (final.winBy as ResultReason)
    : forfeits[loser] > 0
      ? WIN_REASONS.time
      : WIN_REASONS.resign;

  return {
    outcome: hotSeat || seat === null ? "decided" : seat === winner ? "won" : "lost",
    winner,
    reason,
    score: scoreOf(final, reason),
  };
}

/**
 * Why a draw is a draw, as the board says it. A position the replay does not read
 * as drawn has no reason this can vouch for, and is said plainly.
 */
export function drawReasonOf(final: GameState): DrawReason {
  if (final.status !== GAME_STATUS.draw) return "draw";
  const stall = stalledDrawOf(final);
  if (stall !== null) return NO_PROGRESS_DRAW_REASONS[stall.measure];
  if (endedWithNoMoves(final)) return "noMoves";
  if (repeatedTooOften(final)) return "repetition";
  if (endingRanOut(final)) return "endgameCount";
  if (drawnByLength(final)) return "length";
  return final.board.includes(null) ? "bothLines" : "boardFull";
}

/**
 * The score where the game keeps one, and only then: the discs of a flips game
 * decided on the count, the area of a territory game, and the pairs captured in
 * a capture game where any were taken. Null otherwise, rather than a 0–0 that
 * would read as a score for a game that never had one.
 */
function scoreOf(final: GameState, reason: ResultReason): ResultScore | null {
  if (reason === WIN_REASONS.count) return { kind: "discs", ...discCount(final.board) };
  if (reason === WIN_REASONS.territory) return { kind: "area", ...scoreArea(final.board, final.settings.size) };
  if (final.captures.black + final.captures.white > 0) {
    return { kind: "captures", black: final.captures.black, white: final.captures.white };
  }
  return null;
}
