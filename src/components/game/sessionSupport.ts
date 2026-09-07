import type { Assessment, Suggestion } from "@/lib/gomoku/analysis.types";
import { newlyLost } from "@/lib/gomoku/analysis";
import { otherStone } from "@/lib/gomoku/engine";
import type { GameState, Point, Seat } from "@/lib/gomoku/gomoku.types";
import type { BoardMark } from "@/components/board/board.types";
import { AWARENESS_LEVELS } from "./game.constants";
import type { FatalMove, GameSession, SessionSettings } from "./game.types";

/**
 * Pure helpers behind `useGameSession`, kept out of the hook so it stays a
 * readable account of the timeline rather than a mixture of state and reading.
 */

/**
 * Attributes a newly decided game to the move that threw it away.
 *
 * The move that makes a win unstoppable belongs to the winner, so the mistake
 * is the loser's most recent stone — the one that failed to answer.
 */
export function findFatalMove(
  before: Assessment,
  after: Assessment,
  next: GameState,
): FatalMove | null {
  const loser = newlyLost(before, after);
  if (loser === null) return null;

  for (let index = next.moves.length - 1; index >= 0; index -= 1) {
    if (next.moves[index].stone === loser) {
      return { moveNumber: index + 1, stone: loser };
    }
  }
  return null;
}

/**
 * Turns the reading of the position into things to draw. Forced points appear
 * only at the highest awareness level; a hint and a piece of advice always
 * appear, because they were explicitly asked for. Forbidden points are not
 * here: they are a rule, and the board draws them itself.
 */
export function buildMarks(
  assessment: Assessment,
  settings: SessionSettings,
  hint: Suggestion | null,
  helpMark: Point | null,
): BoardMark[] {
  const marks: BoardMark[] = [];

  if (settings.awareness === AWARENESS_LEVELS.full) {
    for (const point of assessment.forcedPoints) {
      marks.push({ ...point, kind: "forced" });
    }
    // One ply earlier than a forced point, and only if the game asked for it.
    if (settings.earlyWarning) {
      for (const point of assessment.buildingPoints) {
        marks.push({ ...point, kind: "building" });
      }
    }
  }
  if (helpMark !== null) marks.push({ ...helpMark, kind: "help" });
  if (hint !== null) marks.push({ ...hint.point, kind: "hint" });

  return marks;
}

/** The colour a seat is holding right now, for labelling the controls. */
export function stoneForSeat(session: GameSession, seat: Seat) {
  return session.state.seats.black === seat
    ? "black"
    : session.state.seats.white === seat
      ? "white"
      : otherStone(session.state.toPlay);
}
