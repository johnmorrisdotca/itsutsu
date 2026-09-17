import { forbiddenAt, indexOf, otherStone } from "./engine";
import { GAME_STATUS, MOVE_KINDS } from "./gomoku.constants";
import {
  completionsThrough,
  couldMakeLine,
  findsForcedWins,
  firstFour,
  hasFiveToMake,
  spent,
  stopsNeither,
  type Budget,
} from "./forcedWin";
import { FORCED } from "./opponent.constants";
import { applyTurn } from "./opponentTurns";
import { candidatePoints } from "./threats";
import type { GameState, Point, Stone } from "./gomoku.types";
import type { BotTurn } from "./opponent.types";

/**
 * A win by threats: fours, and the open threes that threaten to become one.
 *
 * `forcedWin.ts` follows fours, because a four has exactly one answer. An open
 * three has a few — the points that stop it becoming an open four — and that
 * is the whole difficulty: to claim a win through a three, EVERY one of those
 * answers has to be shown to lose. Done properly this is threat-space search,
 * victory by continuous threats (VCT), and it is how a strong player sees a
 * win that starts four or five moves before anything is forced.
 *
 * WHICH ANSWERS HAVE TO BE READ, and why the rest need not be. While the
 * attacker has a move that makes an open four, the defender is lost unless
 * their reply does one of two things:
 *
 * - takes a point that move needs: the move itself, or one of the points it
 *   would complete. Nothing else can spoil it — the only rules this runs under
 *   are ones where a five is a run of the colour's own stones, and a stone of
 *   the other colour laid anywhere else is not in that run. And a stone of the
 *   defender's never makes an attacker's move forbidden: it can only break up
 *   the attacker's shapes, never add to them.
 * - makes a four of their own, which the attacker must answer first.
 *
 * Every other reply leaves the open four on the board and the defender with no
 * five to make, so the attacker plays it and wins. So those two sets are read,
 * each through the engine, and a win is claimed only when every reply in them
 * loses too. Anything the finder cannot finish reading — a budget spent, a
 * defender four that leaves the attacker without the open four — is treated as
 * a way out for the defender. Sound, and deliberately incomplete, like the
 * finder of fours it is built on.
 */

/** A move for `me` that makes two ways to make five at once, and what it would complete. */
type OpenFour = { point: Point; completions: Point[] };

/**
 * Every move that would give `me` an open four (or a double four) now, legal
 * for `me` whoever is to move. The board is laid and lifted, never copied per
 * point; the cheap window count turns away almost every point first.
 */
function openFours(state: GameState, me: Stone): OpenFour[] {
  const work = state.board.slice();
  const { size } = state.settings;
  const found: OpenFour[] = [];
  for (const point of candidatePoints(state)) {
    const at = indexOf(size, point);
    if (work[at] !== null) continue;
    if (!couldMakeLine(work, state, me, point, 1)) continue;
    if (forbiddenAt(state.board, state.settings, me, point) !== null) continue;
    work[at] = me;
    const completions = completionsThrough(work, state, me, point);
    work[at] = null;
    if (completions.length >= 2) found.push({ point, completions });
  }
  return found;
}

/** Every move that would give `stone` a four — one or more fives to make next — legal for it. */
function fourMoves(state: GameState, stone: Stone): Point[] {
  const work = state.board.slice();
  const { size } = state.settings;
  const found: Point[] = [];
  for (const point of candidatePoints(state)) {
    const at = indexOf(size, point);
    if (work[at] !== null) continue;
    if (!couldMakeLine(work, state, stone, point, 1)) continue;
    if (forbiddenAt(state.board, state.settings, stone, point) !== null) continue;
    work[at] = stone;
    const makes = completionsThrough(work, state, stone, point).length > 0;
    work[at] = null;
    if (makes) found.push(point);
  }
  return found;
}

/** The replies that could possibly save the defender — see the module note. */
function repliesToRead(state: GameState, me: Stone, threats: readonly OpenFour[]): Point[] {
  const { size } = state.settings;
  const seen = new Set<number>();
  const replies: Point[] = [];
  const add = (point: Point) => {
    const at = indexOf(size, point);
    if (seen.has(at)) return;
    seen.add(at);
    replies.push(point);
  };
  for (const threat of threats) {
    add(threat.point);
    for (const point of threat.completions) add(point);
  }
  for (const point of fourMoves(state, otherStone(me))) add(point);
  return replies;
}

/**
 * Whether the defender, to move in `state`, loses: `me` has an open four to
 * make, the defender has no five, and no reply that could matter saves them.
 *
 * `threes` is how many more threes the attacker may play on the way; `fours`
 * bounds the defender's own fours, each of which the attacker answers.
 */
function defenderLoses(state: GameState, me: Stone, threes: number, fours: number, budget: Budget): boolean {
  const foe = otherStone(me);
  if (hasFiveToMake(state, foe)) return false;
  const threats = openFours(state, me);
  if (threats.length === 0) return false;

  for (const reply of repliesToRead(state, me, threats)) {
    // An unfinished reading is no proof: the defender is given the benefit of it.
    if (spent(budget)) return false;
    budget.nodes -= 1;
    const after = applyTurn(state, { kind: MOVE_KINDS.place, row: reply.row, col: reply.col });
    // A point the defender may not take — a forbidden one — saves nobody.
    if (after === state) continue;
    if (after.status !== GAME_STATUS.playing) return false;

    const theirFives = completionsThrough(after.board.slice(), after, foe, reply);
    if (theirFives.length >= 2) return false;
    if (theirFives.length === 1) {
      // A four of theirs: the attacker must take its point before anything else.
      if (fours === 0) return false;
      budget.nodes -= 1;
      const block = theirFives[0];
      const blocked = applyTurn(after, { kind: MOVE_KINDS.place, row: block.row, col: block.col });
      if (blocked === after) return false;
      if (blocked.status !== GAME_STATUS.playing) {
        if (blocked.winner === me) continue;
        return false;
      }
      if (!defenderLoses(blocked, me, threes, fours - 1, budget)) return false;
      continue;
    }

    // A quiet reply. If an open four is still there, the attacker plays it.
    if (openFours(after, me).length > 0) continue;
    // It took something the open four needed: the attacker needs another way.
    if (winningThreat(after, me, threes, budget) === null) return false;
  }
  // Every other reply leaves an open four standing and no five for the defender.
  return true;
}

/**
 * The first move of a win by threats for `me`, to move, with no five for the
 * defender to make; null when none is found. Fours first — the finder of fours
 * is cheaper and its wins are shorter — then threes, `threes` deep.
 */
function winningThreat(state: GameState, me: Stone, threes: number, budget: Budget): Point | null {
  // Shortest first, as with the fours: a win through one three is found before any reading through two.
  for (let depth = 0; depth <= threes; depth += 1) {
    const point = winningThreatWithin(state, me, depth, budget);
    if (point !== null) return point;
    if (spent(budget)) return null;
  }
  return null;
}

/** A win through at most `threes` threes, or null. */
function winningThreatWithin(state: GameState, me: Stone, threes: number, budget: Budget): Point | null {
  const byFours = firstFour(state, me, FORCED.fours, budget);
  if (byFours !== null) return byFours;
  if (threes === 0) return null;

  const foe = otherStone(me);
  const scratch = state.board.slice();
  for (const point of candidatePoints(state)) {
    if (spent(budget)) return null;
    // A three is two short of five: a window with nothing of theirs and enough of ours.
    if (!couldMakeLine(scratch, state, me, point, 2)) continue;

    budget.nodes -= 1;
    const after = applyTurn(state, { kind: MOVE_KINDS.place, row: point.row, col: point.col });
    if (after === state) continue;
    if (after.status !== GAME_STATUS.playing) {
      if (after.winner === me) return point;
      continue;
    }

    const completions = completionsThrough(after.board.slice(), after, me, point);
    if (completions.length >= 2) {
      if (stopsNeither(after, completions, budget)) return point;
      continue;
    }
    if (completions.length === 1) {
      /*
       * A four on the way to a three: the block is forced, and the search goes
       * on from the position it leaves. Counted as a three, because it is a
       * step the attacker spends, and the depth has to stay bounded.
       */
      budget.nodes -= 1;
      const block = completions[0];
      const blocked = applyTurn(after, { kind: MOVE_KINDS.place, row: block.row, col: block.col });
      if (blocked === after) return point;
      if (blocked.status !== GAME_STATUS.playing) continue;
      if (completionsThrough(blocked.board.slice(), blocked, foe, block).length > 0) continue;
      if (winningThreat(blocked, me, threes - 1, budget) !== null) return point;
      continue;
    }

    // Not a four. A three, if it leaves an open four to make next.
    if (defenderLoses(after, me, threes - 1, FORCED.fours, budget)) return point;
  }
  return null;
}

/** How many empty points a claim needs, so no line it reads ends in a full board. */
const ROOM = 60;

/**
 * The move that starts a win by threats for the side to move, or null.
 *
 * Shares the finder of fours' gate — only games where a four has one answer —
 * and its budget. It never claims a win on a board nearly full: a reading that
 * ends in a draw because the last point was filled is not one it models.
 */
export function threatWinTurn(state: GameState, budget: Budget, threes: number = FORCED.threes): BotTurn | null {
  if (!findsForcedWins(state)) return null;
  const me = state.toPlay;
  if (hasFiveToMake(state, otherStone(me))) return null;
  let empty = 0;
  for (const cell of state.board) if (cell === null) empty += 1;
  if (empty < ROOM) return null;
  const point = winningThreat(state, me, threes, budget);
  return point === null ? null : { kind: MOVE_KINDS.place, row: point.row, col: point.col };
}
