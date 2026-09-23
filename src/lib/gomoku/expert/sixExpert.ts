import { isLegalMove, isStone, otherStone, pointOf, stonesLeft } from "../engine";
import { PLACEMENTS, STONES, WRAP_MODES } from "../gomoku.constants";
import { EXPERT_KINDS, SIX, SIX_WEIGHTS } from "./expert.constants";
import type { Cell, GameState, Point, Stone, VariantSpec } from "../gomoku.types";
import type { Expert } from "./expert.types";

/**
 * The Connect6 player (board ticket BOT-06).
 *
 * Connect6 is played two stones a turn, and that changes what a threat is. A
 * THREAT is a stretch of six with at most two stones missing and none of the
 * other side's in it: its owner completes it next turn unless it is blocked.
 * One stone blocks a threat, and the defender has two a turn — so the whole
 * game turns on one number: how many stones the defender would need to block
 * every threat on the board. Two or fewer and the attack is parried; three or
 * more and it is won. That is the published way Connect6 is played and solved
 * (Wu's threat-space work), and the generic reading, built for one stone a
 * turn, counts lines rather than blocks and never sees it.
 *
 * So this reading counts BLOCKS: the threats' empty points, and the fewest of
 * them that touch every threat — greedily, the point in most threats first,
 * which is exact for the shapes that matter here (a four or five in a row,
 * whose threats all share points). Beside that it weighs every open stretch of
 * six by how full it is, as a line player would, so the search has something
 * to climb before a threat exists.
 *
 * Two stones a turn needs nothing special from the search: the engine keeps
 * the same side to move for the second stone, and `expertSearch.ts` already
 * reads whose move it is from the state.
 */

/** Whether a game is Connect6's kind: six in a row, two stones a turn, on an open square board. */
function sixApplies(spec: VariantSpec): boolean {
  return (
    spec.stonesPerTurn === 2 &&
    spec.winLength === 6 &&
    spec.placement === PLACEMENTS.free &&
    spec.wrap === WRAP_MODES.none &&
    !spec.captures &&
    !spec.misere &&
    !spec.makerBreaker &&
    spec.loseLength === null &&
    spec.queue === null &&
    spec.pieces === null &&
    !spec.flips &&
    !spec.go &&
    !spec.checkers
  );
}

const DIRECTIONS: readonly [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

/** One stretch of six: whose stones are in it, and where its empty points are. */
type Stretch = { black: number; white: number; empties: number[] };

/** Every stretch of six on the board that nothing but stones and empty points sits in. */
function stretches(board: readonly Cell[], size: number, length: number): Stretch[] {
  const found: Stretch[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      for (const [dr, dc] of DIRECTIONS) {
        const endRow = row + dr * (length - 1);
        const endCol = col + dc * (length - 1);
        if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;
        let black = 0;
        let white = 0;
        let dead = false;
        const empties: number[] = [];
        for (let step = 0; step < length; step += 1) {
          const index = (row + dr * step) * size + (col + dc * step);
          const cell = board[index];
          if (cell === STONES.black) black += 1;
          else if (cell === STONES.white) white += 1;
          else if (cell === null) empties.push(index);
          else dead = true;
        }
        if (!dead) found.push({ black, white, empties });
      }
    }
  }
  return found;
}

/**
 * The fewest stones that block every threat in `threats`: the point in the most
 * unblocked threats first, again and again. Greedy, and for the shapes that
 * decide games — rows of four and five, whose threats overlap — it is exact.
 */
export function blocksNeeded(threats: readonly Stretch[]): number {
  let open = threats.map((threat) => threat.empties);
  let blocks = 0;
  while (open.length > 0) {
    const count = new Map<number, number>();
    for (const empties of open) for (const index of empties) count.set(index, (count.get(index) ?? 0) + 1);
    let best = -1;
    let most = 0;
    for (const [index, n] of count) {
      if (n > most) {
        most = n;
        best = index;
      }
    }
    if (best === -1) break;
    blocks += 1;
    open = open.filter((empties) => !empties.includes(best));
  }
  return blocks;
}

/** What a Connect6 position is worth to `me`: blocks the other side needs, then open stretches. */
export function sixRead(state: GameState, me: Stone): number {
  const { size, winLength } = state.settings;
  const foe = otherStone(me);
  const all = stretches(state.board, size, winLength);
  const toMove = state.toPlay;
  const left = stonesLeft(state);

  let shape = 0;
  const mine: Stretch[] = [];
  const theirs: Stretch[] = [];
  for (const stretch of all) {
    const own = me === STONES.black ? stretch.black : stretch.white;
    const other = me === STONES.black ? stretch.white : stretch.black;
    if (own > 0 && other === 0) {
      shape += SIX_WEIGHTS.stretch[own] ?? 0;
      if (own >= winLength - 2) mine.push(stretch);
    } else if (other > 0 && own === 0) {
      shape -= (SIX_WEIGHTS.stretch[other] ?? 0) * SIX_WEIGHTS.defence;
      if (other >= winLength - 2) theirs.push(stretch);
    }
  }

  // Whoever is to move with enough stones left to finish a threat has won.
  const finishable = (threats: Stretch[]) => threats.some((threat) => threat.empties.length <= left);
  if (toMove === me && finishable(mine)) return SIX_WEIGHTS.won;
  if (toMove === foe && finishable(theirs)) return -SIX_WEIGHTS.won;

  // Otherwise the threats are counted in the blocks the other side would need.
  const myBlocks = blocksNeeded(mine);
  const theirBlocks = blocksNeeded(theirs);
  let threat = (myBlocks - theirBlocks) * SIX_WEIGHTS.block;
  /*
   * More threats than the side to move has stones left to block them with —
   * two at the start of a turn, one after its first stone — and the attack is
   * won, since nothing above found the side to move a six of its own.
   */
  if (toMove === foe && myBlocks > left) threat += SIX_WEIGHTS.overwhelm;
  if (toMove === me && theirBlocks > left) threat -= SIX_WEIGHTS.overwhelm;
  return shape + threat;
}

/** Points near the stones already down: where every move worth making is. */
function nearby(state: GameState, radius: number): Point[] {
  const { size } = state.settings;
  const seen = new Set<number>();
  let stones = 0;
  for (let index = 0; index < state.board.length; index += 1) {
    if (!isStone(state.board[index])) continue;
    stones += 1;
    const at = pointOf(size, index);
    for (let row = Math.max(0, at.row - radius); row <= Math.min(size - 1, at.row + radius); row += 1) {
      for (let col = Math.max(0, at.col - radius); col <= Math.min(size - 1, at.col + radius); col += 1) {
        const near = row * size + col;
        if (state.board[near] === null) seen.add(near);
      }
    }
  }
  if (stones === 0) {
    const middle = Math.floor(size / 2);
    return [{ row: middle, col: middle }];
  }
  return [...seen].map((index) => pointOf(size, index));
}

/**
 * The points worth a stone, the urgent ones first: a stone that finishes six,
 * then the points of the other side's threats, then by how much each point
 * adds to the mover's open stretches and takes from the other side's.
 */
export function sixCandidates(state: GameState, limit: number): Point[] {
  const { size, winLength } = state.settings;
  const me = state.toPlay;
  const heat = new Map<number, number>();
  const add = (index: number, worth: number) => heat.set(index, (heat.get(index) ?? 0) + worth);
  for (const stretch of stretches(state.board, size, winLength)) {
    const own = me === STONES.black ? stretch.black : stretch.white;
    const other = me === STONES.black ? stretch.white : stretch.black;
    if (own > 0 && other === 0) for (const index of stretch.empties) add(index, SIX_WEIGHTS.stretch[own + 1] ?? SIX_WEIGHTS.won);
    else if (other > 0 && own === 0) {
      for (const index of stretch.empties) add(index, (SIX_WEIGHTS.stretch[other + 1] ?? SIX_WEIGHTS.won) * SIX_WEIGHTS.defence);
    }
  }
  return nearby(state, SIX.radius)
    .filter((point) => isLegalMove(state, point))
    .map((point) => ({ point, worth: heat.get(point.row * size + point.col) ?? 0 }))
    .sort((a, b) => b.worth - a.worth)
    .slice(0, limit)
    .map((entry) => entry.point);
}

export const SIX_EXPERT: Expert = {
  kind: EXPERT_KINDS.six,
  applies: sixApplies,
  read: sixRead,
  candidates: sixCandidates,
  branch: SIX.branch,
  rootBranch: SIX.rootBranch,
  depth(): number {
    return SIX.depth;
  },
};
