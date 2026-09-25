import { describe, expect, it } from "vitest";

import { threatWinTurn } from "./threatWin";
import { position } from "./threatWin.test-support";

const unlimited = () => ({ nodes: 1e9, until: Infinity });

describe("the finders of forced wins on a line board", () => {
  it("find the double three the finders on copies find", () => {
    const state = position([[7, 6], [7, 7], [5, 8], [6, 8]], [[0, 0], [0, 14], [14, 0], [14, 14]]);
    expect(threatWinTurn(state, unlimited(), 1, "auto")).toEqual(threatWinTurn(state, unlimited(), 1, "states"));
    expect(threatWinTurn(state, unlimited(), 1, "auto")).not.toBeNull();
  });
});
