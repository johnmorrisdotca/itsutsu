import { DIRECTIONS, HOT, VARIANT_SPECS } from "./gomoku.constants";
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

/*
 * LAID AND LIFTED, NEVER COPIED.
 *
 * Every question below is "what if a stone were here", and each used to be
 * answered on a fresh copy of the whole board. One threat reading asks it
 * hundreds of times — the stone, then every point that could complete it, then
 * every follow-up on four lines and every completion of each — so a reading of
 * one point made several hundred board copies, and the practice board's
 * assessment, which reads every candidate for both colours, measured 87 ms at
 * the start of a fifteen by fifteen game and 250 ms on nineteen by nineteen: a
 * visible stutter on the page after every move.
 *
 * So the exported functions copy the board ONCE, and everything under them
 * lays a stone on that working copy, asks, and lifts it again before doing
 * anything else. The answers are the same by construction — the board each
 * question sees is identical — and the caller's board is never touched.
 */

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
  return completionsOn(board.slice(), settings, stone, around);
}

/**
 * Whether a stone of `stone` at `point` could possibly complete a winning line:
 * on some line through it, the unbroken run of its own stones (and hotspots,
 * which join either colour) touching it is long enough. The full check builds
 * each run out of points and asks the colour's rules; this only counts.
 *
 * It is the full check's own first condition and nothing more — every rule
 * there wants a run at least the winning length — so a point it turns away is
 * one the full check would have turned away too, and a point it lets through
 * still goes to the full check. Nearly every point asked about is nowhere near
 * a line, which is where the time went: one assessment asked the full question
 * about a hundred thousand times.
 *
 * On a board whose lines wrap, or pass through wormholes, a run is not a
 * straight count, so there it lets everything through.
 */
function mayComplete(work: Cell[], settings: GameSettings, stone: Stone, point: Point, winLength: number): boolean {
  const spec = VARIANT_SPECS[settings.variant];
  if (spec.wrap !== "none" || spec.wormholes > 0) return true;
  const { size } = settings;
  const needed = winLength - 1;
  for (const step of DIRECTIONS) {
    const joined =
      runLength(work, size, point, step.row, step.col, stone, needed) +
      runLength(work, size, point, -step.row, -step.col, stone, needed);
    if (joined >= needed) return true;
  }
  return false;
}

/** How many of `stone`'s cells run unbroken from beside `point` one way, counting no further than `most`. */
function runLength(work: Cell[], size: number, point: Point, dRow: number, dCol: number, stone: Stone, most: number): number {
  let joined = 0;
  for (let k = 1; k <= most; k += 1) {
    const row = point.row + dRow * k;
    const col = point.col + dCol * k;
    if (row < 0 || col < 0 || row >= size || col >= size) break;
    const cell = work[row * size + col];
    if (cell !== stone && cell !== HOT) break;
    joined += 1;
  }
  return joined;
}

/** `fiveCompletions` on a working board it may lay stones on, as long as it lifts them again. */
function completionsOn(
  work: Cell[],
  settings: GameSettings,
  stone: Stone,
  around: Point,
): Point[] {
  const { winLength } = rulesFor(settings, stone);
  const { size } = settings;
  const reach = winLength - 1;
  const found: Point[] = [];
  /*
   * The points `linePoints` would list, in its order — each direction, nearest
   * the far end first — walked in place, so a Point is made only for a
   * completion rather than for all thirty-two candidates on every call.
   */
  for (const step of DIRECTIONS) {
    for (let k = -reach; k <= reach; k += 1) {
      if (k === 0) continue;
      const row = around.row + step.row * k;
      const col = around.col + step.col * k;
      if (row < 0 || col < 0 || row >= size || col >= size) continue;
      const at = row * size + col;
      if (work[at] !== null) continue;
      const point = { row, col };
      if (!mayComplete(work, settings, stone, point, winLength)) continue;
      work[at] = stone;
      const wins = findWinningLine(work, settings, point).length > 0;
      work[at] = null;
      if (wins) found.push(point);
    }
  }
  return found;
}

/**
 * Whether a follow-up stone somewhere along `step` would turn the position
 * into an open four. Restricted to one line so the caller can count threats
 * per direction: an open three has a follow-up at each end, but it is still a
 * single threat, and only threats on *different* lines combine into a double.
 */
function hasOpenFourFollowUp(
  work: Cell[],
  settings: GameSettings,
  stone: Stone,
  around: Point,
  step: Point,
): boolean {
  const { winLength } = rulesFor(settings, stone);
  const reach = winLength - 1;

  for (let k = -reach; k <= reach; k += 1) {
    if (k === 0) continue;
    const follow = {
      row: around.row + step.row * k,
      col: around.col + step.col * k,
    };
    if (!isOnBoard(settings.size, follow)) continue;
    const at = indexOf(settings.size, follow);
    if (work[at] !== null) continue;

    // A five is a bigger threat than an open four, and already counted.
    const five = mayComplete(work, settings, stone, follow, winLength);
    work[at] = stone;
    const opens =
      (!five || findWinningLine(work, settings, follow).length === 0) &&
      completionsOn(work, settings, stone, follow).length >= 2;
    work[at] = null;
    if (opens) return true;
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
  if (board[indexOf(settings.size, point)] !== null) return { ...NO_THREAT };
  return threatOn(board.slice(), settings, stone, point);
}

/** Nothing threatened. Always handed out as a copy, so no caller can change it for the next. */
const NO_THREAT: MoveThreat = { kind: null, fiveCompletions: 0, openThreeDirections: 0 };

/** `threatAt` on a working board, which it hands back exactly as it found it. */
function threatOn(
  work: Cell[],
  settings: GameSettings,
  stone: Stone,
  point: Point,
): MoveThreat {
  const at = indexOf(settings.size, point);
  if (work[at] !== null) return { ...NO_THREAT };

  const five = mayComplete(work, settings, stone, point, rulesFor(settings, stone).winLength);
  work[at] = stone;
  try {
    if (five && findWinningLine(work, settings, point).length > 0) {
      return { ...NO_THREAT, kind: "five" };
    }

    const fives = completionsOn(work, settings, stone, point).length;
    if (fives >= 2) {
      return { kind: "openFour", fiveCompletions: fives, openThreeDirections: 0 };
    }

    let openThreeDirections = 0;
    for (const step of DIRECTIONS) {
      if (hasOpenFourFollowUp(work, settings, stone, point, step)) {
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
  } finally {
    work[at] = null;
  }
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
  // One working copy for the whole scan: every reading lifts what it lays.
  const work = state.board.slice();
  for (const point of candidatePoints(state)) {
    if (forbiddenAt(state.board, state.settings, stone, point) !== null) continue;
    const { kind } = threatOn(work, state.settings, stone, point);
    if (kind !== null) report[kind].push(point);
  }
  return report;
}
