import { STONES } from "./gomoku.constants";
import type { GameState, Point } from "./gomoku.types";

/**
 * What the search remembers about positions it has already read.
 *
 * In a line game the same position is reached again and again inside one
 * search: black here then white there, or white there then black here, is one
 * board. A plain search reads it afresh every time it arrives, and at six plies
 * over ten candidates a node that is a great deal of reading twice. This is the
 * table that stops it — a transposition table, in the literature, which with
 * good move ordering was measured as nearly all the pruning a search can get.
 *
 * TWO THINGS ARE KEPT, and both are only as good as the rule for keeping them:
 *
 * - **What a position was worth, and how sure the search was.** A value found
 *   inside the window is the value; one that caused a cut is only a bound. A
 *   bound answers a later question only when it settles it — see `recalled`.
 *   And nothing is kept from a subtree the clock cut short: that value is a
 *   guess, and a guess written down is a guess that gets believed.
 * - **Which move was best there**, which is worth keeping even when the value
 *   is too shallow to reuse: the next, deeper pass tries it first.
 *
 * It belongs to one search. A table kept between moves would be a question of
 * how big it may grow and when it is stale; a table per move is neither, and a
 * move's search is where the repetition is.
 */

/** How sure a remembered value is. */
export const BOUND = {
  /** The position is worth exactly this, to the depth read. */
  exact: 0,
  /** Worth at least this: it caused a cut for the side looking for more. */
  lower: 1,
  /** Worth at most this: every move came in at or under the floor. */
  upper: 2,
} as const;

export type Bound = (typeof BOUND)[keyof typeof BOUND];

export type Remembered = {
  /** Plies searched under this position when it was read. */
  depth: number;
  value: number;
  bound: Bound;
  /** The best move found there, as `pointKey`, or -1 when none was. */
  move: number;
};

export type SearchMemory = Map<number, Remembered>;

/** The largest board side the keys are made for. Every board on this site is smaller. */
const SIDE = 32;

/**
 * Random keys, two 32-bit words for each stone on each point, made once from a
 * fixed seed so a position has the same key in every run and on every machine.
 * xorshift32: statistically plain, which is all a hash key needs to be.
 */
const KEYS = (() => {
  const keys = new Uint32Array(SIDE * SIDE * 2 * 2);
  let x = 0x2545f491;
  for (let at = 0; at < keys.length; at += 1) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    keys[at] = x >>> 0;
  }
  return keys;
})();

/**
 * The position as one number, for the table.
 *
 * Read from the whole board rather than kept up as stones are added. That costs
 * a pass over the points at every node, about what copying the board for the
 * move already costs, and it buys correctness in the games where a move does
 * more than add a stone — a capture takes two away — with nothing to keep in
 * step. Whose turn it is, the captures so far and how many moves are down go in
 * too: the same stones with a different player to move, a different capture
 * count, or a different point in a two-stone turn are different positions.
 */
export function positionKey(state: GameState): number {
  let hi = 0;
  let lo = 0;
  const { board } = state;
  const size = state.settings.size;
  for (let at = 0; at < board.length; at += 1) {
    const cell = board[at];
    if (cell !== STONES.black && cell !== STONES.white) continue;
    const row = Math.floor(at / size);
    const slot = ((row * SIDE + (at - row * size)) * 2 + (cell === STONES.black ? 0 : 1)) * 2;
    hi ^= KEYS[slot];
    lo ^= KEYS[slot + 1];
  }
  const turn = state.moves.length * 4 + (state.toPlay === STONES.black ? 0 : 1) * 2 + 1;
  hi ^= Math.imul(turn, 0x9e3779b1);
  lo ^= Math.imul(turn, 0x85ebca6b);
  const captured = state.captures.black * 64 + state.captures.white + 1;
  hi ^= Math.imul(captured, 0xc2b2ae35);
  lo ^= Math.imul(captured, 0x27d4eb2f);
  // Fifty-three bits of the sixty-four, as many as a number holds exactly.
  return (hi >>> 11) * 4_294_967_296 + (lo >>> 0);
}

/** A point as one number, for remembering a move without keeping an object. */
export function pointKey(point: Point): number {
  return point.row * SIDE + point.col;
}

/**
 * A remembered value that answers this node's question outright, or undefined.
 *
 * Only from a read at least as deep as this one needs, and only when it
 * settles the question asked: an exact value always does; a lower bound does
 * when it already reaches the ceiling, and an upper bound when it is already
 * at or under the floor. Anything else is a hint about ordering, not an answer.
 */
export function recalled(entry: Remembered | undefined, depth: number, low: number, high: number): number | undefined {
  if (entry === undefined || entry.depth < depth) return undefined;
  if (entry.bound === BOUND.exact) return entry.value;
  if (entry.bound === BOUND.lower && entry.value >= high) return entry.value;
  if (entry.bound === BOUND.upper && entry.value <= low) return entry.value;
  return undefined;
}

/**
 * The floor to search a root move against: a hair under the best found so far.
 *
 * A root move searched with the whole window costs a whole search, and every
 * root move used to be, because the ties are wanted and a move cut off at the
 * best comes back as a bound — indistinguishable from a move as good as it. A
 * floor just UNDER the best keeps the ties exact: a move worth exactly the best
 * is above it and comes back as its true value, and a move worth less comes
 * back at or under it, below the best, dropped as before. Same moves, same ties,
 * same dice, and every move that is not as good stops at its first refutation.
 *
 * Relative, because a score is a float and a fixed hair under a large one is no
 * hair at all: `1e6 - 1e-9` is `1e6`.
 */
export function floorUnder(best: number): number {
  return best === -Infinity ? -Infinity : best - Math.max(1e-9, Math.abs(best) * 1e-9);
}

/** How sure a value found in the window `(low, high)` is. */
export function boundOf(value: number, low: number, high: number): Bound {
  if (value <= low) return BOUND.upper;
  if (value >= high) return BOUND.lower;
  return BOUND.exact;
}

/** Where a remembered move sits in a list of candidates, or -1 when it is not among them. */
export function indexOfMove(candidates: readonly Point[], move: number | undefined): number {
  if (move === undefined || move < 0) return -1;
  for (let at = 0; at < candidates.length; at += 1) {
    if (pointKey(candidates[at]) === move) return at;
  }
  return -1;
}
