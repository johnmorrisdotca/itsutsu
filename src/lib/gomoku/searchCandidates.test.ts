import { describe, expect, it } from "vitest";

import { createGame, isLegalMove } from "./engine";
import { boardSizesFor, GAME_STATUS, RULE_VARIANTS, VARIANT_SPECS } from "./gomoku.constants";
import { SEARCH } from "./opponent.constants";
import { pointScore } from "./opponentEval";
import { applyTurn } from "./opponentTurns";
import { searchable } from "./opponentSearch";
import { nodeCandidates, rootCandidates } from "./searchCandidates";
import { candidatePoints } from "./threats";
import type { GameState, Point, RuleVariant, VariantSpec } from "./gomoku.types";
import type { SearchShelves } from "./opponent.types";

/**
 * THE ORDERING, CHECKED AGAINST THE EXPRESSION IT REPLACED.
 *
 * `nodeCandidates` is a speed change and nothing else. What it replaced built a
 * wrapper object for every candidate, sorted the lot and threw all but ten
 * away; what it does now is keep a running shortlist by insertion. Those are
 * the same answer only if the insertion reproduces a STABLE descending sort
 * exactly — including how equal scores fall, which `Array.prototype.sort` has
 * been required to settle by original position since ES2019 and which is
 * therefore behaviour rather than an accident. A version that ordered ties the
 * other way round would send the search down different lines and the computer
 * would play different moves, which is not a speed change.
 *
 * So the check is the one `lineShapes.test.ts` makes: the old expression is
 * RESTATED BY HAND below and the two are compared over littered boards, at
 * every searchable variant, at several widths and at both styles. Comparing
 * against the code under test would only prove the code ran.
 *
 * The tie rule cannot be tested by hoping ties turn up, so the sweep counts
 * them and refuses to pass without having seen both kinds: equal scores INSIDE
 * the list, and — the one that decides between `<` and `<=` at the cut — a
 * candidate just outside the list whose score equals the last one kept.
 */

/** A seeded generator, so a littered board is the same board on every machine. */
function seeded(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 4_294_967_296;
  };
}

/**
 * The old expression, written out: every legal candidate wrapped with its
 * score, sorted descending, trimmed to `branch`.
 */
function byTheOldExpression(
  state: GameState,
  spec: VariantSpec,
  branch: number,
  defence: number | undefined,
): Point[] {
  const mover = state.toPlay;
  const points = candidatePoints(state).filter((point) => isLegalMove(state, point));
  const scored = points.map((point) => ({
    point,
    score: pointScore(state, point, mover, spec, defence),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, branch).map((entry) => entry.point);
}

/** The whole sorted score list, for counting where ties actually fell. */
function everyScore(state: GameState, spec: VariantSpec, defence: number | undefined): number[] {
  const mover = state.toPlay;
  return candidatePoints(state)
    .filter((point) => isLegalMove(state, point))
    .map((point) => pointScore(state, point, mover, spec, defence))
    .sort((a, b) => b - a);
}

const asText = (points: readonly Point[]) => points.map((one) => `${one.row},${one.col}`).join(" ");

/** A board with stones on it, reached by playing seeded legal moves through the engine. */
function littered(variant: RuleVariant, size: number, seed: number, moves: number): GameState {
  const random = seeded(seed);
  let state = createGame({ variant, size }, 0);
  for (let played = 0; played < moves; played += 1) {
    if (state.status !== GAME_STATUS.playing || state.pendingTwist) break;
    const legal = candidatePoints(state).filter((point) => isLegalMove(state, point));
    if (legal.length === 0) break;
    const point = legal[Math.floor(random() * legal.length)];
    const after = applyTurn(state, { kind: "place", row: point.row, col: point.col });
    if (after === state) break;
    state = after;
  }
  return state;
}

const SEARCHED: RuleVariant[] = (Object.values(RULE_VARIANTS) as RuleVariant[])
  .filter((variant) => searchable(VARIANT_SPECS[variant]))
  .sort();

/** One at each end, one at the search's own width, and one past every candidate. */
const WIDTHS = [1, 2, SEARCH.branch, SEARCH.rootBranch, 1_000];
/** Even-handed, an attacker's and a defender's — the style reaches the ordering. */
const STYLES: (number | undefined)[] = [undefined, 0.2, 1.6];

describe("the search's candidate ordering", () => {
  it("is the stable sort it replaced, everywhere the search runs", () => {
    expect(SEARCHED.length).toBeGreaterThan(5);
    const shelves: SearchShelves = [];
    let compared = 0;
    let tiesInside = 0;
    let tiesAtTheCut = 0;

    for (const variant of SEARCHED) {
      const spec = VARIANT_SPECS[variant];
      const size = boardSizesFor(variant)[0];
      for (let position = 0; position < 3; position += 1) {
        const state = littered(variant, size, 7 + position * 31, 4 + position * 5);
        if (state.status !== GAME_STATUS.playing) continue;
        for (const defence of STYLES) {
          const scores = everyScore(state, spec, defence);
          for (const branch of WIDTHS) {
            // Copied at once: the list handed back is this depth's shelf, and
            // the next call at this depth writes over it.
            const mine = asText(nodeCandidates(state, spec, branch, defence, shelves, 3));
            expect(mine).toBe(asText(byTheOldExpression(state, spec, branch, defence)));
            compared += 1;

            const kept = Math.min(branch, scores.length);
            for (let at = 1; at < kept; at += 1) {
              if (scores[at] === scores[at - 1]) tiesInside += 1;
            }
            if (kept > 0 && kept < scores.length && scores[kept] === scores[kept - 1]) {
              tiesAtTheCut += 1;
            }
          }
        }
      }
    }

    expect(compared).toBeGreaterThan(200);
    // Without these two the comparison above says nothing about the tie rule,
    // which is the only part a rewrite can plausibly get wrong.
    expect(tiesInside).toBeGreaterThan(0);
    expect(tiesAtTheCut).toBeGreaterThan(0);
  });

  it("keeps the earlier candidate when two score the same", () => {
    /*
     * An empty freestyle board scores by the centre alone, so the four points
     * diagonally around the middle are worth exactly the same. The one
     * `candidatePoints` reaches first must come back first, at every width that
     * splits them — that is the stable rule, stated on a position where it can
     * be read rather than inferred from a sweep.
     */
    const spec = VARIANT_SPECS[RULE_VARIANTS.freestyle];
    let state = createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0);
    state = applyTurn(state, { kind: "place", row: 4, col: 4 });
    const shelves: SearchShelves = [];
    const order = byTheOldExpression(state, spec, 8, undefined);
    for (let branch = 1; branch <= 8; branch += 1) {
      expect(asText(nodeCandidates(state, spec, branch, undefined, shelves, 2))).toBe(
        asText(order.slice(0, branch)),
      );
    }
  });

  it("answers nothing where there is nothing to look at", () => {
    const spec = VARIANT_SPECS[RULE_VARIANTS.freestyle];
    const state = createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0);
    const shelves: SearchShelves = [];
    // A width of nought is not a width. It cannot arrive from the search's own
    // constants, and answering it with a negative array index could.
    expect(nodeCandidates(state, spec, 0, undefined, shelves, 1)).toHaveLength(0);
    expect(nodeCandidates(state, spec, -5, undefined, shelves, 1)).toHaveLength(0);
    // A full board offers no legal point, which is a real answer and not a gap.
    const full = littered(RULE_VARIANTS.tictactoe, 3, 11, 20);
    const fullSpec = VARIANT_SPECS[RULE_VARIANTS.tictactoe];
    expect(nodeCandidates(full, fullSpec, 10, undefined, shelves, 1).length).toBe(
      byTheOldExpression(full, fullSpec, 10, undefined).length,
    );
  });
});

/**
 * THE INVARIANT THE REUSED MEMORY RESTS ON.
 *
 * A shelf per remaining ply is safe because the search is one thread going
 * depth first and a call only ever recurses to `depth - 1`, so no two live
 * calls hold the same shelf. Getting that wrong would not fail — it would
 * quietly hand a node somebody else's candidate list and the computer would
 * play a move nothing explains. So both halves are pinned here: one depth is
 * one array, two depths are two, and no amount of work below a depth disturbs
 * what it is holding.
 */
describe("the shelves a search lends its candidate lists from", () => {
  const spec = VARIANT_SPECS[RULE_VARIANTS.freestyle];

  it("gives one depth the same array twice and two depths different arrays", () => {
    const state = littered(RULE_VARIANTS.freestyle, 15, 5, 8);
    const shelves: SearchShelves = [];
    const deep = nodeCandidates(state, spec, SEARCH.branch, undefined, shelves, 5);
    expect(nodeCandidates(state, spec, SEARCH.branch, undefined, shelves, 5)).toBe(deep);
    expect(nodeCandidates(state, spec, SEARCH.branch, undefined, shelves, 4)).not.toBe(deep);
    expect(nodeCandidates(state, spec, SEARCH.branch, undefined, shelves, 1)).not.toBe(deep);
  });

  it("leaves a depth's list exactly as it was however much runs below it", () => {
    const shelves: SearchShelves = [];
    const here = littered(RULE_VARIANTS.freestyle, 15, 21, 10);
    const borrowed = nodeCandidates(here, spec, SEARCH.branch, undefined, shelves, 5);
    const asLent = asText(borrowed);
    expect(borrowed.length).toBeGreaterThan(1);

    /*
     * What a node at depth 5 sets in motion: a great many calls at 4, 3, 2 and
     * 1, on positions of their own. Driven with different boards and widths on
     * purpose, because a bug that reused one buffer for everything would be
     * hidden by asking the same question twice.
     */
    for (let below = 4; below >= 1; below -= 1) {
      for (let position = 0; position < 6; position += 1) {
        const other = littered(RULE_VARIANTS.freestyle, 15, 100 + below * 10 + position, 6 + position);
        nodeCandidates(other, spec, below + 3, undefined, shelves, below);
      }
    }

    expect(shelves[5]?.points).toBe(borrowed);
    expect(asText(borrowed)).toBe(asLent);
  });

  it("never lends the root its memory, because the root keeps its list", () => {
    /*
     * The deepening loop reads the root's list once and reuses it for every
     * pass, so it outlives every node beneath it. `rootCandidates` therefore
     * takes no shelves at all — the guarantee is in the signature rather than
     * in somebody remembering to pick a slot nobody else wants.
     */
    const state = littered(RULE_VARIANTS.freestyle, 15, 33, 9);
    const shelves: SearchShelves = [];
    const root = rootCandidates(state, spec, SEARCH.rootBranch, undefined);
    const asRead = asText(root);
    expect(root.length).toBeGreaterThan(1);
    expect(rootCandidates(state, spec, SEARCH.rootBranch, undefined)).not.toBe(root);

    for (let depth = 7; depth >= 1; depth -= 1) {
      nodeCandidates(state, spec, SEARCH.branch, undefined, shelves, depth);
    }
    expect(asText(root)).toBe(asRead);
    for (const shelf of shelves) {
      if (shelf !== undefined) expect(shelf.points).not.toBe(root);
    }
  });

  it("builds a shelf only for a depth the search actually reached", () => {
    // A move that runs out of clock at four plies should not have paid for
    // eight, and a search that never gets below its root pays for none.
    const state = littered(RULE_VARIANTS.freestyle, 15, 41, 7);
    const shelves: SearchShelves = [];
    expect(shelves.filter(Boolean)).toHaveLength(0);
    nodeCandidates(state, spec, SEARCH.branch, undefined, shelves, 3);
    nodeCandidates(state, spec, SEARCH.branch, undefined, shelves, 2);
    expect(shelves.filter(Boolean)).toHaveLength(2);
  });
});
