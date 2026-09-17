import type { Assessment, Suggestion } from "@/lib/gomoku/analysis.types";
import { assess, newlyLost } from "@/lib/gomoku/analysis";
import { nextBoardSize, otherStone, previousBoardSize } from "@/lib/gomoku/engine";
import { BOARD_SIZES, VARIANT_SPECS, WIN_LENGTH } from "@/lib/gomoku/gomoku.constants";
import type { GameSettings, GameState, Point, Seat } from "@/lib/gomoku/gomoku.types";
import type { BoardMark } from "@/components/board/board.types";
import { AWARENESS_LEVELS } from "./game.constants";
import type { FatalMove, GameSession, ResizeDirection, SessionSettings } from "./game.types";

/**
 * Pure helpers behind `useGameSession`, kept out of the hook so it stays a
 * readable account of the timeline rather than a mixture of state and reading.
 */

/**
 * Every position's assessment, read once however many times it is asked for.
 *
 * A move asks for it twice: once when it is made, to see whether it handed the
 * game over, and again a moment later when the board draws the position that
 * move produced. Both are the same immutable state, and the reading is the
 * dearest thing the page's own thread does — so the second ask is answered
 * from here. Keyed on the object itself and held weakly, so a position nobody
 * can reach any more takes its reading with it.
 */
const ASSESSED = new WeakMap<GameState, Assessment>();

export function assessOnce(state: GameState): Assessment {
  const known = ASSESSED.get(state);
  if (known !== undefined) return known;
  const assessment = assess(state);
  ASSESSED.set(state, assessment);
  return assessment;
}

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

/**
 * The settings a new game starts from: the old ones with the changes laid
 * over, minus the seed — a new game draws its own, or the dead squares and
 * the piece queue would repeat — and with the line length following a new
 * variant unless one was asked for.
 */
export function nextGameSettings(
  current: GameSettings,
  next: Partial<GameSettings>,
): GameSettings {
  const { seed: _previous, ...carried } = current;
  void _previous;
  const settings = { ...carried, ...next } as GameSettings;
  if (next.variant !== undefined && next.winLength === undefined) {
    settings.winLength = VARIANT_SPECS[next.variant].winLength ?? WIN_LENGTH;
  }
  // A choice about the centre discs belongs to the game it was made in.
  if (next.variant !== undefined && next.openingDiscs === undefined) delete settings.openingDiscs;
  return settings;
}

/** The colour a seat is holding right now, for labelling the controls. */
export function stoneForSeat(session: GameSession, seat: Seat) {
  return session.state.seats.black === seat
    ? "black"
    : session.state.seats.white === seat
      ? "white"
      : otherStone(session.state.toPlay);
}

/**
 * The size a resize proposal would move the board to, or null at the end of
 * the list. A game played on boards of its own grows and shrinks through its
 * own list; the rest use the site's.
 */
export function resizeTarget(state: GameState, direction: ResizeDirection): number | null {
  const sizes = VARIANT_SPECS[state.settings.variant].boardSizes ?? BOARD_SIZES;
  return direction === "grow"
    ? nextBoardSize(state.settings.size, sizes)
    : previousBoardSize(state.settings.size, sizes);
}
