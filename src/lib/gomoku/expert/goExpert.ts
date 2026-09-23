import { otherStone, pointOf } from "../engine";
import { MOVE_KINDS, STONES } from "../gomoku.constants";
import { goLegal, groupAt, walledIn } from "../rules/go";
import { komiFor } from "../rules/headStart";
import { EXPERT_KINDS, GO, GO_INFLUENCE, GO_WEIGHTS } from "./expert.constants";
import type { Cell, GameState, Point, Stone, VariantSpec } from "../gomoku.types";
import type { BotTurn } from "../opponent.types";
import type { Expert } from "./expert.types";

/**
 * The Go player.
 *
 * The grades read Go by the area count the game is scored with, which is
 * right at the end and nearly blind before it: an empty point only counts for
 * a colour once that colour has walled it in completely, so for most of a game
 * nearly every point is nobody's and the count says the two sides are level.
 * They also cannot see a group about to be taken, because the count does not
 * change until it has been.
 *
 * This reading is the two things a club player looks at first:
 *
 * - **Whose ground a point is**, by influence rather than by walls: every
 *   stone radiates a weight that fades with distance, and an empty point
 *   belongs to the colour whose weight there clearly outweighs the other's. It
 *   is the crude estimate every Go program began with, and it is enough to
 *   make the middle of the board worth something before the walls are
 *   finished.
 * - **Which groups are about to die**: a group down to one liberty, with the
 *   other side to move, is as good as taken, and one with two is in trouble.
 *
 * Searched by the specialists' shared alpha-beta (`expertSearch.ts`), with
 * captures and escapes looked at first. The engine decides what is legal —
 * ko and suicide included — and says who has won.
 */

/** The four neighbours of a point, on the board. */
function around(point: Point, size: number): Point[] {
  const out: Point[] = [];
  if (point.row > 0) out.push({ row: point.row - 1, col: point.col });
  if (point.row < size - 1) out.push({ row: point.row + 1, col: point.col });
  if (point.col > 0) out.push({ row: point.row, col: point.col - 1 });
  if (point.col < size - 1) out.push({ row: point.row, col: point.col + 1 });
  return out;
}

function goApplies(spec: VariantSpec): boolean {
  return spec.go === true;
}

/**
 * The influence on every point: each stone radiates a weight that fades with
 * distance — `GO_INFLUENCE` by steps, out to its length — Black's counted up
 * and White's counted down. A sum rather than "whose stone is nearest",
 * because nearest let one stone dropped into the other side's ground claim
 * half of it: the reading swung two hundred points on a single reply, and a
 * search over a reading that swings like that plays at random.
 */
function influence(board: readonly Cell[], size: number): Float32Array {
  const field = new Float32Array(board.length);
  const reach = GO_INFLUENCE.length - 1;
  for (let index = 0; index < board.length; index += 1) {
    const cell = board[index];
    if (cell !== STONES.black && cell !== STONES.white) continue;
    const sign = cell === STONES.black ? 1 : -1;
    const from = pointOf(size, index);
    for (let row = Math.max(0, from.row - reach); row <= Math.min(size - 1, from.row + reach); row += 1) {
      for (let col = Math.max(0, from.col - reach); col <= Math.min(size - 1, from.col + reach); col += 1) {
        const steps = Math.abs(row - from.row) + Math.abs(col - from.col);
        if (steps > reach) continue;
        field[row * size + col] += sign * GO_INFLUENCE[steps];
      }
    }
  }
  return field;
}

/** What a Go position is worth to `me`: stones, ground by influence, groups in danger, and komi. */
export function goRead(state: GameState, me: Stone): number {
  const { size } = state.settings;
  const board = state.board;
  const field = influence(board, size);

  let blackArea = 0;
  let whiteArea = 0;
  for (let index = 0; index < board.length; index += 1) {
    const cell = board[index];
    if (cell === STONES.black) blackArea += 1;
    else if (cell === STONES.white) whiteArea += 1;
    else if (cell === null) {
      // A point is somebody's only where their influence clearly outweighs the other's.
      if (field[index] >= GO.owned) blackArea += 1;
      else if (field[index] <= -GO.owned) whiteArea += 1;
    }
  }

  // Groups in danger: one liberty with the other side to move is a group already taken.
  let danger = 0;
  const seen = new Set<number>();
  for (let index = 0; index < board.length; index += 1) {
    const cell = board[index];
    if ((cell !== STONES.black && cell !== STONES.white) || seen.has(index)) continue;
    const group = groupAt(board as Cell[], size, pointOf(size, index));
    for (const stone of group.stones) seen.add(stone.row * size + stone.col);
    const liberties = group.liberties.size;
    const theirMove = state.toPlay !== cell;
    const worth =
      liberties === 1 && theirMove
        ? group.stones.length * GO_WEIGHTS.taken
        : liberties === 1
          ? group.stones.length * GO_WEIGHTS.atari
          : liberties === 2
            ? group.stones.length * GO_WEIGHTS.shortOfBreath
            : 0;
    danger += cell === me ? -worth : worth;
  }

  const komi = komiFor(state.settings);
  const blackLead = blackArea - (whiteArea + komi);
  const lead = me === STONES.black ? blackLead : -blackLead;
  return lead * GO_WEIGHTS.point + danger;
}

/** Whether an empty point is one of `stone`'s own eyes: every neighbour its stone, none of them in atari. */
function ownEye(state: GameState, point: Point, stone: Stone): boolean {
  const { size } = state.settings;
  for (const next of around(point, size)) {
    if (state.board[next.row * size + next.col] !== stone) return false;
    if (groupAt(state.board as Cell[], size, next).liberties.size < 2) return false;
  }
  return true;
}

/**
 * The moves worth looking at, the urgent ones first: a capture, then saving a
 * group in atari, then a point next to the stones already down, then anywhere
 * else near the middle. A move that fills one of the player's own eyes is never
 * offered, and passing is offered once the other side has passed or there is
 * little left to play — which is how a Go game ends.
 */
export function goTurns(state: GameState, limit: number): BotTurn[] {
  const { size } = state.settings;
  const me = state.toPlay;
  const foe = otherStone(me);
  const middle = (size - 1) / 2;

  // Ground already walled in is never worth a stone: see `walledIn`.
  const own = walledIn(state.board as Cell[], size, me);
  const ranked: { turn: BotTurn; worth: number }[] = [];
  for (let index = 0; index < state.board.length; index += 1) {
    if (state.board[index] !== null) continue;
    const point = pointOf(size, index);
    if (!goLegal(state.board as Cell[], size, point, me, state.koPoint)) continue;
    if (ownEye(state, point, me) || own.has(index)) continue;

    let worth = 0;
    let touches = false;
    for (const next of around(point, size)) {
      const cell = state.board[next.row * size + next.col];
      if (cell === null) continue;
      touches = true;
      const liberties = groupAt(state.board as Cell[], size, next).liberties.size;
      if (cell === foe && liberties === 1) worth += 1000;
      else if (cell === me && liberties === 1) worth += 600;
      else if (cell === foe && liberties === 2) worth += 80;
      else if (cell === me && liberties === 2) worth += 40;
    }
    if (touches) worth += 20;
    worth -= Math.abs(point.row - middle) + Math.abs(point.col - middle);
    ranked.push({ turn: { kind: MOVE_KINDS.place, row: point.row, col: point.col }, worth });
  }
  ranked.sort((a, b) => b.worth - a.worth);
  const turns = ranked.slice(0, limit).map((entry) => entry.turn);

  const last = state.moves[state.moves.length - 1];
  const theyPassed = last !== undefined && last.kind === MOVE_KINDS.pass;
  if (theyPassed || ranked.length <= GO.passWhenFewer) turns.push({ kind: MOVE_KINDS.pass });
  return turns;
}

export const GO_EXPERT: Expert = {
  kind: EXPERT_KINDS.go,
  applies: goApplies,
  read: goRead,
  candidates: () => [],
  turns: goTurns,
  branch: GO.branch,
  rootBranch: GO.rootBranch,
  depth(): number {
    return GO.depth;
  },
};

