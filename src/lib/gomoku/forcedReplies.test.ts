import { describe, expect, it } from "vitest";

import { createGame } from "./engine";
import { RULE_VARIANTS } from "./gomoku.constants";
import { findsForcedWins } from "./forcedWin";
import { forcedReplies } from "./forcedReplies";
import { position } from "./threatWin.test-support";

const at = (points: Array<{ row: number; col: number }> | null) =>
  points === null ? null : points.map((point) => `${point.row},${point.col}`).sort();

describe("the only moves worth reading when a threat is on the board", () => {
  it("says nothing is forced in a quiet position", () => {
    const state = position([[7, 7], [9, 9]], [[0, 0], [14, 14]]);
    expect(forcedReplies(state)).toBeNull();
  });

  it("offers the five when there is one to make", () => {
    // Black to move with four in a row and room at one end.
    const state = position([[7, 3], [7, 4], [7, 5], [7, 6]], [[7, 2], [0, 0], [0, 14], [14, 0]]);
    expect(at(forcedReplies(state))).toEqual(["7,7"]);
  });

  it("offers only the block when the other side has a five to make", () => {
    // Black to move; white has four in a row on row 0 with room at the right end only.
    const state = position([[7, 7], [9, 9], [11, 11], [0, 5]], [[0, 1], [0, 2], [0, 3], [0, 4]]);
    expect(at(forcedReplies(state))).toEqual(["0,0"]);
  });

  it("answers an open three with the points that stop it, and its own fours", () => {
    // Black to move; white has an open three on row 3. Black has three in a row on row 10 with room.
    const state = position([[10, 5], [10, 6], [10, 7], [14, 14]], [[3, 5], [3, 6], [3, 7], [0, 0]]);
    const replies = at(forcedReplies(state)) ?? [];
    // The ends of the three, which stop it becoming open…
    expect(replies).toEqual(expect.arrayContaining(["3,4", "3,8"]));
    // …and black's own fours, which white must answer first.
    expect(replies).toEqual(expect.arrayContaining(["10,4", "10,8"]));
    // Nothing that ignores the threat.
    expect(replies).not.toContain("7,7");
  });

  it("reads nothing into a board whose edges join, where a line is not a straight count", () => {
    expect(findsForcedWins(createGame({ variant: RULE_VARIANTS.toroidalFive, size: 15 } as never))).toBe(false);
    expect(forcedReplies(createGame({ variant: RULE_VARIANTS.toroidalFive, size: 15 } as never))).toBeNull();
  });
});
