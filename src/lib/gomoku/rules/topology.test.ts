import { describe, expect, it } from "vitest";

import { cellAt, createGame, playMove } from "../engine";
import { RULE_VARIANTS, WRAP_MODES, VARIANT_SPECS } from "../gomoku.constants";
import { randomSquares } from "../obstacles";
import type { GameState, Point } from "../gomoku.types";

const p = (row: number, col: number): Point => ({ row, col });

function play(state: GameState, points: Point[]): GameState {
  return points.reduce((current, point) => playMove(current, point), state);
}

/** Black's stones with white answering harmlessly far away each turn. */
function blackLine(state: GameState, blacks: Point[], whites: Point[]): GameState {
  const order: Point[] = [];
  blacks.forEach((point, i) => {
    order.push(point);
    if (whites[i] !== undefined) order.push(whites[i]);
  });
  return play(state, order);
}

describe("Toroidal Five", () => {
  const game = () => createGame({ variant: RULE_VARIANTS.toroidalFive, size: 9 });

  it("joins both pairs of edges", () => {
    expect(VARIANT_SPECS.toroidalFive.wrap).toBe(WRAP_MODES.both);
  });

  it("wins on a row that runs off the right edge and back on the left", () => {
    // Columns 7, 8, 0, 1, 2 on row 4 — a five only because the edges join.
    const state = blackLine(
      game(),
      [p(4, 7), p(4, 8), p(4, 0), p(4, 1), p(4, 2)],
      [p(0, 0), p(0, 2), p(0, 4), p(0, 6)],
    );
    expect(state.winner).toBe("black");
  });

  it("wins on a column that runs off the bottom and back on the top", () => {
    // Rows 7, 8, 0, 1, 2 in column 4 — the wrap a cylinder would not give.
    const state = blackLine(
      game(),
      [p(7, 4), p(8, 4), p(0, 4), p(1, 4), p(2, 4)],
      [p(0, 0), p(0, 2), p(6, 6), p(6, 8)],
    );
    expect(state.winner).toBe("black");
  });

  it("wins on a diagonal that wraps both ways at once", () => {
    const state = blackLine(
      game(),
      [p(7, 7), p(8, 8), p(0, 0), p(1, 1), p(2, 2)],
      [p(0, 4), p(0, 6), p(4, 0), p(4, 6)],
    );
    expect(state.winner).toBe("black");
  });

  it("does not award a win to four stones that merely wrap", () => {
    const state = blackLine(
      game(),
      [p(4, 7), p(4, 8), p(4, 0), p(4, 1)],
      [p(0, 0), p(0, 2), p(0, 4)],
    );
    expect(state.status).toBe("playing");
    expect(state.winner).toBeNull();
  });

  /**
   * The distinctness rule: a run has to be five separate stones. Three stones
   * on a wrapping line must not be counted twice — once walking each way — and
   * called a five.
   */
  it("does not let a short line meet itself around the board", () => {
    const state = blackLine(
      game(),
      [p(4, 0), p(4, 1), p(4, 2)],
      [p(0, 0), p(0, 2)],
    );
    expect(state.status).toBe("playing");
  });

  it("leaves a plain board unwrapped", () => {
    // The same five split across the edge is not a line in freestyle.
    const state = blackLine(
      createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }),
      [p(4, 7), p(4, 8), p(4, 0), p(4, 1), p(4, 2)],
      [p(0, 0), p(0, 2), p(0, 4), p(0, 6)],
    );
    expect(state.status).toBe("playing");
  });
});

describe("Obstacle Five", () => {
  const game = (seed = 7) =>
    createGame({ variant: RULE_VARIANTS.obstacleFive, size: 15, seed });

  it("scatters the squares the spec asks for", () => {
    const { dead, hot } = randomSquares(game().settings);
    expect(dead).toHaveLength(VARIANT_SPECS.obstacleFive.deadSquares);
    expect(hot).toHaveLength(VARIANT_SPECS.obstacleFive.hotSquares);
  });

  it("puts the same squares in the same places for the same seed", () => {
    expect(randomSquares(game(42).settings)).toEqual(randomSquares(game(42).settings));
  });

  it("puts them somewhere else for a different seed", () => {
    expect(randomSquares(game(1).settings)).not.toEqual(randomSquares(game(2).settings));
  });

  it("refuses a stone on a dead square", () => {
    const state = game();
    const [dead] = randomSquares(state.settings).dead;
    expect(cellAt(state, dead)).toBe("blocked");
    expect(playMove(state, dead)).toBe(state);
  });

  it("keeps the board otherwise playable", () => {
    const state = game();
    const { dead, hot } = randomSquares(state.settings);
    const taken = new Set([...dead, ...hot].map((q) => `${q.row},${q.col}`));
    const free = p(0, 0);
    // A corner the scatter avoids, so an ordinary stone still lands.
    if (!taken.has("0,0")) {
      expect(playMove(state, free)).not.toBe(state);
    }
  });

  it("does not scatter anything on a plain game", () => {
    const plain = createGame({ variant: RULE_VARIANTS.freestyle, size: 15, seed: 7 });
    const { dead, hot } = randomSquares(plain.settings);
    expect([...dead, ...hot]).toEqual([]);
  });
});
