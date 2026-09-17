import { otherStone } from "./engine";
import { GAME_STATUS } from "./gomoku.constants";
import { LineBoard, sideOf } from "./lineBoard";
import { DECIDED_SCORE, DRAW_SCORE, EVAL_WEIGHTS, SEARCH } from "./opponent.constants";
import { boundOf, recalled } from "./searchMemory";
import type { GameState, Point, Stone } from "./gomoku.types";

/**
 * The line games' look-ahead, read on one board edited in place.
 *
 * The same search as `opponentSearch.ts` — the same candidates, the same forced
 * replies, the same scores, the same memory and the same pruning — with every
 * reading taken from `LineBoard` instead of worked out again from a fresh copy
 * of the game. `lineSearch.test.ts` holds the two to choosing the same moves at
 * the same values; the difference is only how long they take.
 */

/** What the search has left to spend, shared with the root in `opponentSearch.ts`. */
export type Budget = { nodes: number; until: number };

function spent(budget: Budget): boolean {
  return budget.nodes <= 0 || Date.now() >= budget.until;
}

type Remembered = { depth: number; value: number; bound: 0 | 1 | 2; move: number };

/** One depth's list of moves to try, reused by every node at that depth. */
type Shelf = { points: number[]; scores: number[] };

/**
 * Reads the root's children on a line board: lays each, searches under it,
 * takes it back. Null for a point the rules refuse, as `applyTurn` refuses it.
 */
export function lineChildReader(
  state: GameState,
  me: Stone,
  budget: Budget,
  defence: number | undefined,
): (point: Point, depth: number, floor: number) => number | null {
  const board = new LineBoard(state);
  const shelves: Shelf[] = [];
  const memory = new Map<number, Remembered>();
  const reading: Reading = { board, me, budget, shelves, memory, defenceWeight: defence ?? EVAL_WEIGHTS.defence };
  return (point, depth, floor) => {
    if (!board.place(point.row * board.size + point.col)) return null;
    const value = negamax(reading, depth, floor, Infinity);
    board.undo();
    return value;
  };
}

type Reading = {
  board: LineBoard;
  me: Stone;
  budget: Budget;
  shelves: Shelf[];
  memory: Map<number, Remembered>;
  defenceWeight: number;
};

function terminalScore(board: LineBoard, me: Stone, depthLeft: number): number {
  if (board.status === GAME_STATUS.draw || board.winner === null) return DRAW_SCORE;
  return board.winner === me ? DECIDED_SCORE + depthLeft : -(DECIDED_SCORE + depthLeft);
}

/** `leafScore`: the board's shape for `me`, and nothing captured in the games a line board plays. */
function leafScore(board: LineBoard, me: Stone): number {
  return board.boardScore(me) + 0;
}

function negamax(reading: Reading, depth: number, alpha: number, beta: number): number {
  const { board, me, budget } = reading;
  if (board.status !== GAME_STATUS.playing) return terminalScore(board, me, depth);
  if (depth === 0) return leafScore(board, me);
  budget.nodes -= 1;
  if (spent(budget)) return leafScore(board, me);

  const key = board.key();
  const entry = reading.memory.get(key);
  const known = recalled(entry, depth, alpha, beta);
  if (known !== undefined) return known;

  const maximising = board.toPlay === me;
  const forced = forcedReplies(reading);
  const candidates = forced ?? nodeCandidates(reading, depth);
  const count = candidates.length;
  if (count === 0) return leafScore(board, me);

  let best = maximising ? -Infinity : Infinity;
  let bestMove = -1;
  let low = alpha;
  let high = beta;

  let first = -1;
  if (entry !== undefined) {
    for (let at = 0; at < count; at += 1) {
      if (candidates[at] === entry.move) {
        first = at;
        break;
      }
    }
  }
  for (let step = 0; step < count; step += 1) {
    const at = first < 0 ? step : step === 0 ? first : step <= first ? step - 1 : step;
    const index = candidates[at];
    if (!board.place(index)) continue;
    const value = negamax(reading, depth - 1, low, high);
    board.undo();

    if (maximising) {
      if (value > best) {
        best = value;
        bestMove = index;
      }
      if (best > low) low = best;
    } else {
      if (value < best) {
        best = value;
        bestMove = index;
      }
      if (best < high) high = best;
    }
    if (low >= high) break;
    if (spent(budget)) break;
  }

  if (best === Infinity || best === -Infinity) return leafScore(board, me);
  if (!spent(budget)) reading.memory.set(key, { depth, value: best, bound: boundOf(best, alpha, beta), move: bestMove });
  return best;
}

/**
 * `nodeCandidates` on the line board: every candidate point the rules allow, in
 * board order, scored as `pointScore` scores it, the best `SEARCH.branch` kept
 * by the same insertion and the same tie rule — so the same ten are kept.
 *
 * A point's shape is already on the board, so scoring is a read. And whether
 * the rules allow a point is asked only of a point good enough to be kept: an
 * illegal point is never kept either way, and a legal one is kept or not by the
 * same comparisons against the same kept scores, so the list comes out the
 * same — without the renju forbidden-shape reading on points that were never
 * going to make the ten.
 */
function nodeCandidates(reading: Reading, depth: number): number[] {
  const { board, defenceWeight } = reading;
  let shelf = reading.shelves[depth];
  if (shelf === undefined) {
    shelf = { points: [], scores: [] };
    reading.shelves[depth] = shelf;
  }
  const { points, scores } = shelf;
  const branch = SEARCH.branch;
  const count = board.points;
  const mine = sideOf(board.toPlay) * count;
  const theirs = (1 - sideOf(board.toPlay)) * count;
  const { shapes, centre } = board;
  let kept = 0;

  for (let index = 0; index < count; index += 1) {
    if (!board.isCandidate(index)) continue;
    const score =
      shapes[mine + index] * EVAL_WEIGHTS.shape +
      shapes[theirs + index] * EVAL_WEIGHTS.shape * defenceWeight +
      centre[index];
    if (kept === branch && score <= scores[branch - 1]) continue;
    if (!board.isLegal(index)) continue;

    let slot = kept < branch ? kept : branch - 1;
    while (slot > 0 && scores[slot - 1] < score) {
      scores[slot] = scores[slot - 1];
      points[slot] = points[slot - 1];
      slot -= 1;
    }
    scores[slot] = score;
    points[slot] = index;
    if (kept < branch) kept += 1;
  }
  points.length = kept;
  return points;
}

/**
 * `forcedReplies` on the line board — the same three rules, the same sets: a
 * five to make; a five of theirs to block; an open three of theirs answered at
 * the points that stop it, or by a four.
 *
 * In a quiet position the board's running counts already say no point is two
 * short of five for the other side or one short for either, and the answer is
 * null without looking at a single point. Otherwise the points are found by
 * their counts and read by the engine exactly as before, a stone laid and
 * lifted on this board rather than on a copy.
 */
function forcedReplies(reading: Reading): number[] | null {
  const { board } = reading;
  const mover = board.toPlay;
  const foe = otherStone(mover);
  const mine = sideOf(mover);
  const theirs = sideOf(foe);
  if (board.emptyFiveLines[mine] === 0 && board.emptyFiveLines[theirs] === 0 && board.emptyFourLines[theirs] === 0) {
    return null;
  }
  const count = board.points;
  const moverFives: number[] = [];
  const foeFives: number[] = [];
  const foeFours: number[] = [];
  for (let index = 0; index < count; index += 1) {
    if (!board.isCandidate(index)) continue;
    if (board.fiveLines[mine * count + index] > 0) moverFives.push(index);
    if (board.fiveLines[theirs * count + index] > 0) foeFives.push(index);
    else if (board.fourLines[theirs * count + index] > 0) foeFours.push(index);
  }

  const wins = moverFives.filter((index) => board.completes(index, mover));
  if (wins.length > 0) return wins;
  const blocks = foeFives.filter((index) => board.completes(index, foe));
  if (blocks.length > 0) return blocks;

  // Their open threes: a point that would give them two fives to make at once.
  const replies: number[] = [];
  const seen = new Set<number>();
  const add = (index: number) => {
    if (seen.has(index)) return;
    seen.add(index);
    replies.push(index);
  };
  for (const index of foeFours) {
    if (!board.mayPlay(index, foe)) continue;
    board.lay(index, foe);
    const completions = board.completions(index, foe);
    board.lift(index);
    if (completions.length < 2) continue;
    add(index);
    for (const point of completions) add(point);
  }
  if (replies.length === 0) return null;

  // And the mover's own fours, which the other side must answer first — `repliesToRead`'s last set.
  for (let index = 0; index < count; index += 1) {
    if (!board.isCandidate(index) || board.fourLines[mine * count + index] === 0) continue;
    if (!board.mayPlay(index, mover)) continue;
    board.lay(index, mover);
    const makesFour = board.completions(index, mover, true).length > 0;
    board.lift(index);
    if (makesFour) add(index);
  }
  return replies;
}
