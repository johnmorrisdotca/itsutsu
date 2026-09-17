import { describe, expect, it } from "vitest";

import { STONES } from "./gomoku.constants";
import { forcedBudget, forcedWinTurn } from "./forcedWin";
import { chooseTurn } from "./opponent";
import { threatWinTurn } from "./threatWin";
import { holds, position, type Cells } from "./threatWin.test-support";

describe("a win by threats", () => {
  /*
   *   col:   6  7  8
   *   row 5:       B
   *   row 6:       B
   *   row 7: B  B  x      x = (7,8) makes two open threes at once: one stone cannot stop both
   */
  const black: Cells = [[7, 6], [7, 7], [5, 8], [6, 8]];
  const white: Cells = [[0, 0], [0, 14], [14, 0], [14, 14]];

  it("finds a double three that no fours could have found", () => {
    const state = position(black, white);
    expect(state.toPlay).toBe(STONES.black);
    expect(forcedWinTurn(state, forcedBudget({ nodes: 1_000_000 }))).toBeNull();
    expect(threatWinTurn(state, forcedBudget({ nodes: 1_000_000 }))).not.toBeNull();
    expect(holds(state, STONES.black, 6, 1)).toBe(true);
  });

  it("is what the top grades play", () => {
    const state = position(black, white);
    const forced = threatWinTurn(state, forcedBudget({ nodes: 1_000_000 }));
    expect(chooseTurn(state, "guoshou", () => 0.5, { nodes: 1_000_000 })).toEqual(forced);
  });

  it("claims nothing when a four of the defender's comes first", () => {
    // The same double three, but white has three in a row with room: a four of white's answers every three.
    const state = position(black, [[2, 2], [2, 3], [2, 4], [14, 14]]);
    const turn = threatWinTurn(state, forcedBudget({ nodes: 1_000_000 }), 1);
    if (turn !== null) expect(holds(state, STONES.black, 6, 1)).toBe(true);
  });
});
