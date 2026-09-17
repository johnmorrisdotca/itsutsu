import { otherStone } from "./engine";
import { spent, type Budget } from "./forcedWin";
import { GAME_STATUS, MOVE_KINDS } from "./gomoku.constants";
import { LineBoard, sideOf } from "./lineBoard";
import { FORCED } from "./opponent.constants";
import type { GameState, Stone } from "./gomoku.types";
import type { BotTurn } from "./opponent.types";

/**
 * The finders of forced wins — by fours (`forcedWin.ts`) and by threats
 * (`threatWin.ts`) — read on one board edited in place.
 *
 * The same steps in the same order: the same candidate points, the same counts
 * turning points away, the same engine verdicts, the same budget spent on the
 * same moves. The only difference is that a move is laid and lifted here rather
 * than copied into a new game, and a point's closeness to five is a count the
 * board already keeps. Measured before this, the finder of threats used its
 * whole 400 ms share of a two-second move in half the positions tried, finding
 * nothing, and left the defence — the check that a move does not hand the
 * other side a forced win, and the half that measured best — no time at all.
 *
 * `lineThreats.test.ts` holds these to the answers of the originals.
 */

/** Whether `stone` could make five now, anywhere near the stones. */
function hasFive(board: LineBoard, stone: Stone): boolean {
  const side = sideOf(stone);
  if (board.emptyFiveLines[side] === 0) return false;
  for (let index = 0; index < board.points; index += 1) {
    if (!board.isCandidate(index) || board.fiveLines[side * board.points + index] === 0) continue;
    if (board.completes(index, stone)) return true;
  }
  return false;
}

/** `stopsNeither`: whether one stone on any of `completions` leaves the game still going. The four is on the board. */
function stopsNeither(board: LineBoard, completions: readonly number[], budget: Budget): boolean {
  for (const block of completions) {
    budget.nodes -= 1;
    if (!board.place(block)) continue;
    const over = board.status !== GAME_STATUS.playing;
    board.undo();
    if (over) return false;
  }
  return true;
}

/** `firstFour`: shortest chains first. An index, or -1. */
function firstFour(board: LineBoard, me: Stone, fours: number, budget: Budget): number {
  for (let length = 1; length <= fours; length += 1) {
    const index = firstFourWithin(board, me, length, budget);
    if (index >= 0) return index;
    if (spent(budget)) return -1;
  }
  return -1;
}

function firstFourWithin(board: LineBoard, me: Stone, fours: number, budget: Budget): number {
  const foe = otherStone(me);
  const own = sideOf(me) * board.points;
  for (let point = 0; point < board.points; point += 1) {
    if (!board.isCandidate(point)) continue;
    if (spent(budget)) return -1;
    if (board.fourLines[own + point] === 0) continue;

    budget.nodes -= 1;
    if (!board.place(point)) continue;
    if (board.status !== GAME_STATUS.playing) {
      const won = board.winner === me;
      board.undo();
      if (won) return point;
      continue;
    }
    const completions = board.completions(point, me);
    if (completions.length === 0) {
      board.undo();
      continue;
    }
    if (completions.length >= 2) {
      const wins = stopsNeither(board, completions, budget);
      board.undo();
      if (wins) return point;
      continue;
    }

    budget.nodes -= 1;
    const block = completions[0];
    // The defender may not take the only point that saves them — a forbidden point in renju.
    if (!board.place(block)) {
      board.undo();
      return point;
    }
    let wins = false;
    if (board.status === GAME_STATUS.playing && board.completions(block, foe, true).length === 0) {
      wins = fours > 1 && firstFourWithin(board, me, fours - 1, budget) >= 0;
    }
    board.undo();
    board.undo();
    if (wins) return point;
  }
  return -1;
}

/** `openFours`: each move giving `me` two fives to make at once, with what it would complete. */
function openFours(board: LineBoard, me: Stone): Array<{ index: number; completions: number[] }> {
  const own = sideOf(me) * board.points;
  const found: Array<{ index: number; completions: number[] }> = [];
  for (let index = 0; index < board.points; index += 1) {
    if (!board.isCandidate(index) || board.fourLines[own + index] === 0) continue;
    if (!board.mayPlay(index, me)) continue;
    board.lay(index, me);
    const completions = board.completions(index, me);
    board.lift(index);
    if (completions.length >= 2) found.push({ index, completions });
  }
  return found;
}

/** `repliesToRead`: the points an open four needs, then the defender's own fours. */
function repliesToRead(board: LineBoard, me: Stone, threats: ReadonlyArray<{ index: number; completions: number[] }>): number[] {
  const seen = new Set<number>();
  const replies: number[] = [];
  const add = (index: number) => {
    if (seen.has(index)) return;
    seen.add(index);
    replies.push(index);
  };
  for (const threat of threats) {
    add(threat.index);
    for (const index of threat.completions) add(index);
  }
  const foe = otherStone(me);
  const theirs = sideOf(foe) * board.points;
  for (let index = 0; index < board.points; index += 1) {
    if (!board.isCandidate(index) || board.fourLines[theirs + index] === 0) continue;
    if (!board.mayPlay(index, foe)) continue;
    board.lay(index, foe);
    const makesFour = board.completions(index, foe, true).length > 0;
    board.lift(index);
    if (makesFour) add(index);
  }
  return replies;
}

type Settled = Map<string, boolean>;

function settle(settled: Settled, key: string, answer: boolean, budget: Budget): boolean {
  if (!spent(budget)) settled.set(key, answer);
  return answer;
}

/** `defenderLoses`, with the defender to move on the board. */
function defenderLoses(board: LineBoard, me: Stone, threes: number, fours: number, budget: Budget, settled: Settled): boolean {
  const key = `d${threes}.${fours}.${board.key()}`;
  const known = settled.get(key);
  if (known !== undefined) return known;

  const foe = otherStone(me);
  if (hasFive(board, foe)) return settle(settled, key, false, budget);
  const threats = openFours(board, me);
  if (threats.length === 0) return settle(settled, key, false, budget);

  for (const reply of repliesToRead(board, me, threats)) {
    if (spent(budget)) return false;
    budget.nodes -= 1;
    if (!board.place(reply)) continue;
    if (board.status !== GAME_STATUS.playing) {
      board.undo();
      return settle(settled, key, false, budget);
    }

    const theirFives = board.completions(reply, foe);
    if (theirFives.length >= 2) {
      board.undo();
      return settle(settled, key, false, budget);
    }
    if (theirFives.length === 1) {
      if (fours === 0) {
        board.undo();
        return settle(settled, key, false, budget);
      }
      budget.nodes -= 1;
      if (!board.place(theirFives[0])) {
        board.undo();
        return settle(settled, key, false, budget);
      }
      if (board.status !== GAME_STATUS.playing) {
        const won = board.winner === me;
        board.undo();
        board.undo();
        if (won) continue;
        return settle(settled, key, false, budget);
      }
      const loses = defenderLoses(board, me, threes, fours - 1, budget, settled);
      board.undo();
      board.undo();
      if (!loses) return settle(settled, key, false, budget);
      continue;
    }

    if (openFours(board, me).length > 0) {
      board.undo();
      continue;
    }
    const found = winningThreatWithin(board, me, threes, FORCED.mixedFours, budget, settled);
    board.undo();
    if (found < 0) return settle(settled, key, false, budget);
  }
  return settle(settled, key, true, budget);
}

/** `winningThreatWithin`, with `me` to move on the board. An index, or -1. */
function winningThreatWithin(board: LineBoard, me: Stone, threes: number, fours: number, budget: Budget, settled: Settled): number {
  const byFours = firstFour(board, me, FORCED.fours, budget);
  if (byFours >= 0) return byFours;
  if (threes === 0) return -1;

  const key = `w${threes}.${fours}.${board.key()}`;
  if (settled.get(key) === false) return -1;

  const foe = otherStone(me);
  for (let point = 0; point < board.points; point += 1) {
    if (!board.isCandidate(point)) continue;
    if (spent(budget)) return -1;
    // A three is two short of five: `couldMakeLine(…, 2)`.
    if (board.openCount(point, me) < board.winLength - 3) continue;

    budget.nodes -= 1;
    if (!board.place(point)) continue;
    if (board.status !== GAME_STATUS.playing) {
      const won = board.winner === me;
      board.undo();
      if (won) return point;
      continue;
    }

    const completions = board.completions(point, me);
    if (completions.length >= 2) {
      const wins = stopsNeither(board, completions, budget);
      board.undo();
      if (wins) return point;
      continue;
    }
    if (completions.length === 1) {
      if (fours === 0) {
        board.undo();
        continue;
      }
      budget.nodes -= 1;
      if (!board.place(completions[0])) {
        board.undo();
        return point;
      }
      let wins = false;
      if (board.status === GAME_STATUS.playing && board.completions(completions[0], foe, true).length === 0) {
        wins = winningThreatWithin(board, me, threes, fours - 1, budget, settled) >= 0;
      }
      board.undo();
      board.undo();
      if (wins) return point;
      continue;
    }

    const loses = defenderLoses(board, me, threes - 1, FORCED.fours, budget, settled);
    board.undo();
    if (loses) return point;
  }
  settle(settled, key, false, budget);
  return -1;
}

/** How many empty points a claim needs — the same `ROOM` as `threatWin.ts`. */
const ROOM = 60;

/**
 * `threatWinTurn` on a line board. The caller has already asked
 * `findsForcedWins`; this asks the rest of the same questions in the same order.
 */
export function lineThreatWinTurn(state: GameState, budget: Budget, threes: number): BotTurn | null {
  const board = new LineBoard(state);
  const me = state.toPlay;
  if (hasFive(board, otherStone(me))) return null;
  let empty = 0;
  for (const cell of board.cells) if (cell === null) empty += 1;
  if (empty < ROOM) return null;
  const settled: Settled = new Map();
  for (let depth = 0; depth <= threes; depth += 1) {
    const index = winningThreatWithin(board, me, depth, FORCED.mixedFours, budget, settled);
    if (index >= 0) {
      const point = board.pointAt(index);
      return { kind: MOVE_KINDS.place, row: point.row, col: point.col };
    }
    if (spent(budget)) return null;
  }
  return null;
}
