import { racesForCamp } from "./rules/farCamp";
import { GAME_STATUS, MOVE_KINDS, VARIANT_SPECS } from "./gomoku.constants";
import { DECIDED_SCORE, DRAW_SCORE, SEARCH } from "./opponent.constants";
import { boardScore, positionScore, readsThreats } from "./opponentEval";
import { applyTurn } from "./opponentTurns";
import { forcedReplies } from "./forcedReplies";
import { nodeCandidates, rootCandidates } from "./searchCandidates";
import { boundOf, floorUnder, indexOfMove, pointKey, positionKey, recalled, type SearchMemory } from "./searchMemory";
import type { GameState, Point, Stone, VariantSpec } from "./gomoku.types";
import type { BotTurn, SearchBudget, SearchShelves } from "./opponent.types";

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
 * budget is to keep the best answer found so far. And remembered: the same
 * board is reached by many orders of the same stones, and `searchMemory.ts`
 * keeps what each was found to be worth, so it is read once. With the root
 * pruned under its best move too, that measured the same move on every
 * position tried at 5.5 times the speed at eight plies — which, on a clock,
 * is depth.
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
  shelves: SearchShelves,
  memory: SearchMemory,
  defence?: number,
): number {
  if (state.status !== GAME_STATUS.playing) return terminalScore(state, me, depth);
  if (depth === 0) return leafScore(state, me, spec);
  budget.nodes -= 1;
  // Out of budget: answer with what is known rather than with a guess.
  if (spent(budget)) return leafScore(state, me, spec);

  // Read before, to this depth, and the reading settles it: no need to read it again.
  const key = positionKey(state);
  const entry = memory.get(key);
  const known = recalled(entry, depth, alpha, beta);
  if (known !== undefined) return known;

  const maximising = state.toPlay === me;
  /*
   * The list below is BORROWED from this depth's shelf, not owned — see
   * `SearchShelf`. It stays valid for exactly as long as this node walks it,
   * because everything the walk sets in motion recurses to `depth - 1` and
   * writes to a different shelf. Nothing here may keep it past the return, and
   * nothing does: the loop reads a point, plays it and is finished with it.
   *
   * Walked by index rather than by `for…of` for the same reason the list is
   * borrowed: an iterator is one more object made and dropped at every node,
   * and the node is the thing being counted here.
   */
  // In a forcing position only the replies that answer the threat are read — see `forcedReplies`.
  const forced = forcedReplies(state);
  const candidates = forced ?? nodeCandidates(state, spec, SEARCH.branch, defence, shelves, depth);
  if (candidates.length === 0) return leafScore(state, me, spec);

  let best = maximising ? -Infinity : Infinity;
  let bestMove = -1;
  let low = alpha;
  let high = beta;

  /*
   * The move that was best here last time, first. The list is a borrowed shelf
   * and is never reordered; the walk visits that one move first and then the
   * rest in their own order, skipping it.
   */
  const first = indexOfMove(candidates, entry?.move);
  for (let step = 0; step < candidates.length; step += 1) {
    const at = first < 0 ? step : step === 0 ? first : step <= first ? step - 1 : step;
    const point = candidates[at];
    const turn: BotTurn = { kind: MOVE_KINDS.place, row: point.row, col: point.col };
    const after = applyTurn(state, turn);
    if (after === state) continue;
    const value = negamax(after, me, spec, depth - 1, low, high, budget, shelves, memory, defence);

    if (maximising) {
      if (value > best) {
        best = value;
        bestMove = pointKey(point);
      }
      if (best > low) low = best;
    } else {
      if (value < best) {
        best = value;
        bestMove = pointKey(point);
      }
      if (best < high) high = best;
    }
    if (low >= high) break;
    if (spent(budget)) break;
  }

  if (best === Infinity || best === -Infinity) return leafScore(state, me, spec);
  /*
   * Kept only from a reading the clock did not cut short. Once the budget is
   * spent every value under it is a leaf standing in for a search, and writing
   * that down as a six-ply answer would have the next visit believe it.
   */
  if (!spent(budget)) memory.set(key, { depth, value: best, bound: boundOf(best, alpha, beta), move: bestMove });
  return best;
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
  /**
   * The player's STYLE — see `TierSpec.defence`. It reaches the ORDERING and
   * nothing else, which is a deliberate line rather than an unfinished job.
   *
   * Ordering is where a preference belongs. The search runs on a budget, so
   * what it looks at first is what it has time to look at at all: an attacker
   * spends its plies on its own threats, a defender on yours, and when two
   * moves come back genuinely equal the order decides. That is a style.
   *
   * The LEAF is deliberately left alone. `leafScore` reads a whole position,
   * and bending it would change what the search BELIEVES a position is worth —
   * a "defensive" 国手 would then overvalue blocking and play weaker chess than
   * 国手, which is not a personality, it is a worse player wearing one. Style
   * breaks ties and orders work; it never overrules a search. The same line is
   * kept in `chooseTurn`, where the win in hand, the guard and the solved-game
   * table all run before style is consulted.
   */
  defence?: number,
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
   * The memory every node below the root will order its candidates in, made
   * once for this move and lent out a shelf per remaining ply. It belongs to
   * this call rather than to the module, so two searches could run side by
   * side without either knowing about the other — which they never do here,
   * and a search that quietly depended on that would be a nasty thing to
   * discover later.
   */
  const shelves: SearchShelves = [];
  /** Every position this move's search has read, and what it found. See `searchMemory.ts`. */
  const memory: SearchMemory = new Map();

  /*
   * The root's ordering is read once, threats and all, and reused by every
   * pass. Only the best move found so far moves to the front between passes,
   * which is the whole of what deepening needs from it — and it saves paying
   * the threat reading again for each extra ply.
   *
   * Its own array, never a shelf: this list outlives every node under it, and
   * a borrowed one would be rewritten by the first node the first pass reached.
   */
  const rootPoints = forcedReplies(state) ?? rootCandidates(state, spec, SEARCH.rootBranch, defence);
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
      // The root prunes too, just under the best so far — see `floorUnder`.
      const value = negamax(after, me, spec, ply - 1, floorUnder(best), Infinity, budget, shelves, memory, defence);
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
