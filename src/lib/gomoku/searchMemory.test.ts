import { describe, expect, it } from "vitest";

import { createGame } from "./engine";
import { MOVE_KINDS } from "./gomoku.constants";
import { applyTurn } from "./opponentTurns";
import { BOUND, boundOf, indexOfMove, pointKey, positionKey, recalled } from "./searchMemory";
import type { GameState } from "./gomoku.types";

function played(moves: Array<[number, number]>, variant = "freestyle", size = 15): GameState {
  let state = createGame({ variant, size } as never);
  for (const [row, col] of moves) state = applyTurn(state, { kind: MOVE_KINDS.place, row, col });
  return state;
}

describe("the search's memory of positions", () => {
  it("knows a position reached in a different order is the same position", () => {
    // Black 7,7 then 8,8; white 7,8 then 6,6 — played in two orders.
    const one = played([[7, 7], [7, 8], [8, 8], [6, 6]]);
    const other = played([[8, 8], [6, 6], [7, 7], [7, 8]]);
    expect(positionKey(one)).toBe(positionKey(other));
  });

  it("tells apart the same stones in different colours", () => {
    const one = played([[7, 7], [7, 8]]);
    const swapped = played([[7, 8], [7, 7]]);
    expect(positionKey(one)).not.toBe(positionKey(swapped));
  });

  it("tells apart the same board with a different player to move", () => {
    // One stone more is also one move more; the key must not treat them as one.
    const before = played([[7, 7], [7, 8]]);
    const after = played([[7, 7], [7, 8], [3, 3]]);
    expect(positionKey(before)).not.toBe(positionKey(after));
  });

  it("is a whole number a Map can hold exactly", () => {
    const key = positionKey(played([[0, 0], [14, 14], [7, 7]]));
    expect(Number.isSafeInteger(key)).toBe(true);
  });

  it("answers from memory only what the memory settles", () => {
    const exact = { depth: 4, value: 10, bound: BOUND.exact, move: -1 };
    const lower = { depth: 4, value: 10, bound: BOUND.lower, move: -1 };
    const upper = { depth: 4, value: 10, bound: BOUND.upper, move: -1 };

    // Exact, read deep enough: the answer, whatever the window.
    expect(recalled(exact, 4, -100, 100)).toBe(10);
    // Read too shallow for this question: a hint about ordering, never an answer.
    expect(recalled(exact, 6, -100, 100)).toBeUndefined();
    // At least 10 settles a question whose ceiling is 10, not one whose ceiling is 20.
    expect(recalled(lower, 4, -100, 10)).toBe(10);
    expect(recalled(lower, 4, -100, 20)).toBeUndefined();
    // At most 10 settles a question whose floor is 10, not one whose floor is 0.
    expect(recalled(upper, 4, 10, 100)).toBe(10);
    expect(recalled(upper, 4, 0, 100)).toBeUndefined();
    expect(recalled(undefined, 1, -100, 100)).toBeUndefined();
  });

  it("says how sure a value found in a window is", () => {
    expect(boundOf(5, 0, 10)).toBe(BOUND.exact);
    expect(boundOf(0, 0, 10)).toBe(BOUND.upper);
    expect(boundOf(10, 0, 10)).toBe(BOUND.lower);
  });

  it("finds a remembered move among the candidates, and says so when it is not there", () => {
    const candidates = [{ row: 1, col: 2 }, { row: 3, col: 4 }];
    expect(indexOfMove(candidates, pointKey({ row: 3, col: 4 }))).toBe(1);
    expect(indexOfMove(candidates, pointKey({ row: 9, col: 9 }))).toBe(-1);
    expect(indexOfMove(candidates, -1)).toBe(-1);
    expect(indexOfMove(candidates, undefined)).toBe(-1);
  });
});
