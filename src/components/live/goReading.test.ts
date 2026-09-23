import { describe, expect, it } from "vitest";

import { createGame, indexOf } from "@/lib/gomoku/engine";
import { MOVE_KINDS, RULE_VARIANTS, STONES } from "@/lib/gomoku/gomoku.constants";
import { applyTurn } from "@/lib/gomoku/opponentTurns";
import type { Cell, GameState, Move, Stone } from "@/lib/gomoku/gomoku.types";

import { goRisk, groupsInAtari, theyJustPassed } from "./goReading";

/**
 * THE GO HELP'S READINGS, on the position that asked for them: a group with two
 * eyes, the other side having passed, and the stone that filled an eye.
 */

function position(stones: [number, number, Stone][], toPlay: Stone, moves: Move[] = []): GameState {
  const fresh = createGame({ variant: RULE_VARIANTS.go, size: 9 });
  const board: Cell[] = fresh.board.map(() => null);
  for (const [row, col, stone] of stones) board[indexOf(9, { row, col })] = stone;
  return { ...fresh, board, toPlay, moves };
}

const pass = (stone: Stone): Move => ({ row: -1, col: -1, stone, kind: MOVE_KINDS.pass });
const place = (row: number, col: number) => ({ kind: MOVE_KINDS.place, row, col }) as const;

/*
 * Black's corner group on the top right, with two eyes at (0,8) and (1,7):
 * the shape John's winning group had, reduced to the corner.
 */
const TWO_EYES: [number, number, Stone][] = [
  [0, 6, STONES.black], [0, 7, STONES.black], [1, 6, STONES.black], [1, 8, STONES.black],
  [2, 6, STONES.black], [2, 7, STONES.black], [2, 8, STONES.black],
  [0, 5, STONES.white], [1, 5, STONES.white], [2, 5, STONES.white], [3, 5, STONES.white],
  [3, 6, STONES.white], [3, 7, STONES.white], [3, 8, STONES.white],
];

describe("when the other side has passed", () => {
  it("says so to the player whose turn it is", () => {
    expect(theyJustPassed(position(TWO_EYES, STONES.black, [pass(STONES.white)]), STONES.black)).toBe(true);
  });

  it("says nothing to a watcher, or when the last move was a stone", () => {
    expect(theyJustPassed(position(TWO_EYES, STONES.black, [pass(STONES.white)]), null)).toBe(false);
    const stone: Move = { row: 4, col: 4, stone: STONES.white, kind: MOVE_KINDS.place };
    expect(theyJustPassed(position(TWO_EYES, STONES.black, [stone]), STONES.black)).toBe(false);
  });
});

describe("a stone that endangers its own side", () => {
  it("is the one that fills an eye, which is how the winning group died", () => {
    const before = position(TWO_EYES, STONES.black);
    const after = applyTurn(before, place(1, 7));
    expect(goRisk(before, place(1, 7), after)).toBe("fillsOwnEye");
  });

  it("is a stone that leaves its group one liberty", () => {
    // A black stone on (4,4) with White on three sides joins nothing and has one way out.
    const before = position([[3, 4, STONES.white], [5, 4, STONES.white], [4, 3, STONES.white]], STONES.black);
    const after = applyTurn(before, place(4, 4));
    expect(goRisk(before, place(4, 4), after)).toBe("selfAtari");
  });

  it("is not an ordinary stone in the open", () => {
    const before = position(TWO_EYES, STONES.black);
    const after = applyTurn(before, place(6, 2));
    expect(goRisk(before, place(6, 2), after)).toBeNull();
  });
});

describe("groups in atari", () => {
  it("names the group with one liberty and the point that takes it, the reader's own first", () => {
    const filled = applyTurn(position(TWO_EYES, STONES.black), place(1, 7));
    const [first] = groupsInAtari(filled, STONES.black);
    expect(first.stone).toBe(STONES.black);
    expect(first.stones).toBe(8);
    expect(first.lastLiberty).toBe("J9");
  });
});
