import { describe, expect, it } from "vitest";

import { createGame, indexOf, isStone, pieceMoves, pointOf } from "./engine";
import { RULE_VARIANTS, STONES, VARIANT_SPECS, boardSizesFor } from "./gomoku.constants";
import { EVAL_WEIGHTS } from "./opponent.constants";
import { raceScore } from "./opponentFamilies";
import { farCampSquares, racesForCamp } from "./rules/farCamp";
import type { Cell, GameState, RuleVariant } from "./gomoku.types";

/**
 * THE GRADES' RULER, HELD TO ONE STEP AT A TIME.
 *
 * The graded players read a race by how far every piece is from the far camp.
 * That distance was |Δrow| + |Δcol|, which charged Halma's diagonal step two
 * and the star's steps one or two depending which way they leaned. The
 * property a real distance has and that one did not: a single step moves a
 * piece at most one step nearer home or further from it. So every step a lone
 * piece may take, on every cell of every race board, is made here, and the
 * score may move by one step's worth at most — plus the bonus for arriving,
 * when the step lands in the camp. The engine says what a step is and the
 * camp table says where home is; nothing here asks the module under test.
 */

const RACES: { variant: RuleVariant; sizes: readonly number[] }[] = Object.values(RULE_VARIANTS)
  .filter((variant) => racesForCamp(VARIANT_SPECS[variant]))
  .map((variant) => ({ variant, sizes: boardSizesFor(variant) }));

describe("the graded players' race reading", () => {
  for (const { variant, sizes } of RACES) {
    for (const size of sizes) {
      it(`moves by at most one step for one step, on ${variant} ${size}`, () => {
        const fresh = createGame({ variant, size });
        const bare: Cell[] = fresh.board.map((cell) => (isStone(cell) ? null : cell));
        const home = new Set(farCampSquares(size, STONES.black).map((point) => indexOf(size, point)));
        const lone = (index: number): GameState => {
          const board = [...bare];
          board[index] = STONES.black;
          return { ...fresh, board, toPlay: STONES.black };
        };

        let steps = 0;
        for (let from = 0; from < bare.length; from += 1) {
          if (bare[from] !== null || home.has(from)) continue;
          const before = raceScore(lone(from), STONES.black);
          for (const to of pieceMoves(lone(from), pointOf(size, from))) {
            const landed = indexOf(size, to);
            const after = raceScore(lone(landed), STONES.black);
            const arrived = home.has(landed) ? EVAL_WEIGHTS.home : 0;
            expect(Math.abs(after - before - arrived), `${from} → ${landed}`).toBeLessThanOrEqual(EVAL_WEIGHTS.advance);
            steps += 1;
          }
        }
        expect(steps).toBeGreaterThan(0);
      });
    }
  }
});
