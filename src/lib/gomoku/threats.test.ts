import { describe, expect, it } from "vitest";
import { fromDiagram, show } from "./gomoku.test-support";
import { scanThreats, threatAt } from "./threats";
import { STONES } from "./gomoku.constants";
import type { Point } from "./gomoku.types";

const p = (row: number, col: number): Point => ({ row, col });

/** Two loose black stones with room to grow in every direction. */
const PAIR = `
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . x x . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
`;

describe("threatAt", () => {
  it("sees nothing forcing in a quiet corner", () => {
    const state = fromDiagram(PAIR, { toPlay: STONES.black });
    expect(threatAt(state.board, state.settings, STONES.black, p(0, 8)).kind)
      .toBeNull();
  });

  it("calls a stone that makes an open three an open three", () => {
    const state = fromDiagram(PAIR, { toPlay: STONES.black });
    const threat = threatAt(state.board, state.settings, STONES.black, p(4, 5));

    expect(threat.kind).toBe("openThree");
    // Both ends extend the same line, so this is one threat, not two.
    expect(threat.openThreeDirections).toBe(1);
  });

  it("counts an open three once even though either end completes it", () => {
    const state = fromDiagram(PAIR, { toPlay: STONES.black });
    for (const point of [p(4, 2), p(4, 5)]) {
      expect(threatAt(state.board, state.settings, STONES.black, point).kind)
        .toBe("openThree");
    }
  });

  it("calls a four with two open ends an open four", () => {
    const state = fromDiagram(
      `
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . x x x . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
      `,
      { toPlay: STONES.black },
    );
    const threat = threatAt(state.board, state.settings, STONES.black, p(4, 2));

    expect(threat.kind).toBe("openFour");
    expect(threat.fiveCompletions).toBe(2);
  });

  it("calls a four with one end sealed a plain four", () => {
    const state = fromDiagram(
      `
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . o x x x . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
      `,
      { toPlay: STONES.black },
    );
    const threat = threatAt(state.board, state.settings, STONES.black, p(4, 5));

    expect(threat.kind).toBe("four");
    expect(threat.fiveCompletions).toBe(1);
  });

  it("spots a double three across two lines", () => {
    const state = fromDiagram(
      `
        . . . . . . . . .
        . . . . . . . . .
        . . . . . x . . .
        . . . . . x . . .
        . . . x x . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
      `,
      { toPlay: STONES.black },
    );
    const threat = threatAt(state.board, state.settings, STONES.black, p(4, 5));

    expect(threat.kind).toBe("doubleThreat");
    expect(threat.openThreeDirections).toBe(2);
  });

  it("spots a four and a three at once", () => {
    const state = fromDiagram(
      `
        . . . . . . . . .
        . . . . . . . . .
        . . . . . x . . .
        . . . . . x . . .
        . o x x x . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
      `,
      { toPlay: STONES.black },
    );
    const threat = threatAt(state.board, state.settings, STONES.black, p(4, 5));

    expect(threat.kind).toBe("doubleThreat");
    expect(threat.fiveCompletions).toBe(1);
    expect(threat.openThreeDirections).toBe(1);
  });

  it("ignores an occupied intersection", () => {
    const state = fromDiagram(PAIR, { toPlay: STONES.black });
    expect(threatAt(state.board, state.settings, STONES.black, p(4, 3)).kind)
      .toBeNull();
  });

  it("does not count a line the opponent has already broken", () => {
    const state = fromDiagram(
      `
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        o x x x o . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
      `,
      { toPlay: STONES.black },
    );
    // The row is sealed at both ends, so nothing on it can reach five.
    expect(threatAt(state.board, state.settings, STONES.black, p(3, 4)).kind)
      .not.toBe("openFour");
  });
});

describe("scanThreats", () => {
  it("lists the two points that complete an open four", () => {
    const state = fromDiagram(
      `
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . x x x x . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
      `,
      { toPlay: STONES.black },
    );
    const report = scanThreats(state, STONES.black);

    expect(show(report.five)).toEqual(["4,1", "4,6"]);
  });

  it("reports nothing for a colour with no stones on the board", () => {
    const state = fromDiagram(PAIR, { toPlay: STONES.white });
    const report = scanThreats(state, STONES.white);

    expect(report.five).toEqual([]);
    expect(report.openFour).toEqual([]);
    expect(report.doubleThreat).toEqual([]);
  });
});
