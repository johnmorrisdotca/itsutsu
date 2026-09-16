import { DIRECTIONS } from "./gomoku.constants";
import {
  findWinningLine,
  forbiddenAt,
  indexOf,
  isOnBoard,
  isStone,
  pointOf,
  rulesFor,
} from "./engine";
import { tengen } from "./obstacles";
import type { Cell, GameSettings, GameState, Point, Stone } from "./gomoku.types";
import type { MoveThreat, ThreatReport } from "./analysis.types";

/** How far from an existing stone a move is still considered relevant. */
const CANDIDATE_RADIUS = 2;

/** An empty report, used for positions where nothing is brewing. */
export function emptyReport(stone: Stone): ThreatReport {
  return {
    stone,
    five: [],
    openFour: [],
    doubleThreat: [],
    four: [],
    openThree: [],
  };
}

function withStone(
  board: Cell[],
  size: number,
  point: Point,
  stone: Stone,
): Cell[] {
  const next = board.slice();
  next[indexOf(size, point)] = stone;
  return next;
}

/**
 * The points lying on the four lines through `around`, out to `radius` steps
 * in each direction. A stone placed at `around` can only change the outcome
 * along these lines, so they bound every follow-up worth examining.
 */
export function linePoints(
  size: number,
  around: Point,
  radius: number,
): Point[] {
  const seen = new Set<number>();
  const points: Point[] = [];

  for (const step of DIRECTIONS) {
    for (let k = -radius; k <= radius; k += 1) {
      if (k === 0) continue;
      const point = { row: around.row + step.row * k, col: around.col + step.col * k };
      if (!isOnBoard(size, point)) continue;
      const index = indexOf(size, point);
      if (seen.has(index)) continue;
      seen.add(index);
      points.push(point);
    }
  }
  return points;
}

/**
 * The empty points on lines through `around` where `stone` would complete a
 * win. After a stone lands on `around`, these are the only new ways to make
 * five, so counting them classifies the threat that move just created.
 */
export function fiveCompletions(
  board: Cell[],
  settings: GameSettings,
  stone: Stone,
  around: Point,
): Point[] {
  const reach = rulesFor(settings, stone).winLength - 1;
  return linePoints(settings.size, around, reach).filter((point) => {
    if (board[indexOf(settings.size, point)] !== null) return false;
    const next = withStone(board, settings.size, point, stone);
    return findWinningLine(next, settings, point).length > 0;
  });
}

/**
 * Whether a follow-up stone somewhere along `step` would turn the position
 * into an open four. Restricted to one line so the caller can count threats
 * per direction: an open three has a follow-up at each end, but it is still a
 * single threat, and only threats on *different* lines combine into a double.
 */
function hasOpenFourFollowUp(
  board: Cell[],
  settings: GameSettings,
  stone: Stone,
  around: Point,
  step: Point,
): boolean {
  const reach = rulesFor(settings, stone).winLength - 1;

  for (let k = -reach; k <= reach; k += 1) {
    if (k === 0) continue;
    const follow = {
      row: around.row + step.row * k,
      col: around.col + step.col * k,
    };
    if (!isOnBoard(settings.size, follow)) continue;
    if (board[indexOf(settings.size, follow)] !== null) continue;

    const next = withStone(board, settings.size, follow, stone);
    // A five is a bigger threat than an open four, and already counted.
    if (findWinningLine(next, settings, follow).length > 0) continue;
    if (fiveCompletions(next, settings, stone, follow).length >= 2) return true;
  }
  return false;
}

/**
 * Classifies what `stone` would create by playing `point`. Two ways to make
 * five cannot both be blocked, so that is an open four; one way forces a
 * reply; a move that only sets up an open four is an open three. Threats on
 * two different lines at once — a four and a three (四三), or two open threes
 * (三三) — are a double threat, which one stone cannot answer.
 */
export function threatAt(
  board: Cell[],
  settings: GameSettings,
  stone: Stone,
  point: Point,
): MoveThreat {
  const none: MoveThreat = {
    kind: null,
    fiveCompletions: 0,
    openThreeDirections: 0,
  };
  if (board[indexOf(settings.size, point)] !== null) return none;

  const after = withStone(board, settings.size, point, stone);
  if (findWinningLine(after, settings, point).length > 0) {
    return { ...none, kind: "five" };
  }

  const fives = fiveCompletions(after, settings, stone, point).length;
  if (fives >= 2) {
    return { kind: "openFour", fiveCompletions: fives, openThreeDirections: 0 };
  }

  let openThreeDirections = 0;
  for (const step of DIRECTIONS) {
    if (hasOpenFourFollowUp(after, settings, stone, point, step)) {
      openThreeDirections += 1;
    }
  }

  const threat = { fiveCompletions: fives, openThreeDirections };
  if (fives === 1) {
    return { ...threat, kind: openThreeDirections >= 1 ? "doubleThreat" : "four" };
  }
  if (openThreeDirections >= 2) return { ...threat, kind: "doubleThreat" };
  if (openThreeDirections === 1) return { ...threat, kind: "openThree" };
  return { ...threat, kind: null };
}

/**
 * Empty intersections close enough to the existing stones to matter. On an
 * untouched board only the centre is offered.
 *
 * WORKED FROM THE STONES OUTWARDS, NOT FROM THE BOARD INWARDS, because the
 * search calls this at every node it visits — tens of thousands of times for
 * one move — and the two directions cost very different amounts. Asking of
 * every empty point "is any stone within two of you" is the whole board times
 * every stone: on a fifteen by fifteen board a dozen moves in, about two and a
 * half thousand distance tests, each through a closure, after a first whole-
 * board pass that built a `Point` for every stone. Stamping each stone's five
 * by five neighbourhood into a flag array instead is a dozen times twenty-five
 * touches and one pass to collect: measured over 4,000 calls at that position,
 * 21.4 µs before and 11.4 µs after, off an ordering that cost 87 µs a node.
 *
 * Most of what is left is the `Point` objects themselves — about sixty of them
 * a call, which is what the callers are handed and not something this can
 * decide to stop making. A version of this written as a local closure timed at
 * 1.9 µs, and that number is an artefact worth naming rather than a target:
 * inlined into its caller, V8 could see the array never escaped and skipped the
 * allocation entirely. An exported function called from another module does
 * not get that, and the search does read the points.
 *
 * THE ORDER IS PART OF THE ANSWER and is deliberately unchanged: board index
 * order, which is what the search's ordering breaks its ties by and therefore
 * what decides which move the computer plays when two are worth the same. The
 * collecting pass walks the indices in order for that reason, rather than
 * emitting each stone's neighbourhood as it is stamped.
 *
 * The flag array is made per call rather than kept between them. Measured at
 * 2.0 µs against 1.9 for a reused one, which does not buy a piece of mutable
 * module state that every future caller would have to be trusted not to
 * re-enter.
 */
export function candidatePoints(state: GameState): Point[] {
  const { size } = state.settings;
  const board = state.board;
  const near = new Uint8Array(board.length);
  let stones = 0;

  for (let index = 0; index < board.length; index += 1) {
    if (!isStone(board[index])) continue;
    stones += 1;
    const row = Math.floor(index / size);
    const col = index - row * size;
    const rowFrom = Math.max(0, row - CANDIDATE_RADIUS);
    const rowTo = Math.min(size - 1, row + CANDIDATE_RADIUS);
    const colFrom = Math.max(0, col - CANDIDATE_RADIUS);
    const colTo = Math.min(size - 1, col + CANDIDATE_RADIUS);
    for (let r = rowFrom; r <= rowTo; r += 1) {
      const rowStart = r * size;
      for (let c = colFrom; c <= colTo; c += 1) near[rowStart + c] = 1;
    }
  }

  if (stones === 0) {
    const centre = tengen(size);
    return board[indexOf(size, centre)] === null ? [centre] : [];
  }

  const points: Point[] = [];
  for (let index = 0; index < board.length; index += 1) {
    if (near[index] === 0 || board[index] !== null) continue;
    points.push(pointOf(size, index));
  }
  return points;
}

/**
 * Every threat `stone` can create from the current position, by kind. A point
 * the variant forbids that colour is no threat at all — black cannot win renju
 * through a double three — so those are left out.
 */
export function scanThreats(state: GameState, stone: Stone): ThreatReport {
  const report = emptyReport(stone);
  for (const point of candidatePoints(state)) {
    if (forbiddenAt(state.board, state.settings, stone, point) !== null) continue;
    const { kind } = threatAt(state.board, state.settings, stone, point);
    if (kind !== null) report[kind].push(point);
  }
  return report;
}
