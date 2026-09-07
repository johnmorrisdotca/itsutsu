import { describe, expect, it } from "vitest";
import {
  assess,
  isFatalMove,
  isSwapBlocked,
  newlyLost,
  suggestMove,
} from "./analysis";
import { fromDiagram } from "./gomoku.test-support";
import { STONES } from "./gomoku.constants";
import { playMove } from "./engine";

/** Black holds an open four: five is available at both ends at once. */
const OPEN_FOUR = `
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . x x x x . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
`;

/** Black holds a four with one end sealed. Exactly one point completes it. */
const CLOSED_FOUR = `
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . o x x x x . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
`;

/** Black holds an open three — forcing, but a single stone answers it. */
const OPEN_THREE = `
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . x x x . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
`;

const QUIET = `
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . x . . . .
  . . . . . . . . .
  . . . . o . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
`;

describe("assess", () => {
  it("calls a win that is one stone away winning, and decided", () => {
    const state = fromDiagram(OPEN_FOUR, { toPlay: STONES.black });
    const reading = assess(state);

    expect(reading.outlook.black).toBe("winning");
    expect(reading.outlook.white).toBe("lost");
    expect(reading.decided).toBe(true);
  });

  it("calls facing an open four lost, because one stone cannot block two ends", () => {
    const reading = assess(fromDiagram(OPEN_FOUR, { toPlay: STONES.white }));

    expect(reading.outlook.white).toBe("lost");
    expect(reading.decided).toBe(true);
    expect(reading.forcedPoints).toHaveLength(2);
  });

  it("calls a sealed four danger, and names the one point that answers it", () => {
    const reading = assess(fromDiagram(CLOSED_FOUR, { toPlay: STONES.white }));

    expect(reading.outlook.white).toBe("danger");
    expect(reading.decided).toBe(false);
    expect(reading.forcedPoints).toEqual([{ row: 4, col: 6 }]);
  });

  it("does not call a blockable open three a loss", () => {
    const reading = assess(fromDiagram(OPEN_THREE, { toPlay: STONES.white }));

    // Both extending points sit on one line, so a single stone kills both.
    expect(reading.outlook.white).toBe("danger");
    expect(reading.outlook.black).toBe("ahead");
    expect(reading.decided).toBe(false);
  });

  it("calls a quiet position even", () => {
    const reading = assess(fromDiagram(QUIET, { toPlay: STONES.black }));

    expect(reading.outlook.black).toBe("even");
    expect(reading.outlook.white).toBe("even");
    expect(reading.decided).toBe(false);
  });

  it("reads a finished game from its result, not from the stones", () => {
    const state = fromDiagram(CLOSED_FOUR, { toPlay: STONES.black });
    const won = playMove(state, { row: 4, col: 6 });
    const reading = assess(won);

    expect(won.winner).toBe(STONES.black);
    expect(reading.outlook.black).toBe("won");
    expect(reading.outlook.white).toBe("lost");
    expect(reading.decided).toBe(true);
  });
});

describe("isFatalMove", () => {
  it("flags the move that let an open four happen", () => {
    const before = assess(fromDiagram(OPEN_THREE, { toPlay: STONES.white }));
    // White ignores the three and plays in the corner; black extends it.
    const after = assess(fromDiagram(OPEN_FOUR, { toPlay: STONES.white }));

    expect(isFatalMove(before, after, STONES.white)).toBe(true);
  });

  it("does not flag a move that merely leaves the position sharp", () => {
    const before = assess(fromDiagram(QUIET, { toPlay: STONES.white }));
    const after = assess(fromDiagram(OPEN_THREE, { toPlay: STONES.white }));

    expect(isFatalMove(before, after, STONES.white)).toBe(false);
  });

  it("does not flag a position that was already lost", () => {
    const lost = assess(fromDiagram(OPEN_FOUR, { toPlay: STONES.white }));

    expect(isFatalMove(lost, lost, STONES.white)).toBe(false);
  });
});

describe("newlyLost", () => {
  it("names the side that just became lost", () => {
    const before = assess(fromDiagram(OPEN_THREE, { toPlay: STONES.white }));
    const after = assess(fromDiagram(OPEN_FOUR, { toPlay: STONES.white }));

    expect(newlyLost(before, after)).toBe(STONES.white);
  });

  it("names nobody while the game is still a game", () => {
    const before = assess(fromDiagram(QUIET, { toPlay: STONES.white }));
    const after = assess(fromDiagram(OPEN_THREE, { toPlay: STONES.white }));

    expect(newlyLost(before, after)).toBeNull();
  });

  it("names nobody when the position was already decided", () => {
    const lost = assess(fromDiagram(OPEN_FOUR, { toPlay: STONES.white }));
    expect(newlyLost(lost, lost)).toBeNull();
  });
});

describe("suggestMove", () => {
  it("takes the win when there is one", () => {
    const state = fromDiagram(CLOSED_FOUR, { toPlay: STONES.black });
    const suggestion = suggestMove(state);

    expect(suggestion?.reason).toBe("win");
    expect(suggestion?.point).toEqual({ row: 4, col: 6 });
  });

  it("blocks the opponent's five ahead of building its own shape", () => {
    const suggestion = suggestMove(fromDiagram(CLOSED_FOUR, { toPlay: STONES.white }));

    expect(suggestion?.reason).toBe("blockWin");
    expect(suggestion?.point).toEqual({ row: 4, col: 6 });
  });

  it("answers an open three rather than wandering off", () => {
    const suggestion = suggestMove(fromDiagram(OPEN_THREE, { toPlay: STONES.white }));

    // The answer is to occupy a point where black would otherwise build the
    // open four, which is why this reads as stopping a four rather than a three.
    expect(suggestion?.reason).toBe("blockOpenFour");
    expect([2, 6]).toContain(suggestion?.point.col);
    expect(suggestion?.point.row).toBe(4);
  });

  it("opens on tengen", () => {
    const state = fromDiagram(
      `
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
      `,
      { toPlay: STONES.black },
    );
    const suggestion = suggestMove(state);

    expect(suggestion?.reason).toBe("opening");
    expect(suggestion?.point).toEqual({ row: 4, col: 4 });
  });

  it("has nothing to say about a finished game", () => {
    const state = fromDiagram(CLOSED_FOUR, { toPlay: STONES.black });
    expect(suggestMove(playMove(state, { row: 4, col: 6 }))).toBeNull();
  });
});

describe("isSwapBlocked", () => {
  it("refuses a swap that would steal a decided game", () => {
    expect(isSwapBlocked(assess(fromDiagram(OPEN_FOUR, { toPlay: STONES.white })))).toBe(true);
  });

  it("allows a swap while the game is still unclear", () => {
    expect(isSwapBlocked(assess(fromDiagram(QUIET, { toPlay: STONES.black })))).toBe(false);
  });
});
