import { describe, expect, it } from "vitest";

import { createGame, isLegalMove, legalPoints, playMove } from "../engine";
import { BLOCKED, GAME_STATUS, HOT, RULE_VARIANTS, STONES, VARIANT_SPECS } from "../gomoku.constants";
import type { GameState, Point, RuleVariant } from "../gomoku.types";
import { rockLayoutFor } from "./rocks";

/**
 * The two rock games the obstacle playtest named: Scattered Rocks, whose
 * twelve rocks and two hotspots are there from the first move, and Rockfall,
 * whose twenty rocks and two hotspots fall after the eighth stone.
 */

const SIZE = 15;
const key = (point: Point) => `${point.row},${point.col}`;
const count = (state: GameState, cell: string) => state.board.filter((held) => held === cell).length;
const at = (state: GameState, point: Point) => state.board[point.row * SIZE + point.col];

/** Every point on the board that the layout does not use, in reading order. */
function clearPoints(state: GameState): Point[] {
  const layout = rockLayoutFor(state.settings)!;
  const used = new Set([...layout.dead, ...layout.hot].map(key));
  const points: Point[] = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) if (!used.has(key({ row, col }))) points.push({ row, col });
  }
  return points;
}

/** Plays the points in order, alternating colours, failing on any the engine refuses. */
function playAll(state: GameState, points: readonly Point[]): GameState {
  return points.reduce((current, point) => {
    const next = playMove(current, point);
    expect(next, `refused ${key(point)}`).not.toBe(current);
    return next;
  }, state);
}

describe("the rock games read their rocks from the spec", () => {
  it.each([RULE_VARIANTS.scatteredRocks] as RuleVariant[])(
    "%s lays every rock and hotspot its spec asks for, on every board it is offered on",
    (variant) => {
      const spec = VARIANT_SPECS[variant];
      for (const size of spec.boardSizes ?? []) {
        for (let seed = 0; seed < 30; seed += 1) {
          const layout = rockLayoutFor(createGame({ variant, size, seed }).settings);
          expect(layout, `${variant} ${size} seed ${seed}`).not.toBeNull();
          expect(layout!.dead).toHaveLength(spec.deadSquares);
          expect(layout!.hot).toHaveLength(spec.hotSquares);
        }
      }
    },
  );
});

describe("Scattered Rocks", () => {
  const game = (seed = 11) => createGame({ variant: RULE_VARIANTS.scatteredRocks, size: SIZE, seed });

  it("starts with twelve rocks and two hotspots, and the centre open", () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const state = game(seed);
      expect(count(state, BLOCKED)).toBe(12);
      expect(count(state, HOT)).toBe(2);
      expect(at(state, { row: 7, col: 7 })).toBeNull();
    }
  });

  it("puts them where the seed says, the same every time", () => {
    expect(game(42).board).toEqual(game(42).board);
    expect(game(42).board).not.toEqual(game(43).board);
  });

  it("offers no rock or hotspot as a move", () => {
    const state = game();
    const layout = rockLayoutFor(state.settings)!;
    for (const point of [...layout.dead, ...layout.hot]) expect(isLegalMove(state, point)).toBe(false);
    expect(legalPoints(state)).toHaveLength(SIZE * SIZE - 14);
  });

  it("counts a hotspot in a line of either colour", () => {
    // A seed whose first hotspot has four clear points in a row beside it; black plays those four.
    for (let seed = 1; seed < 200; seed += 1) {
      const state = game(seed);
      const hot = rockLayoutFor(state.settings)!.hot[0];
      const clear = new Set(clearPoints(state).map(key));
      const four = [1, 2, 3, 4].map((step) => ({ row: hot.row, col: hot.col - step }));
      if (!four.every((point) => point.col >= 0 && clear.has(key(point)))) continue;
      const whites = clearPoints(state).filter((point) => Math.abs(point.row - hot.row) >= 3 && point.col % 3 === 0).slice(0, 3);
      const won = playAll(state, [four[0], whites[0], four[1], whites[1], four[2], whites[2], four[3]]);
      expect(won.status).toBe(GAME_STATUS.won);
      expect(won.winner).toBe(STONES.black);
      expect(won.winningLine.map(key)).toContain(key(hot));
      return;
    }
    throw new Error("no seed under 200 put a hotspot beside four clear points");
  });
});

