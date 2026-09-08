import { describe, expect, it } from "vitest";

import { createGame, isLegalMove, playMove } from "@/lib/gomoku/engine";
import { GAME_STATUS, RULE_VARIANTS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { Point } from "@/lib/gomoku/gomoku.types";

/**
 * The one kept game — Kyokosan v Incognito, ItsYourTurn, 2005-01-07 — proved
 * legal move by move through the real engine before it goes anywhere near a
 * page. IYT notation, converted: row = 13 − rank, col = file − "a".
 */
const MOVES: Point[] = [
  { row: 6, col: 6 }, { row: 4, col: 6 }, { row: 5, col: 7 }, { row: 4, col: 8 },
  { row: 4, col: 7 }, { row: 3, col: 7 }, { row: 5, col: 5 }, { row: 5, col: 9 },
  { row: 2, col: 6 }, { row: 6, col: 10 }, { row: 7, col: 11 }, { row: 7, col: 7 },
  { row: 5, col: 8 }, { row: 6, col: 8 }, { row: 8, col: 6 }, { row: 4, col: 10 },
  { row: 3, col: 11 }, { row: 6, col: 9 }, { row: 5, col: 6 }, { row: 5, col: 4 },
  { row: 7, col: 6 }, { row: 9, col: 6 }, { row: 6, col: 5 }, { row: 6, col: 11 },
  { row: 6, col: 7 }, { row: 6, col: 12 },
];

describe("the kept game replays legally on the real engine", () => {
  it("is legal at every ply, black first, no move rejected", () => {
    let state = createGame({ variant: RULE_VARIANTS.freestyle, size: 13 });
    for (const point of MOVES) {
      expect(isLegalMove(state, point)).toBe(true);
      state = playMove(state, point);
    }
  });

  it("ends won by white on the 26th move, on the five given as the line", () => {
    let state = createGame({ variant: RULE_VARIANTS.freestyle, size: 13 });
    for (const point of MOVES) state = playMove(state, point);

    expect(state.moves).toHaveLength(26);
    expect(state.status).toBe(GAME_STATUS.won);
    expect(state.winner).toBe(STONES.white);

    // i7 j7 k7 l7 m7 → row 6, columns 8-12.
    const line = [8, 9, 10, 11, 12].map((col) => ({ row: 6, col }));
    for (const point of line) {
      expect(state.board[point.row * 13 + point.col]).toBe(STONES.white);
    }
  });

  it("was not won earlier — the 26th move is the first to complete a line", () => {
    let state = createGame({ variant: RULE_VARIANTS.freestyle, size: 13 });
    for (const point of MOVES.slice(0, -1)) {
      state = playMove(state, point);
      expect(state.status).toBe(GAME_STATUS.playing);
    }
  });
});
