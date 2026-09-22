import { describe, expect, it } from "vitest";

import { createGame, indexOf, isStone, pieceMoves, pointOf } from "../engine";
import { RULE_VARIANTS, VARIANT_SPECS, boardSizesFor } from "../gomoku.constants";
import { racesForCamp } from "../rules/farCamp";
import { raceBoard } from "./raceBoard";
import type { Cell, GameState, RuleVariant } from "../gomoku.types";

/**
 * THE MEASURED BOARD, CHECKED AGAINST THE ENGINE AND AGAINST THE GAME.
 *
 * `raceBoard` exists because the shared reading measured a race with
 * |Δrow| + |Δcol|, which is the right answer on neither of the two lattices a
 * race is run on here. So the thing to test is not that the numbers are the
 * numbers — a second copy of the same arithmetic would agree with the first
 * whatever either said — but that they describe the board the ENGINE plays on.
 * Every case below asks the engine or the game, never the module.
 */

/** Every race game on this site, and the boards it is played on. */
const RACES: { variant: RuleVariant; sizes: readonly number[] }[] = Object.values(RULE_VARIANTS)
  .filter((variant) => racesForCamp(VARIANT_SPECS[variant]))
  .map((variant) => ({ variant, sizes: boardSizesFor(variant) }));

/** The board a fresh game starts on, with the pieces taken off and the obstacles left. */
function bareBoard(state: GameState): Cell[] {
  return state.board.map((cell) => (isStone(cell) ? null : cell));
}

describe("the boards a race is run on", () => {
  it("covers both games, so a third one added is measured too", () => {
    expect(RACES.map((race) => race.variant).sort()).toEqual([RULE_VARIANTS.chineseCheckers, RULE_VARIANTS.halma].sort());
    for (const race of RACES) expect(race.sizes.length, `${race.variant} has no boards`).toBeGreaterThan(0);
  });

  for (const { variant, sizes } of RACES) {
    for (const size of sizes) {
      describe(`${variant} on ${size}`, () => {
        it("steps exactly where the engine says a lone piece may step", () => {
          /*
           * The neighbour table is built by asking `pieceMoves` on a board
           * holding one piece. This asks it again, on every cell, and holds
           * the table to the answer — so the day a lattice gains a direction,
           * or the star's seal moves, this fails rather than the bot quietly
           * measuring distances across a wall.
           */
          const measured = raceBoard(variant, size);
          const fresh = createGame({ variant, size });
          const bare = bareBoard(fresh);
          for (let index = 0; index < bare.length; index += 1) {
            if (bare[index] !== null) {
              expect(measured.neighbours[index], `a sealed cell has no steps`).toEqual([]);
              continue;
            }
            const board = [...bare];
            board[index] = "black";
            const probe: GameState = { ...fresh, board, toPlay: "black" };
            const engine = pieceMoves(probe, pointOf(size, index)).map((to) => indexOf(size, to)).sort((a, b) => a - b);
            expect([...measured.neighbours[index]].sort((a, b) => a - b)).toEqual(engine);
          }
        });

        it("gives each colour a camp with a square for every piece it owns", () => {
          const measured = raceBoard(variant, size);
          const fresh = createGame({ variant, size });
          for (const stone of ["black", "white"] as const) {
            const pieces = fresh.board.filter((cell) => cell === stone).length;
            expect(measured.campOf[stone].length, `${stone} has ${pieces} pieces`).toBe(pieces);
          }
        });

        it("orders the camp deepest first, furthest from where that colour starts", () => {
          /*
           * The order is what makes a piece in the doorway expensive. Checked
           * against where the pieces actually START, read off a fresh game, so
           * it cannot be satisfied by whatever order the camp table happens to
           * hand its squares back in — which is the opposite way round in the
           * two camp modules.
           */
          const measured = raceBoard(variant, size);
          const fresh = createGame({ variant, size });
          for (const stone of ["black", "white"] as const) {
            const home = fresh.board
              .map((cell, index) => (cell === stone ? index : -1))
              .filter((index) => index >= 0);
            const depths = measured.campOf[stone].map((_square, k) =>
              Math.min(...home.map((start) => measured.stepsToCamp[stone][k][start])),
            );
            expect([...depths], `${stone}'s camp is not deepest first`).toEqual([...depths].sort((a, b) => b - a));
          }
        });

        it("can reach every camp square from every cell a piece may stand on", () => {
          // A race on a board in two halves is a game nobody can win. The
          // measurement refuses one; this is what says both boards are whole.
          const measured = raceBoard(variant, size);
          for (const stone of ["black", "white"] as const) {
            for (const steps of measured.stepsToCamp[stone]) {
              for (let index = 0; index < steps.length; index += 1) {
                if (measured.neighbours[index].length === 0) continue;
                expect(steps[index], `cell ${index} cannot reach ${stone}'s camp`).toBeGreaterThanOrEqual(0);
              }
            }
          }
        });

        it("counts a step as one however it leans, which |Δrow| + |Δcol| does not", () => {
          /*
           * The fault this module was written for, stated as a test. Every
           * neighbour is one step away by definition; the old reading charged
           * two for any of them that moved in both row and column — eight of
           * Halma's directions and four of the star's — so a piece's distance
           * home depended on which way it happened to be leaning.
           */
          const measured = raceBoard(variant, size);
          let leaning = 0;
          for (let index = 0; index < measured.neighbours.length; index += 1) {
            const from = pointOf(size, index);
            for (const to of measured.neighbours[index]) {
              const at = pointOf(size, to);
              const manhattan = Math.abs(at.row - from.row) + Math.abs(at.col - from.col);
              if (manhattan > 1) leaning += 1;
            }
          }
          expect(leaning, "no step on this board leans, so there is nothing here to get wrong").toBeGreaterThan(0);
        });
      });
    }
  }

  it("measures the standard 121-hole star, ten pieces a side", () => {
    // The board Chinese Checkers is always sold with, read off the measurement
    // rather than quoted: 121 cells, a ten-cell point for each side.
    const measured = raceBoard(RULE_VARIANTS.chineseCheckers, 17);
    expect(measured.neighbours.filter((steps) => steps.length > 0)).toHaveLength(121);
    expect(measured.campOf.black).toHaveLength(10);
    expect(measured.campOf.white).toHaveLength(10);
  });

  it("gives back the same measurement rather than making it again", () => {
    // It is asked at every node of a search, and it builds a breadth-first
    // search per camp square. Kept, like `farCampSquares` beside it.
    expect(raceBoard(RULE_VARIANTS.halma, 8)).toBe(raceBoard(RULE_VARIANTS.halma, 8));
  });
});
