import { GAME_STATUS, MOVE_KINDS } from "../gomoku.constants";
import { DECIDED_SCORE, DRAW_SCORE, SEARCH } from "../opponent.constants";
import { applyTurn } from "../opponentTurns";
import { EXPERT_SEARCH } from "./expert.constants";
import type { GameState, Point, Stone } from "../gomoku.types";
import type { BotTurn, SearchBudget } from "../opponent.types";
import type { Expert } from "./expert.types";

/**
 * The specialists' look-ahead.
 *
 * The same shape as the graded players' search in `opponentSearch.ts` — narrow,
 * ordered, alpha-beta, deepened a couple of plies at a time under a wall clock
 * — and deliberately a separate one, because the two differ in the thing that
 * matters. That search reads a leaf with the reading that covers forty games;
 * this one reads it with the reading for the one game being played, and asks
 * that reading for its move ordering and its depth as well.
 *
 * Everything it explores goes through the engine. A position's outcome is read
 * from `status` and `winner` and never from the expert's opinion of it, so a
 * specialist cannot talk itself into a win the rules do not give it.
 */

/** What the search has left to spend: a deadline, and a node count under it. */
type Budget = { nodes: number; until: number };

function spent(budget: Budget): boolean {
  return budget.nodes <= 0 || Date.now() >= budget.until;
}

/**
 * What a settled position is worth, from `me`'s side.
 *
 * Deeper is worse for a win and better for a loss, so a win in three plies
 * beats the same win in nine and a loss is postponed rather than walked into.
 */
function terminalScore(state: GameState, me: Stone, depthLeft: number): number {
  if (state.status === GAME_STATUS.draw || state.winner === null) return DRAW_SCORE;
  return state.winner === me ? DECIDED_SCORE + depthLeft : -(DECIDED_SCORE + depthLeft);
}

/** The turn a point becomes. Every game a specialist studies lays one stone. */
function turnAt(point: Point): BotTurn {
  return { kind: MOVE_KINDS.place, row: point.row, col: point.col };
}

/**
 * The value of `state` to `me`, searching `depth` further plies.
 *
 * Minimax rather than negamax proper: whose move it is comes from the state,
 * not from the recursion, because in these games a turn does not always change
 * hands — a colour with nowhere to go in a flipping game passes without a move
 * on the record, and the engine has already done that by the time the position
 * arrives here.
 */
function look(
  state: GameState,
  me: Stone,
  expert: Expert,
  depth: number,
  alpha: number,
  beta: number,
  budget: Budget,
  extension: number,
): number {
  if (state.status !== GAME_STATUS.playing) return terminalScore(state, me, depth);
  if (depth === 0) return expert.read(state, me);
  budget.nodes -= 1;
  // Out of budget: answer with what is known rather than with a guess.
  if (spent(budget)) return expert.read(state, me);

  const candidates = expert.candidates(state, expert.branch);
  if (candidates.length === 0) return expert.read(state, me);

  /*
   * A position with one move in it is not a choice, so it is not charged a
   * ply. The expert says so by handing back a single candidate — that is what
   * it does when either side can complete a line — and following the corridor
   * for free is what lets a shallow budget see the end of a forcing sequence
   * rather than the start of one. Capped, or the search follows one corridor
   * with the whole budget.
   */
  const forced = candidates.length === 1 && extension > 0;
  const nextDepth = forced ? depth : depth - 1;
  const nextExtension = forced ? extension - 1 : extension;

  const maximising = state.toPlay === me;
  let best = maximising ? -Infinity : Infinity;
  let low = alpha;
  let high = beta;

  for (const point of candidates) {
    const after = applyTurn(state, turnAt(point));
    if (after === state) continue;
    const value = look(after, me, expert, nextDepth, low, high, budget, nextExtension);
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

  return best === Infinity || best === -Infinity ? expert.read(state, me) : best;
}

/**
 * The move the specialist likes here, or null when it has nothing to say —
 * the game is not one it has studied, or there is no move to make.
 *
 * Deepened two plies at a time from the root ordering, keeping the best answer
 * of each completed pass, so running out of clock costs a ply rather than an
 * answer. Ties are settled by chance, so a specialist does not play the same
 * game twice against the same opponent.
 */
export function expertTurn(
  state: GameState,
  expert: Expert,
  random: () => number,
  limit: SearchBudget = {},
): BotTurn | null {
  if (state.status !== GAME_STATUS.playing || state.pendingTwist) return null;

  const me = state.toPlay;
  const budget: Budget = {
    nodes: limit.nodes ?? EXPERT_SEARCH.nodes,
    /*
     * The same wall clock every grade gets. A specialist is a better player
     * inside a request, not a player given a longer request — a computer can
     * be sat in a great many games at once, and one of them thinking harder
     * than the rest is a slow page rather than a strong opponent.
     */
    until: Date.now() + (limit.millis ?? SEARCH.millis),
  };
  const rootPoints = expert.candidates(state, expert.rootBranch);
  if (rootPoints.length === 0) return null;
  if (rootPoints.length === 1) return turnAt(rootPoints[0]);

  let chosen: Point | null = null;
  const depth = expert.depth(state);

  for (let ply = 2; ply <= depth; ply += 2) {
    /*
     * The best move of the previous, shallower pass goes first. It is usually
     * still the best move, and trying it first is most of what makes deepening
     * cheaper than the deep search it ends on rather than more expensive.
     */
    const order =
      chosen === null
        ? rootPoints
        : [
            chosen,
            ...rootPoints.filter((p) => p.row !== chosen!.row || p.col !== chosen!.col),
          ];

    let best = -Infinity;
    let equal: Point[] = [];
    let finished = true;
    for (const point of order) {
      const after = applyTurn(state, turnAt(point));
      if (after === state) continue;
      const value = look(
        after,
        me,
        expert,
        ply - 1,
        -Infinity,
        Infinity,
        budget,
        EXPERT_SEARCH.forcedExtension,
      );
      if (value > best) {
        best = value;
        equal = [point];
      } else if (value === best) {
        equal.push(point);
      }
      if (spent(budget)) {
        finished = false;
        break;
      }
    }
    /*
     * A pass that ran out of budget part way through is thrown away, and that
     * is worth stating plainly because the opposite is the usual advice: the
     * previous best is tried first, so surely anything that beat it here beat
     * it fairly?
     *
     * It did not. A node that runs out of budget answers with the static
     * reading of the position it is standing in, and a static reading is an
     * optimistic one — it has not been minimised through the reply that
     * refutes it. So the moves examined as the budget runs out come back
     * flattered, and the last one examined tends to win. Measured over ten
     * games against 名人, keeping the truncated pass turned seven wins and
     * three losses into none and ten. The shallower pass that finished is a
     * comparison; the deeper one that did not is a list of numbers.
     */
    if (equal.length === 0) break;
    if (finished || chosen === null) {
      chosen = equal[Math.min(equal.length - 1, Math.floor(random() * equal.length))];
    }
    // A forced win is a forced win; deepening past it only finds it further off.
    if (finished && best >= DECIDED_SCORE) break;
    if (spent(budget)) break;
  }

  return chosen === null ? null : turnAt(chosen);
}
