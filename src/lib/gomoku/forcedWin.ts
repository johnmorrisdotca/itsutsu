import { findWinningLine, indexOf, isOnBoard, otherStone, rulesFor } from "./engine";
import { DIRECTIONS, GAME_STATUS, LINE_RULES, MOVE_KINDS, OPENING_STAGES, PLACEMENTS, STONES, VARIANT_SPECS } from "./gomoku.constants";
import { FORCED } from "./opponent.constants";
import { searchable } from "./opponentSearch";
import { applyTurn } from "./opponentTurns";
import { candidatePoints } from "./threats";
import type { Cell, GameState, Point, Stone } from "./gomoku.types";
import type { BotTurn, SearchBudget } from "./opponent.types";

/**
 * A win by fours, found rather than stumbled into.
 *
 * A four forces a reply: there is exactly one point the other side must take,
 * or they lose on the next move. A chain of fours is therefore a line with no
 * choices in it for the defender, and a chain that ends in two ways to make
 * five at once is a win nobody can stop. That is the victory by continuous
 * fours — VCF — and it is how a strong player finishes a game: not by reading
 * every reply, but by noticing there are no replies to read.
 *
 * The ordinary search sees these only as far as its depth reaches, and a chain
 * of five fours is ten plies. This follows ONLY the forcing moves, so it goes
 * many fours deep in the time the search spends on a few plies — Allis found
 * forced wins this way in about a tenth of a CPU second on 1993 hardware.
 *
 * SOUND, AND DELIBERATELY INCOMPLETE. A win it reports is real: every step is
 * played through the engine, so a forbidden point, an overline, an exact-five
 * rule or a line that must be open all speak for themselves. A win it misses is
 * simply not reported, and the ordinary search carries on as it would have.
 * That is the safe direction — the one thing a finder of forced wins must never
 * do is claim one that is not there.
 */

/** What the finder has left to spend, charged per engine call. */
export type Budget = { nodes: number; until: number };

function spent(budget: Budget): boolean {
  return budget.nodes <= 0 || Date.now() >= budget.until;
}

/**
 * Whether this game's fours force a reply the way the finder assumes.
 *
 * Only the plain line games qualify. A capture can answer a four without
 * taking its point; two stones a turn answer a four and make one in the same
 * turn; a colour chosen per stone is not one side's four at all; a line that
 * must be open at an end can be spoiled by a stone beside it rather than on
 * it; a dropped stone can only land where something holds it up, so the point
 * that completes a four may be one NEITHER side can play yet; and a game still
 * in its opening has turns that are not stones. In all of
 * those the defender has an answer the finder does not know about, so it says
 * nothing.
 *
 * What is left has one property the whole finder rests on: the ONLY answer to
 * a four is to take the point that completes it. And a completion is always a
 * legal move for the attacker — `forbiddenAt` lets a five through whatever
 * shape it also makes, as renju does.
 */
export function findsForcedWins(state: GameState): boolean {
  if (state.status !== GAME_STATUS.playing || state.pendingTwist) return false;
  if (state.opening.stage !== OPENING_STAGES.done) return false;
  const spec = VARIANT_SPECS[state.settings.variant];
  if (!searchable(spec) || spec.anyColour || spec.placement !== PLACEMENTS.free) return false;
  for (const stone of [STONES.black, STONES.white]) {
    const rules = rulesFor(state.settings, stone);
    if (rules.captures || rules.stonesPerTurn !== 1 || rules.lineRule === LINE_RULES.exactOpen) return false;
  }
  return true;
}

/**
 * The points where `stone` would complete a winning line on the lines through
 * `around`. Read on the board as it stands, with one stone laid and lifted
 * again rather than a copy made per point: the finder asks this at every step.
 */
function completionsThrough(board: Cell[], state: GameState, stone: Stone, around: Point): Point[] {
  const { size } = state.settings;
  const reach = rulesFor(state.settings, stone).winLength - 1;
  const found: Point[] = [];
  for (const step of DIRECTIONS) {
    for (let k = -reach; k <= reach; k += 1) {
      if (k === 0) continue;
      const point = { row: around.row + step.row * k, col: around.col + step.col * k };
      if (!isOnBoard(size, point)) continue;
      const at = indexOf(size, point);
      if (board[at] !== null) continue;
      board[at] = stone;
      const wins = findWinningLine(board, state.settings, point).length > 0;
      board[at] = null;
      if (wins && !found.some((one) => one.row === point.row && one.col === point.col)) found.push(point);
    }
  }
  return found;
}

/**
 * Whether a stone of `stone` at `point` could be part of a four at all: some
 * window of the winning length through it holds nothing of the other side's
 * and at least all but two of its own. A cheap count that throws away nearly
 * every point before the engine is asked anything.
 */
function couldMakeFour(board: Cell[], state: GameState, stone: Stone, point: Point): boolean {
  const { size } = state.settings;
  const length = rulesFor(state.settings, stone).winLength;
  for (const step of DIRECTIONS) {
    for (let start = -(length - 1); start <= 0; start += 1) {
      let own = 0;
      let open = true;
      for (let k = start; k < start + length; k += 1) {
        const at = { row: point.row + step.row * k, col: point.col + step.col * k };
        if (!isOnBoard(size, at)) {
          open = false;
          break;
        }
        const cell = board[indexOf(size, at)];
        if (k === 0) continue;
        if (cell === stone) own += 1;
        else if (cell !== null) {
          open = false;
          break;
        }
      }
      if (open && own >= length - 2) return true;
    }
  }
  return false;
}

/** Whether `stone`, to move, has a winning line to complete anywhere near the stones. */
function hasFiveToMake(state: GameState, stone: Stone): boolean {
  const board = state.board.slice();
  const { size } = state.settings;
  for (const point of candidatePoints(state)) {
    const at = indexOf(size, point);
    if (board[at] !== null) continue;
    board[at] = stone;
    const wins = findWinningLine(board, state.settings, point).length > 0;
    board[at] = null;
    if (wins) return true;
  }
  return false;
}

/**
 * Whether two or more completions are more than the defender can stop.
 *
 * One stone takes one point, so the other stays open and wins — but that is
 * checked by playing each block rather than by counting, because counting is
 * the step that would quietly be wrong on a board with one point left to fill.
 */
function stopsNeither(after: GameState, completions: readonly Point[], budget: Budget): boolean {
  for (const block of completions) {
    budget.nodes -= 1;
    const blocked = applyTurn(after, { kind: MOVE_KINDS.place, row: block.row, col: block.col });
    if (blocked === after) continue;
    if (blocked.status !== GAME_STATUS.playing) return false;
  }
  return true;
}

/**
 * Whether `me`, to move in `state`, wins by fours. The defender is known to
 * have no five of their own to make — the caller checks that at the top, and
 * each step checks it again after the defender's forced reply.
 */
function winsByFours(state: GameState, me: Stone, fours: number, budget: Budget): boolean {
  return firstFour(state, me, fours, budget) !== null;
}

/** The first move of a win by fours for `me`, or null when none is found. */
function firstFour(state: GameState, me: Stone, fours: number, budget: Budget): Point | null {
  const foe = otherStone(me);
  const scratch = state.board.slice();
  for (const point of candidatePoints(state)) {
    if (spent(budget)) return null;
    if (!couldMakeFour(scratch, state, me, point)) continue;

    budget.nodes -= 1;
    const after = applyTurn(state, { kind: MOVE_KINDS.place, row: point.row, col: point.col });
    // Refused by the rules — a forbidden point for this colour — is not a four.
    if (after === state) continue;
    if (after.status !== GAME_STATUS.playing) {
      if (after.winner === me) return point;
      continue;
    }

    const completions = completionsThrough(after.board.slice(), after, me, point);
    if (completions.length === 0) continue;
    if (completions.length >= 2) {
      if (stopsNeither(after, completions, budget)) return point;
      continue;
    }

    budget.nodes -= 1;
    const block = completions[0];
    const blocked = applyTurn(after, { kind: MOVE_KINDS.place, row: block.row, col: block.col });
    // The defender may not take the only point that saves them — a forbidden point in renju.
    if (blocked === after) return point;
    if (blocked.status !== GAME_STATUS.playing) continue;
    /*
     * The block made a four of the defender's own. The next four would have to
     * be a five to matter, and anything less hands them the game, so this line
     * stops here: sound means not assuming the defender blocks with nothing.
     */
    if (completionsThrough(blocked.board.slice(), blocked, foe, block).length > 0) continue;
    if (fours > 1 && winsByFours(blocked, me, fours - 1, budget)) return point;
  }
  return null;
}

/**
 * What one move may spend finding forced wins, for itself and against itself.
 *
 * One slice of the move's clock, shared by every question the chooser asks —
 * whether it has a win by fours, and whether the move it likes leaves the other
 * side one — so a position full of fours that lead nowhere cannot starve the
 * ordinary search behind it.
 *
 * A budget given in POSITIONS gets no clock at all, and that is on purpose: a
 * node budget is how a move is made reproducible on any machine (see
 * `botSeed.ts`), and a clock under it would make the answer depend on how fast
 * the machine was.
 */
export function forcedBudget(limit: SearchBudget = {}): Budget {
  const until =
    limit.millis === undefined && limit.nodes !== undefined
      ? Infinity
      : Date.now() + Math.min(FORCED.millis, Math.floor((limit.millis ?? FORCED.millis) * FORCED.share));
  return { nodes: FORCED.nodes, until };
}

/** The move that starts a forced win by fours for the side to move, or null. */
export function forcedWinTurn(state: GameState, budget: Budget): BotTurn | null {
  if (!findsForcedWins(state)) return null;
  const me = state.toPlay;
  // A five of theirs to make comes first: no four of ours forces anything while it stands.
  if (hasFiveToMake(state, otherStone(me))) return null;
  const point = firstFour(state, me, FORCED.fours, budget);
  return point === null ? null : { kind: MOVE_KINDS.place, row: point.row, col: point.col };
}
