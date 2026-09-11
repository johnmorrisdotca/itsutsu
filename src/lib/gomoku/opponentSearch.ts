import { racesForCamp } from "./rules/farCamp";
import { isLegalMove } from "./engine";
import { GAME_STATUS, MOVE_KINDS, VARIANT_SPECS } from "./gomoku.constants";
import { DECIDED_SCORE, DRAW_SCORE, SEARCH } from "./opponent.constants";
import { boardScore, pointScore, positionScore, readsThreats, threatScore } from "./opponentEval";
import { applyTurn } from "./opponentTurns";
import { candidatePoints } from "./threats";
import type { GameState, Point, Stone, VariantSpec } from "./gomoku.types";
import type { BotTurn, SearchBudget } from "./opponent.types";

/**
 * Looking ahead.
 *
 * The two-ply reading in `opponent.ts` answers one question — does this hand
 * them the game — and that is enough to stop a player blundering, but it is
 * not enough to make one strong. A strong player at five in a row is one who
 * sees the sequence: the four that forces a reply, then the three that was
 * waiting behind it. Seeing that means searching, and searching means alpha
 * and beta, because a full width of two hundred empty points to six plies is
 * not a search, it is a hang.
 *
 * So: a narrow, ordered, iteratively deepened negamax. Narrow because only
 * points near the stones can matter in a line game; ordered because good
 * ordering is where nearly all of the pruning comes from; iteratively deepened
 * because a request has to come back, and the honest way to spend a fixed
 * budget is to keep the best answer found so far.
 *
 * Everything it explores is still played through the engine. The search reads
 * the outcome of a position from `status` and `winner`, never from its own
 * idea of who is winning, so it is right about the losing conditions in games
 * it knows nothing about.
 */

/**
 * Whether looking ahead means anything in this game.
 *
 * The incremental reading below values a position by the shape of the stones
 * as they land, one point at a time. That is a true account of a line game and
 * nonsense anywhere else: in a flipping game the stones already down change
 * colour, in a race they move, in a piece game a turn is four cells from a
 * queue nobody has drawn yet, and in a twist game the board rotates under the
 * reading. Those keep the two-ply guard, which is right everywhere because it
 * asks the engine rather than the shape.
 */
export function searchable(spec: VariantSpec): boolean {
  return (
    readsThreats(spec) &&
    !spec.flips &&
    !racesForCamp(spec) &&
    !spec.connects &&
    spec.queue === null &&
    spec.quadrantSize === null &&
    !spec.lineClear &&
    spec.wormholes === 0
  );
}

/**
 * What the search has left to spend: a wall-clock deadline, and a node count
 * under it as a backstop. Mutable, and passed down the tree.
 */
type Budget = { nodes: number; until: number };

/** Whether the search must stop now. */
function spent(budget: Budget): boolean {
  return budget.nodes <= 0 || Date.now() >= budget.until;
}

/**
 * What a settled position is worth, from `me`'s side.
 *
 * Deeper is worse for a win and better for a loss, so a forced win five plies
 * away is preferred to the same win nine plies away, and a loss is postponed
 * rather than walked into. Without that the search is indifferent between
 * winning now and winning later, which looks like a computer toying with you.
 */
function terminalScore(state: GameState, me: Stone, depthLeft: number): number {
  if (state.status === GAME_STATUS.draw || state.winner === null) return DRAW_SCORE;
  return state.winner === me
    ? DECIDED_SCORE + depthLeft
    : -(DECIDED_SCORE + depthLeft);
}

/**
 * The points worth searching here, best first, at most `branch` of them.
 *
 * Ordered by shape, which is cheap. The threat reading, which is the better
 * ordering and about fifty times the price, is spent only where `reading` says
 * so — at the root, over a shortlist the shape ordering has already narrowed.
 */
function orderedCandidates(
  state: GameState,
  spec: VariantSpec,
  branch: number,
  reading: boolean,
  first: Point | null,
): Point[] {
  const mover = state.toPlay;
  const points = candidatePoints(state).filter((point) => isLegalMove(state, point));
  if (points.length === 0) return [];

  const scored = points.map((point) => ({
    point,
    score: pointScore(state, point, mover, spec),
  }));
  scored.sort((a, b) => b.score - a.score);

  if (reading) {
    // Only the shortlist, and only once: see SEARCH.rootReading.
    const shortlist = scored.slice(0, SEARCH.rootReading);
    for (const entry of shortlist) {
      entry.score += threatScore(state, entry.point, mover);
    }
    shortlist.sort((a, b) => b.score - a.score);
    scored.splice(0, shortlist.length, ...shortlist);
  }

  const best = scored.slice(0, branch).map((entry) => entry.point);
  if (first === null) return best;
  /*
   * The best move from the previous, shallower pass goes first. It is usually
   * still the best move, and trying it first is most of what makes iterative
   * deepening cheaper than the deep search it ends on rather than more
   * expensive than it.
   */
  const rest = best.filter((point) => point.row !== first.row || point.col !== first.col);
  return [first, ...rest].slice(0, branch);
}

/** What a live position at the bottom of the search is worth to `me`. */
function leafScore(state: GameState, me: Stone, spec: VariantSpec): number {
  return boardScore(state, me, spec) + positionScore(state, me);
}

/**
 * The value of `state` to `me`, searching `depth` further plies.
 *
 * The leaves are read as whole positions — see `boardScore` — rather than by
 * adding up what each stone was worth as it landed. That distinction is the
 * whole of whether a search helps at all: a running total keeps crediting
 * shape the other side has since shut down, and a minimax over a metric like
 * that finds the line that best exploits the error. It was measured doing
 * exactly that, losing five to nil to the shallower grade below it.
 */
function negamax(
  state: GameState,
  me: Stone,
  spec: VariantSpec,
  depth: number,
  alpha: number,
  beta: number,
  budget: Budget,
): number {
  if (state.status !== GAME_STATUS.playing) return terminalScore(state, me, depth);
  if (depth === 0) return leafScore(state, me, spec);
  budget.nodes -= 1;
  // Out of budget: answer with what is known rather than with a guess.
  if (spent(budget)) return leafScore(state, me, spec);

  const maximising = state.toPlay === me;
  const candidates = orderedCandidates(state, spec, SEARCH.branch, false, null);
  if (candidates.length === 0) return leafScore(state, me, spec);

  let best = maximising ? -Infinity : Infinity;
  let low = alpha;
  let high = beta;

  for (const point of candidates) {
    const turn: BotTurn = { kind: MOVE_KINDS.place, row: point.row, col: point.col };
    const after = applyTurn(state, turn);
    if (after === state) continue;
    const value = negamax(after, me, spec, depth - 1, low, high, budget);

    if (maximising) {
      if (value > best) best = value;
      if (best > low) low = best;
    } else {
      if (value < best) best = value;
      if (best < high) high = best;
    }
    if (low >= high) break;
    if (spent(budget)) break;
  }

  return best === Infinity || best === -Infinity ? leafScore(state, me, spec) : best;
}

/**
 * The turn the search likes, or null where there is nothing to search — the
 * game is not one this reading applies to, or there are no candidates.
 *
 * Deepened two plies at a time, keeping the best answer from each pass, so
 * running out of budget costs depth rather than correctness. Ties are handed
 * back in order and settled by the caller, which is where the dice live.
 */
export function searchTurn(
  state: GameState,
  depth: number,
  random: () => number,
  limit: SearchBudget = {},
): BotTurn | null {
  const spec = VARIANT_SPECS[state.settings.variant];
  if (!searchable(spec)) return null;
  if (state.status !== GAME_STATUS.playing || state.pendingTwist) return null;

  const me = state.toPlay;
  const budget: Budget = {
    nodes: limit.nodes ?? SEARCH.nodes,
    until: Date.now() + (limit.millis ?? SEARCH.millis),
  };
  let chosen: Point | null = null;

  /*
   * The root's ordering is read once, threats and all, and reused by every
   * pass. Only the best move found so far moves to the front between passes,
   * which is the whole of what deepening needs from it — and it saves paying
   * the threat reading again for each extra ply.
   */
  const rootPoints = orderedCandidates(state, spec, SEARCH.rootBranch, true, null);
  if (rootPoints.length === 0) return null;

  for (let ply = 2; ply <= depth; ply += 2) {
    const candidates =
      chosen === null
        ? rootPoints
        : [chosen, ...rootPoints.filter((p) => p.row !== chosen!.row || p.col !== chosen!.col)];

    let best = -Infinity;
    let equal: Point[] = [];
    for (const point of candidates) {
      const turn: BotTurn = { kind: MOVE_KINDS.place, row: point.row, col: point.col };
      const after = applyTurn(state, turn);
      if (after === state) continue;
      const value = negamax(after, me, spec, ply - 1, -Infinity, Infinity, budget);
      if (value > best) {
        best = value;
        equal = [point];
      } else if (value === best) {
        equal.push(point);
      }
      if (spent(budget)) break;
    }
    if (equal.length === 0) break;
    // Ties settled by chance, so the computer does not play the same game twice.
    chosen = equal[Math.min(equal.length - 1, Math.floor(random() * equal.length))];
    /*
     * A forced win is a forced win; deepening past it only finds the same win
     * further away. Stopping here is what keeps a won position quick.
     */
    if (best >= DECIDED_SCORE) break;
    if (spent(budget)) break;
  }

  return chosen === null
    ? null
    : { kind: MOVE_KINDS.place, row: chosen.row, col: chosen.col };
}
