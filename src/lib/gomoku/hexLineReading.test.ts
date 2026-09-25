import { describe, expect, it } from "vitest";

import { createGame } from "./engine";
import { BLOCKED, MOVE_KINDS, STONES } from "./gomoku.constants";
import { BOT_TIERS } from "./opponent.constants";
import { chooseTurn } from "./opponent";
import { seededRandom } from "./rules/random";
import { threatAt } from "./threats";
import type { Cell, GameState, Point, Stone } from "./gomoku.types";

/**
 * hexFive's line reading has only three real axes — {0,1}, {1,0}, {1,-1} —
 * never the square embedding's fourth diagonal, {1,1}. `winningLineFor`
 * (rules/lines.ts) already settles games by that rule; this file is about
 * everything ELSE that reads a line: the threat and analysis layer a player
 * is shown, and the specialist a bot at the strongest tier plays hexFive
 * with. Both used to scan the square board's four directions regardless of
 * the game's own geometry, so a run along the fake diagonal was read as a
 * genuine threat and a genuine near-win — never a WIN, since `findWinningLine`
 * was always right, but a false thing to chase or fear on the way there.
 */

const p = (row: number, col: number): Point => ({ row, col });

/** A cleared copy of `state`'s board: BLOCKED cells stay BLOCKED, everything else empty. */
function cleared(state: GameState): Cell[] {
  return state.board.map((cell) => (cell === BLOCKED ? BLOCKED : null));
}

/** Lays `stone` on every point in `line`, on a working copy of `board`. */
function laid(board: Cell[], size: number, line: readonly Point[], stone: Stone): Cell[] {
  const next = board.slice();
  for (const point of line) next[point.row * size + point.col] = stone;
  return next;
}

/** A hexFive position with an empty board but for the stones given, to move as stated. */
function hexPosition(stones: readonly { point: Point; stone: Stone }[], toPlay: Stone): GameState {
  const base = createGame({ variant: "hexFive" });
  let board = cleared(base);
  for (const { point, stone } of stones) {
    board = laid(board, base.settings.size, [point], stone);
  }
  return { ...base, board, toPlay };
}

describe("hexFive: threats.ts reads only the three real axes", () => {
  it("reports no threat along the square embedding's fourth diagonal", () => {
    const state = hexPosition(
      [
        { point: p(3, 3), stone: STONES.black },
        { point: p(4, 4), stone: STONES.black },
        { point: p(5, 5), stone: STONES.black },
        { point: p(6, 6), stone: STONES.black },
      ],
      STONES.black,
    );
    // (2,2) is off the hexagon (a corner the square embedding blocks), so the
    // only apparent completion of this run is (7,7) — and it is not a line.
    expect(threatAt(state.board, state.settings, STONES.black, p(7, 7)).kind).toBeNull();
  });

  it("reports a real threat along each of the three lattice axes", () => {
    const axes: Record<string, { four: Point[]; completion: Point }> = {
      row: { four: [p(5, 3), p(5, 4), p(5, 5), p(5, 6)], completion: p(5, 7) },
      column: { four: [p(3, 5), p(4, 5), p(5, 5), p(6, 5)], completion: p(7, 5) },
      slant: { four: [p(3, 7), p(4, 6), p(5, 5), p(6, 4)], completion: p(7, 3) },
    };
    for (const [axis, { four, completion }] of Object.entries(axes)) {
      const state = hexPosition(
        four.map((point) => ({ point, stone: STONES.black })),
        STONES.black,
      );
      expect(threatAt(state.board, state.settings, STONES.black, completion).kind, axis).toBe("five");
    }
  });
});

describe("hexFive: the strongest tier plays the real lines, not the fake diagonal", () => {
  const budget = { nodes: 4_000, millis: 5_000 };

  it("completes a real four along an open axis with one open end", () => {
    const state = hexPosition(
      [
        { point: p(5, 2), stone: STONES.white }, // shuts the left end.
        { point: p(5, 3), stone: STONES.black },
        { point: p(5, 4), stone: STONES.black },
        { point: p(5, 5), stone: STONES.black },
        { point: p(5, 6), stone: STONES.black },
      ],
      STONES.black,
    );

    const turn = chooseTurn(state, BOT_TIERS.meritalu, seededRandom(1), budget);
    expect(turn).not.toBeNull();
    expect(turn?.kind).toBe(MOVE_KINDS.place);
    expect(turn).toMatchObject({ row: 5, col: 7 });
  });

  it("blocks a real open four rather than completing a fake one along {1,1}", () => {
    const state = hexPosition(
      [
        // Black's own four is along the fake diagonal — only (7,7) even looks
        // like a completion, since (2,2) falls off the hexagon.
        { point: p(3, 3), stone: STONES.black },
        { point: p(4, 4), stone: STONES.black },
        { point: p(5, 5), stone: STONES.black },
        { point: p(6, 6), stone: STONES.black },
        // White's four is real, on the row axis, open at both ends.
        { point: p(8, 2), stone: STONES.white },
        { point: p(8, 3), stone: STONES.white },
        { point: p(8, 4), stone: STONES.white },
        { point: p(8, 5), stone: STONES.white },
      ],
      STONES.black,
    );

    const turn = chooseTurn(state, BOT_TIERS.meritalu, seededRandom(2), budget);
    expect(turn).not.toBeNull();
    if (turn === null || turn.kind !== MOVE_KINDS.place) throw new Error("expected a place turn");
    // Never the fake "win" the old, direction-blind reading would have taken.
    expect(turn).not.toMatchObject({ row: 7, col: 7 });
    // One of the two points that actually stop white's real open four.
    const realBlocks = [p(8, 1), p(8, 6)];
    expect(realBlocks.some((point) => turn.row === point.row && turn.col === point.col)).toBe(true);
  });
});
