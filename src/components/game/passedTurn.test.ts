import { describe, expect, it } from "vitest";

import { createGame, playMove } from "@/lib/gomoku/engine";
import { BLOCKED, MOVE_KINDS, RULE_VARIANTS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { Cell, GameState, Point } from "@/lib/gomoku/gomoku.types";
import { passedTurnWords } from "./passedTurn";

const p = (row: number, col: number): Point => ({ row, col });

/** Reversi where Black's move on C8 leaves White no flip anywhere, and Black still has one. */
function whiteSkipped(): GameState {
  const board: Cell[] = new Array(64).fill(BLOCKED);
  const put = (point: Point, cell: Cell) => {
    board[point.row * 8 + point.col] = cell;
  };
  put(p(0, 0), STONES.black);
  put(p(0, 1), STONES.white);
  put(p(0, 2), null);
  put(p(7, 4), STONES.black);
  put(p(7, 5), STONES.white);
  put(p(7, 6), null);
  return playMove({ ...createGame({ variant: RULE_VARIANTS.reversi }), board, toPlay: STONES.black }, p(0, 2));
}

describe("what each board says about a turn that passed itself", () => {
  it("tells the player whose turn it was, the other side, and anybody else, each in their own words", () => {
    const state = whiteSkipped();
    expect(passedTurnWords(state, STONES.white)).toBe("You had no move, so your turn passed.");
    expect(passedTurnWords(state, STONES.black)).toBe("White had no move, so the turn passed back to you.");
    expect(passedTurnWords(state, null)).toBe("White had no move, so their turn passed.");
  });

  it("says nothing after an ordinary move, or a pass somebody chose", () => {
    const opened = playMove(createGame({ variant: RULE_VARIANTS.reversi }), p(2, 3));
    expect(passedTurnWords(opened, STONES.black)).toBeNull();
    const chosen: GameState = {
      ...createGame({ variant: RULE_VARIANTS.go, size: 9 }),
      moves: [{ row: -1, col: -1, stone: STONES.black, kind: MOVE_KINDS.pass }],
    };
    expect(passedTurnWords(chosen, STONES.white)).toBeNull();
  });
});
