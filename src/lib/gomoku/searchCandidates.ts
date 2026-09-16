import { isLegalMove } from "./engine";
import { SEARCH } from "./opponent.constants";
import { pointScore, threatScore } from "./opponentEval";
import { candidatePoints } from "./threats";
import type { GameState, Point, VariantSpec } from "./gomoku.types";
import type { SearchShelf, SearchShelves } from "./opponent.types";

/**
 * WHICH POINTS THE SEARCH TRIES, AND IN WHAT ORDER.
 *
 * Ordering is where nearly all of alpha-beta's pruning comes from, so this runs
 * at every node the search visits — tens of thousands of them for one move.
 * It is therefore the one piece of the search whose COST matters as much as its
 * answer, and it is split out here for that reason: the root asks a different
 * and much more expensive question than every node beneath it, and only one of
 * the two is hot.
 *
 * `rootCandidates` runs once a move. It may spend the threat reading, which
 * costs about a millisecond a point, over a shortlist. It allocates freely,
 * because once a move is not a cost.
 *
 * `nodeCandidates` runs everywhere else, and allocates nothing of its own. What
 * it replaced built an array of candidates, a filtered copy, a wrapper object
 * carrying a score for each of them, a sorted copy and a trimmed copy, sorted
 * the whole lot and then threw all but ten points away.
 *
 * Two things make that unnecessary, and both are properties of the search
 * rather than tricks:
 *
 * - **Only the best `branch` are ever used**, so there is no reason to sort the
 *   other fifty. A running shortlist of ten, filled by insertion, answers the
 *   same question with nothing to collect afterwards.
 * - **The search is one thread going depth first**, so the list a node is
 *   walking belongs to that node alone until it returns, and the memory can be
 *   lent out per remaining ply instead of made fresh. See `SearchShelf` for the
 *   invariant that rests on and for why the root is deliberately left out of it.
 *
 * HOW MUCH OF THE NODE THAT ACTUALLY WAS, since the answer was not what it was
 * expected to be and the difference decided where the rest of the work went.
 * Measured over 4,000 repetitions on a fifteen by fifteen freestyle middlegame
 * with 61 candidates, ordering one node:
 *
 *                            before    after
 *   the whole ordering        87.3 µs   73.4 µs
 *     candidatePoints         21.4      11.4      (see threats.ts)
 *     isLegalMove x 61        19.6      20.4
 *     pointScore x 61         41.9      41.2
 *     the rest                 4.4       0.4
 *
 * That last line is the wrapper objects, the sort and the two trimmed copies —
 * the thing this was written to remove — and it is about 5 µs of an 87 µs
 * ordering, not the half of it the work was taken up on. Replacing it alone
 * moved a move at a fixed node budget by 3.3%. V8 collects a nursery of
 * short-lived objects very cheaply and sixty entries is a small sort.
 *
 * The shortlist is kept anyway, because it is the right shape and now costs
 * nothing: it cannot get slower as a board fills the way a sort does. But the
 * cost was never in the SORTING. It was in BUILDING the list, and most of that
 * was `candidatePoints` asking the board a question it should have asked the
 * stones — which is where the rest of this change went, and where the speed
 * came from.
 *
 * NONE OF THIS MAY CHANGE WHICH MOVE COMES BACK. `Array.prototype.sort` is
 * stable, so the order the old code produced — including the way equal scores
 * fell, earliest candidate first — is behaviour and not an accident, and the
 * insertion below reproduces it exactly. `searchCandidates.test.ts` checks that
 * against the old expression restated by hand rather than against this code.
 */

/**
 * The shelf this depth uses, made the first time the search reaches that deep.
 *
 * Lazily, because a move that runs out of clock at four plies should not have
 * paid for eight, and a search that never gets below its root pays for none.
 */
function shelfAt(shelves: SearchShelves, depth: number): SearchShelf {
  const found = shelves[depth];
  if (found !== undefined) return found;
  const made: SearchShelf = { points: [], scores: [] };
  shelves[depth] = made;
  return made;
}

/**
 * The points worth searching at an interior node, best first, at most `branch`
 * of them — written into this depth's shelf and handed back as that same array.
 *
 * THE RETURNED ARRAY IS BORROWED, not given. It is valid until the next call at
 * this same depth, which is exactly as long as the caller needs it: a node
 * walks its list, recurses to `depth - 1` inside the walk, and is finished with
 * the list before it returns. A caller that wanted to keep one past its own
 * return would have to copy it — and the one caller that does want that, the
 * root, uses `rootCandidates`, which borrows nothing.
 *
 * `depth` is the plies REMAINING, which is what makes the shelf safe to share:
 * it strictly decreases on the way down, so no two live calls hold the same
 * number. Passing the node's depth is therefore not bookkeeping the caller
 * could get wrong in a quiet way — a wrong number here would be a wrong number
 * in the search itself.
 */
export function nodeCandidates(
  state: GameState,
  spec: VariantSpec,
  branch: number,
  defence: number | undefined,
  shelves: SearchShelves,
  depth: number,
): readonly Point[] {
  const shelf = shelfAt(shelves, depth);
  const { points, scores } = shelf;
  // A node allowed to look at nothing looks at nothing. It cannot happen from
  // the search's own constants, and answering it with a negative array index
  // could.
  if (branch < 1) {
    points.length = 0;
    return points;
  }

  const mover = state.toPlay;
  const near = candidatePoints(state);
  let kept = 0;

  for (let at = 0; at < near.length; at += 1) {
    const point = near[at];
    if (!isLegalMove(state, point)) continue;
    const score = pointScore(state, point, mover, spec, defence);
    /*
     * Full already, and this is no better than the worst one kept. A full sort
     * would have put it at or after position `branch` and the trim would have
     * dropped it, so dropping it here is the same answer for less work.
     *
     * `<=` rather than `<` is the stable sort's tie rule and not a rounding of
     * it: this point comes later in the candidate order, so an EQUAL score
     * sorts it behind the one already held, which is off the end of the list.
     */
    if (kept === branch && score <= scores[branch - 1]) continue;

    /*
     * Insertion, from the back. The shelf is at most `branch` long — ten at an
     * interior node — so this is a short shift over two flat arrays rather than
     * a comparison sort over sixty objects that do not exist.
     *
     * The walk stops at the first entry that is not strictly worse, which is
     * again the stable rule: an equal score already on the shelf was found
     * earlier and keeps its place in front.
     */
    let slot = kept < branch ? kept : branch - 1;
    while (slot > 0 && scores[slot - 1] < score) {
      scores[slot] = scores[slot - 1];
      points[slot] = points[slot - 1];
      slot -= 1;
    }
    scores[slot] = score;
    points[slot] = point;
    if (kept < branch) kept += 1;
  }

  // `scores` is left as long as it grew: it is read only against `kept` inside
  // this call, and a shelf that keeps its capacity is a shelf that stops
  // growing after the first node at this depth.
  points.length = kept;
  return points;
}

/**
 * The points worth searching at the ROOT, best first, at most `branch` of them.
 *
 * A fresh array, because the deepening loop reads this list once and reuses it
 * for every pass — it outlives the calls beneath it, and a shelf does not.
 *
 * Ordered by shape first, as everywhere; then the best `SEARCH.rootReading` of
 * them are re-read for what they actually threaten and re-sorted. That reading
 * is about fifty times the price of the shape score, which is affordable once
 * over a shortlist at the top of the tree and is not a search at all if spent
 * at every interior node — measured at a hundred and ninety-five seconds for
 * one move before the shortlist existed.
 */
export function rootCandidates(
  state: GameState,
  spec: VariantSpec,
  branch: number,
  defence: number | undefined,
): Point[] {
  const mover = state.toPlay;
  const points = candidatePoints(state).filter((point) => isLegalMove(state, point));
  if (points.length === 0) return [];

  const scored = points.map((point) => ({
    point,
    score: pointScore(state, point, mover, spec, defence),
  }));
  scored.sort((a, b) => b.score - a.score);

  // Only the shortlist, and only once: see SEARCH.rootReading.
  const shortlist = scored.slice(0, SEARCH.rootReading);
  for (const entry of shortlist) {
    entry.score += threatScore(state, entry.point, mover);
  }
  shortlist.sort((a, b) => b.score - a.score);
  scored.splice(0, shortlist.length, ...shortlist);

  return scored.slice(0, branch).map((entry) => entry.point);
}
