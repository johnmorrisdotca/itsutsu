import { DEFENCE_WEIGHT, OUTLOOKS, SHAPE_BASE } from "./analysis.constants";
import {
  cellAt,
  indexOf,
  isOnBoard,
  otherStone,
  seatToPlay,
} from "./engine";
import { DIRECTIONS, GAME_STATUS, STONES } from "./gomoku.constants";
import { candidatePoints, emptyReport, scanThreats } from "./threats";
import { tengen } from "./obstacles";
import type {
  Assessment,
  Outlook,
  Suggestion,
  SuggestionReason,
  ThreatReport,
} from "./analysis.types";
import type {
  Cell,
  GameSettings,
  GameState,
  Point,
  Stone,
} from "./gomoku.types";

/**
 * Reads the position without changing it. Everything here is advisory: the
 * engine never consults an assessment to decide what is legal or who has won.
 *
 * The reading is a shallow one — immediate wins, unanswerable fours, and the
 * combined threats that follow from them. It does not search, so it is
 * deliberately conservative about the strongest claims: `lost` is reserved for
 * positions where the win genuinely cannot be prevented by one stone, such as
 * an open four already on the board. Everything short of that is `critical` or
 * `danger`, which say "answer this" rather than "it is over".
 */
export function assess(state: GameState): Assessment {
  const mover = state.toPlay;
  const foe = otherStone(mover);

  if (state.status === GAME_STATUS.won && state.winner !== null) {
    return settled(state.winner, OUTLOOKS.won, OUTLOOKS.lost, mover);
  }
  if (state.status === GAME_STATUS.draw) {
    return settled(mover, OUTLOOKS.even, OUTLOOKS.even, mover);
  }

  const mine = scanThreats(state, mover);
  const theirs = scanThreats(state, foe);
  const build = (
    moverOutlook: Outlook,
    foeOutlook: Outlook,
    forcedPoints: Point[] = [],
    decided = false,
  ): Assessment => ({
    toPlay: mover,
    threats: reports(mover, mine, theirs),
    outlook: outlooks(mover, moverOutlook, foeOutlook),
    forcedPoints,
    decided,
  });

  // A win on the board right now beats everything else.
  if (mine.five.length > 0) {
    return build(OUTLOOKS.winning, OUTLOOKS.lost, mine.five, true);
  }
  // Two separate fives cannot both be blocked with one stone.
  if (theirs.five.length >= 2) {
    return build(OUTLOOKS.lost, OUTLOOKS.winning, theirs.five, true);
  }
  if (theirs.five.length === 1) {
    return build(OUTLOOKS.danger, OUTLOOKS.ahead, theirs.five);
  }
  if (mine.openFour.length > 0) {
    return build(OUTLOOKS.winning, OUTLOOKS.critical, mine.openFour, true);
  }
  // A four-and-three wins unless the opponent can force first with a four.
  if (mine.doubleThreat.length > 0 && !hasForcingReply(theirs)) {
    return build(OUTLOOKS.winning, OUTLOOKS.critical, mine.doubleThreat, true);
  }
  /*
   * An open three. It has to be answered, but it is answerable — and the two
   * points that would extend it sit on one line, so a single stone kills both.
   * That is why this is a warning and not a loss.
   */
  if (theirs.openFour.length > 0) {
    return build(OUTLOOKS.danger, OUTLOOKS.ahead, theirs.openFour);
  }
  if (theirs.doubleThreat.length > 0) {
    /*
     * One double threat can still be answered by taking the point itself.
     * Two of them, with no forcing reply to interrupt with, cannot.
     */
    if (theirs.doubleThreat.length >= 2 && !hasForcingReply(mine)) {
      return build(OUTLOOKS.lost, OUTLOOKS.winning, theirs.doubleThreat, true);
    }
    return build(OUTLOOKS.critical, OUTLOOKS.ahead, theirs.doubleThreat);
  }
  if (mine.openThree.length > 0 && theirs.openThree.length === 0) {
    return build(OUTLOOKS.ahead, OUTLOOKS.danger);
  }
  if (theirs.openThree.length > 0 && mine.openThree.length === 0) {
    return build(OUTLOOKS.danger, OUTLOOKS.ahead, theirs.openThree);
  }
  return build(OUTLOOKS.even, OUTLOOKS.even);
}

/** Whether a colour can answer a threat by forcing one of its own. */
function hasForcingReply(report: ThreatReport): boolean {
  return (
    report.five.length > 0 ||
    report.openFour.length > 0 ||
    report.doubleThreat.length > 0 ||
    report.four.length > 0
  );
}

function reports(
  mover: Stone,
  mine: ThreatReport,
  theirs: ThreatReport,
): Record<Stone, ThreatReport> {
  return mover === STONES.black
    ? { black: mine, white: theirs }
    : { black: theirs, white: mine };
}

function outlooks(
  mover: Stone,
  moverOutlook: Outlook,
  foeOutlook: Outlook,
): Record<Stone, Outlook> {
  return mover === STONES.black
    ? { black: moverOutlook, white: foeOutlook }
    : { black: foeOutlook, white: moverOutlook };
}

function settled(
  subject: Stone,
  subjectOutlook: Outlook,
  otherOutlook: Outlook,
  mover: Stone,
): Assessment {
  const outlook = outlooks(subject, subjectOutlook, otherOutlook);
  return {
    toPlay: mover,
    threats: {
      black: emptyReport(STONES.black),
      white: emptyReport(STONES.white),
    },
    outlook,
    forcedPoints: [],
    decided: true,
  };
}

/**
 * Whether the move that produced `after` threw the game away: the position was
 * still playable for `stone` beforehand and is decided against it now. This is
 * 敗着 — the losing move.
 */
export function isFatalMove(
  before: Assessment,
  after: Assessment,
  stone: Stone,
): boolean {
  return (
    after.outlook[stone] === OUTLOOKS.lost &&
    before.outlook[stone] !== OUTLOOKS.lost
  );
}

/**
 * The colour that has just become lost, if one has.
 *
 * A losing move is usually only visible one ply after it is played: ignoring
 * an open three is the mistake, but nothing is unstoppable until the open four
 * actually lands, and by then it is the *opponent* who is moving. So the
 * blunder is attributed by finding who became lost, not by asking whether the
 * player who just moved lost themselves.
 */
export function newlyLost(before: Assessment, after: Assessment): Stone | null {
  for (const stone of [STONES.black, STONES.white] as const) {
    if (isFatalMove(before, after, stone)) return stone;
  }
  return null;
}

/**
 * Whether swapping seats now would simply steal a decided game. A swap is a
 * gamble on an unclear position, not a way to claim a win someone else built.
 */
export function isSwapBlocked(assessment: Assessment): boolean {
  return assessment.decided;
}

/**
 * How promising an empty point looks for `stone`, ignoring forced sequences.
 * Every window of `winLength` through the point that the opponent has not
 * already broken scores by how many friendly stones it holds.
 */
export function shapeScore(
  board: Cell[],
  settings: GameSettings,
  stone: Stone,
  point: Point,
): number {
  const { size, winLength } = settings;
  let score = 0;

  for (const step of DIRECTIONS) {
    for (let offset = -(winLength - 1); offset <= 0; offset += 1) {
      let own = 0;
      let usable = true;
      for (let k = 0; k < winLength; k += 1) {
        const shift = offset + k;
        const cell: Point = {
          row: point.row + step.row * shift,
          col: point.col + step.col * shift,
        };
        if (!isOnBoard(size, cell)) {
          usable = false;
          break;
        }
        const value = board[indexOf(size, cell)];
        if (value === stone) own += 1;
        else if (value !== null) {
          usable = false;
          break;
        }
      }
      if (usable) score += SHAPE_BASE ** own;
    }
  }
  return score;
}

/** Distance from the centre, so ties break towards the middle of the board. */
function centreBonus(size: number, point: Point): number {
  const centre = tengen(size);
  const distance =
    Math.abs(point.row - centre.row) + Math.abs(point.col - centre.col);
  return Math.max(0, size - distance) / size;
}

const REASON_CONFIDENCE: Record<SuggestionReason, number> = {
  win: 100,
  blockWin: 96,
  openFour: 94,
  doubleThreat: 92,
  blockOpenFour: 88,
  blockDoubleThreat: 86,
  four: 70,
  openThree: 74,
  blockOpenThree: 72,
  shape: 50,
  opening: 60,
};

/**
 * The engine's pick for the player to move, with the reason it likes it.
 * Forced tactics come first; otherwise it falls back to shape.
 */
export function suggestMove(state: GameState): Suggestion | null {
  if (state.status !== GAME_STATUS.playing) return null;

  const mover = state.toPlay;
  const foe = otherStone(mover);
  const candidates = candidatePoints(state);
  if (candidates.length === 0) return null;

  if (state.moves.length === 0) {
    const centre = tengen(state.settings.size);
    if (cellAt(state, centre) === null) return made(centre, "opening");
  }

  const mine = scanThreats(state, mover);
  const theirs = scanThreats(state, foe);

  const ladder: [Point[], SuggestionReason][] = [
    [mine.five, "win"],
    [theirs.five, "blockWin"],
    [mine.openFour, "openFour"],
    [mine.doubleThreat, "doubleThreat"],
    [theirs.openFour, "blockOpenFour"],
    [theirs.doubleThreat, "blockDoubleThreat"],
    [mine.openThree, "openThree"],
    [theirs.openThree, "blockOpenThree"],
    [mine.four, "four"],
  ];

  for (const [points, reason] of ladder) {
    if (points.length === 0) continue;
    const best = bestByShape(state, points, mover, foe);
    return made(best, reason);
  }

  return made(bestByShape(state, candidates, mover, foe), "shape");
}

function bestByShape(
  state: GameState,
  points: Point[],
  mover: Stone,
  foe: Stone,
): Point {
  const { board, settings } = state;
  const score = (point: Point) =>
    shapeScore(board, settings, mover, point) +
    shapeScore(board, settings, foe, point) * DEFENCE_WEIGHT +
    centreBonus(settings.size, point);

  return points.reduce((best, point) =>
    score(point) > score(best) ? point : best,
  );
}

function made(point: Point, reason: SuggestionReason): Suggestion {
  return { point, reason, confidence: REASON_CONFIDENCE[reason] };
}

/** The seat that would benefit from a hint right now. */
export function seatNeedingHint(state: GameState) {
  return seatToPlay(state);
}
