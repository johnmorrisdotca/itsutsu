import { describe, expect, it } from "vitest";

import { createGame, indexOf, legalPoints } from "@/lib/gomoku/engine";
import { RULE_VARIANTS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { Cell, GameState, Stone } from "@/lib/gomoku/gomoku.types";

import { goBoardMarks } from "./goMarks";

function position(stones: [number, number, Stone][], toPlay: Stone): GameState {
  const fresh = createGame({ variant: RULE_VARIANTS.go, size: 9 });
  const board: Cell[] = fresh.board.map(() => null);
  for (const [row, col, stone] of stones) board[indexOf(9, { row, col })] = stone;
  return { ...fresh, board, toPlay };
}

function marksOf(state: GameState) {
  const legal = new Set(legalPoints(state).map((point) => indexOf(9, point)));
  return goBoardMarks(state, legal).map((mark) => `${mark.kind}@${mark.row},${mark.col}`);
}

describe("Go's marks on the board", () => {
  it("crosses a point where a stone would have no liberty and take nothing", () => {
    // (0,0) with White on (0,1) and (1,0), healthy: Black may not play there.
    const state = position([[0, 1, STONES.white], [1, 0, STONES.white], [0, 2, STONES.white], [1, 1, STONES.white]], STONES.black);
    expect(marksOf(state)).toContain("forbidden@0,0");
  });

  it("rings the last liberty of a group in atari, whoever's it is", () => {
    // White's stone on (4,4) has one liberty, (4,5).
    const state = position([[4, 4, STONES.white], [3, 4, STONES.black], [5, 4, STONES.black], [4, 3, STONES.black]], STONES.black);
    expect(marksOf(state)).toContain("forced@4,5");
  });

  it("marks nothing on an open board", () => {
    expect(marksOf(position([[4, 4, STONES.black]], STONES.white))).toEqual([]);
  });
});
