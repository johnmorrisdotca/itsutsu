import { racesForCamp } from "./rules/farCamp";
import { GAME_STATUS, VARIANT_SPECS } from "./gomoku.constants";
import { DECIDED_SCORE, DRAW_SCORE, LOOK, SEARCH } from "./opponent.constants";
import { positionScore, readsPosition } from "./opponentEval";
import { searchable } from "./opponentSearch";
import { applyTurn, legalTurns } from "./opponentTurns";
import type { GameState, Stone, VariantSpec } from "./gomoku.types";
import type { BotTurn, SearchBudget } from "./opponent.types";

/**
 * Looking ahead in the games that are not about lines.
 *
 * `opponentSearch.ts` is the line games' search and reads a leaf by the shape
 * of the stones; it refuses everything else, and rightly — in a flipping game
 * the stones already down change colour, in a race they move, and a window of
 * five means nothing in either. It refuses twenty-three of the site's
 * thirty-nine games.
 *
 * That refusal was the whole of the ordering bug. `searchDepth` is the only
 * knob separating 名人 from 国手 — every other one is already at its limit for
 * both — so in those twenty-three games the two were not two players. They were
 * one program offered twice under different names and a different flag, with
 * the second one described to the reader as reading further than the first.
 * Measured over thirty games of Reversi they came out 13-17, which is what two
 * identical players come out at.
 *
 * Worse than flat: INVERTED. 段 beat both of them 16-12, and 段 is 名人 with
 * three handicaps bolted on — it blunders three times in a hundred, it misses a
 * threat once in twenty, and a quarter of the spread of its judgement is noise.
 * A player whose handicaps make it stronger is a player whose judgement is
 * pointing the wrong way, and the reason is that at one ply there is nothing to
 * point it anywhere: a flipping game's move is good or bad because of what it
 * lets the other side do next, and nothing that cannot see next was reading the
 * game at all.
 *
 * So this is the same shape as the other two searches — narrow, ordered,
 * alpha-beta, deepened two plies at a time under the same wall clock — and it
 * differs in the two things that make it general:
 *
 * - It searches WHOLE TURNS through `legalTurns` and `applyTurn`, not points.
 *   A slide, a pass and a laid piece are turns in these games, and a search
 *   that only knew how to place a stone could not play any of them.
 * - It reads a leaf with `positionScore`, which is the family-aware reading:
 *   the corners and mobility where stones turn, the area in Go, the distance
 *   home in a race. It never adds up what each move was worth on the way
 *   down — that is the mistake `opponentSearch.ts` records having made, where
 *   a running total kept crediting shape the other side had since shut down.
 *
 * And it declines where the reading declines. A search over a leaf value that
 * is the same number everywhere is not a weak search, it is nodes spent to
 * return the first move in the list — so `readsPosition` has to say yes before
 * any of this runs.
 */

/** What the search has left to spend: a deadline, and a count of work under it. */
type Budget = { nodes: number; until: number };

function spent(budget: Budget): boolean {
  return budget.nodes <= 0 || Date.now() >= budget.until;
}

/**
 * Whether the general look-ahead has any business in this game.
 *
 * Four questions, each of them about the game rather than its name:
 *
 * - Does the line search already cover it? Then that one is better: it reads
 *   whole-board shape and orders its moves by the threat ladder.
 * - Does the shared reading say anything here at all? A game it cannot read
 *   scores every position identically, and a minimax over a constant returns
 *   whichever move was enumerated first. That is the dangerous kind of
 *   nothing — it looks exactly like a judgement.
 * - Is the next piece known? In the queue games it is drawn after the turn, so
 *   a search past this move is a search of a board that will not happen.
 * - Does the board stay still? A twist game turns a quadrant under the reading
 *   and a turn there is two decisions, which multiplies the candidates by the
 *   quadrants and then asks the reading a question it has no answer for.
 */
export function lookable(spec: VariantSpec): boolean {
  if (searchable(spec)) return false;
  if (!readsPosition(spec)) return false;
  if (spec.queue !== null) return false;
  if (spec.quadrantSize !== null) return false;
  return true;
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

/** A turn already played, and the position it led to. */
type Option = { turn: BotTurn; after: GameState };

/**
 * The turns worth looking at here, best first, at most `branch` of them.
 *
 * Ordered by what the resulting position is worth to whoever is moving, which
 * costs one engine call and one reading per candidate. That is dearer per node
 * than the line search's ordering, and it is the only ordering available: in a
 * race or a flipping game there is no cheap shape to sort by, because the thing
 * a move does is to the whole board rather than to the square it lands on.
 *
 * The work is charged to the budget here rather than once per node, because
 * this is where the work is. A node that weighs twenty slides costs twenty
 * times one that weighs one, and a budget that counted both as a single node
 * would bound nothing.
 */
function ordered(state: GameState, branch: number, budget: Budget): Option[] {
  const mover = state.toPlay;
  const options: { option: Option; score: number }[] = [];
  for (const turn of legalTurns(state, LOOK.width)) {
    const after = applyTurn(state, turn);
    // A turn the engine refuses is not a turn.
    if (after === state) continue;
    budget.nodes -= 1;
    options.push({ option: { turn, after }, score: positionScore(after, mover) });
    if (spent(budget)) break;
  }
  options.sort((a, b) => b.score - a.score);
  return options.slice(0, branch).map((entry) => entry.option);
}

/**
 * The value of `state` to `me`, looking `depth` further plies.
 *
 * Minimax rather than negamax proper, because in these games a turn does not
 * always change hands: a colour with nowhere to go in a flipping game passes
 * without a move on the record, and a game where one turn lays two stones has
 * the same side to play twice. Whose move it is comes from the state, which is
 * the only place that knows.
 */
function look(
  state: GameState,
  me: Stone,
  depth: number,
  alpha: number,
  beta: number,
  budget: Budget,
): number {
  if (state.status !== GAME_STATUS.playing) return terminalScore(state, me, depth);
  if (depth === 0 || spent(budget)) return positionScore(state, me);

  const options = ordered(state, LOOK.branch, budget);
  if (options.length === 0) return positionScore(state, me);

  const maximising = state.toPlay === me;
  let best = maximising ? -Infinity : Infinity;
  let low = alpha;
  let high = beta;

  for (const option of options) {
    const value = look(option.after, me, depth - 1, low, high, budget);
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

  return best === Infinity || best === -Infinity ? positionScore(state, me) : best;
}

/**
 * The turn the general look-ahead likes, or null where it has nothing to say:
 * the game is not one this reading covers, or there is no turn to take.
 *
 * Deepened two plies at a time, keeping the best answer of each COMPLETED pass.
 * A pass that ran out of budget part way through is thrown away, and that is
 * the opposite of the usual advice, so it is worth the sentence: a node that
 * runs out of budget answers with the static reading of where it is standing,
 * and a static reading is a flattered one, because nothing has minimised it
 * through the reply that refutes it. The candidates examined as the budget
 * drains therefore come back looking better than they are. `expertSearch.ts`
 * measured that turning seven wins into none.
 */
export function lookAheadTurn(
  state: GameState,
  depth: number,
  random: () => number,
  limit: SearchBudget = {},
): BotTurn | null {
  const spec: VariantSpec | undefined = VARIANT_SPECS[state.settings.variant];
  if (spec === undefined || !lookable(spec)) return null;
  if (state.status !== GAME_STATUS.playing || state.pendingTwist) return null;

  const me = state.toPlay;
  const budget: Budget = {
    nodes: limit.nodes ?? LOOK.nodes,
    // The same wall clock every other grade and every specialist gets.
    until: Date.now() + (limit.millis ?? SEARCH.millis),
  };

  const root = ordered(state, LOOK.rootBranch, budget);
  if (root.length === 0) return null;
  if (root.length === 1) return root[0].turn;

  let chosen: BotTurn | null = null;
  for (let ply = 2; ply <= depth; ply += 2) {
    let best = -Infinity;
    let equal: BotTurn[] = [];
    let finished = true;
    for (const option of root) {
      const value = look(option.after, me, ply - 1, -Infinity, Infinity, budget);
      if (value > best) {
        best = value;
        equal = [option.turn];
      } else if (value === best) {
        equal.push(option.turn);
      }
      if (spent(budget)) {
        finished = false;
        break;
      }
    }
    if (equal.length === 0) break;
    // Ties settled by chance, so the computer does not play the same game twice.
    if (finished || chosen === null) {
      chosen = equal[Math.min(equal.length - 1, Math.floor(random() * equal.length))];
    }
    // A forced win is a forced win; deepening past it only finds it further off.
    if (finished && best >= DECIDED_SCORE) break;
    if (spent(budget)) break;
  }

  return chosen;
}

/**
 * How deep to look in this game, given what the grade is willing to spend.
 *
 * A race is the one family where the plies are not comparable to anybody
 * else's. A turn there moves one marble one step of a journey twenty steps
 * long, so two plies change the position by almost nothing and the branching
 * is every piece by every step it could take — the widest board on the site
 * offers a hundred and forty slides. Deepening into that spends the whole
 * budget to learn that the position is much as it was, so the grade's plies
 * are halved and the budget goes on breadth instead.
 */
export function lookDepth(spec: VariantSpec, searchDepth: number): number {
  return racesForCamp(spec) ? Math.max(2, Math.floor(searchDepth / 2)) : searchDepth;
}
