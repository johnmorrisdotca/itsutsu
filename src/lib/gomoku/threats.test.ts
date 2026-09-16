import { describe, expect, it } from "vitest";
import { createGame, isLegalMove } from "./engine";
import { fromDiagram, show } from "./gomoku.test-support";
import { applyTurn } from "./opponentTurns";
import { candidatePoints, scanThreats, threatAt } from "./threats";
import { RULE_VARIANTS, STONES } from "./gomoku.constants";
import type { GameState, Point } from "./gomoku.types";

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

/**
 * THE LIST OF POINTS WORTH LOOKING AT, CHECKED AGAINST THE RULE RATHER THAN
 * THE CODE.
 *
 * `candidatePoints` was rewritten for speed — it stamps each stone's
 * neighbourhood into a flag array instead of asking every empty point about
 * every stone — and speed is the only thing that was meant to change. Two
 * things about its answer are relied on elsewhere and both are pinned here:
 *
 * - WHICH points come back. Empty, within two of a stone by the Chebyshev
 *   distance; on an untouched board, the centre alone.
 * - WHAT ORDER they come back in. Board index order, which is how the search's
 *   candidate ordering breaks a tie between two points worth the same, and
 *   therefore which move the computer plays. The rule restated below emits them
 *   in that order for the comparison to mean anything.
 */
describe("candidatePoints", () => {
  /** The rule as prose: every empty point within two of a stone, in index order. */
  function byTheRule(state: GameState): Point[] {
    const { size } = state.settings;
    const stones: Point[] = [];
    state.board.forEach((cell, index) => {
      if (cell === STONES.black || cell === STONES.white) {
        stones.push({ row: Math.floor(index / size), col: index % size });
      }
    });
    if (stones.length === 0) {
      const middle = Math.floor(size / 2);
      const centre = { row: middle, col: middle };
      return state.board[centre.row * size + centre.col] === null ? [centre] : [];
    }
    const out: Point[] = [];
    state.board.forEach((cell, index) => {
      if (cell !== null) return;
      const point = { row: Math.floor(index / size), col: index % size };
      const close = stones.some(
        (stone) =>
          Math.max(Math.abs(stone.row - point.row), Math.abs(stone.col - point.col)) <= 2,
      );
      if (close) out.push(point);
    });
    return out;
  }

  const asText = (points: readonly Point[]) =>
    points.map((one) => `${one.row},${one.col}`).join(" ");

  it("offers the centre and nothing else on an untouched board", () => {
    const empty = createGame({ variant: RULE_VARIANTS.freestyle, size: 15 }, 0);
    expect(candidatePoints(empty)).toEqual([{ row: 7, col: 7 }]);
    expect(asText(candidatePoints(empty))).toBe(asText(byTheRule(empty)));
  });

  it("is the same set in the same order as the rule, on every shape of board", () => {
    let compared = 0;
    let withObstacles = 0;
    // `obstacleFive` scatters dead and hot squares from the game's seed, which
    // is the only way this sweep meets a board where a cell is neither a stone
    // nor a place to play.
    for (const size of [9, 13, 15, 19]) {
      for (const variant of [
        RULE_VARIANTS.freestyle,
        RULE_VARIANTS.renju,
        RULE_VARIANTS.connect6,
        RULE_VARIANTS.obstacleFive,
      ]) {
        let seed = size * 131 + variant.length;
        const next = () => {
          seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
          return seed / 4_294_967_296;
        };
        let state = createGame({ variant, size }, next());
        const littered = state.board.some(
          (cell) => cell !== null && cell !== STONES.black && cell !== STONES.white,
        );
        if (littered) withObstacles += 1;
        for (let played = 0; played < 24; played += 1) {
          expect(asText(candidatePoints(state))).toBe(asText(byTheRule(state)));
          compared += 1;
          const legal = candidatePoints(state).filter((point) => isLegalMove(state, point));
          if (legal.length === 0) break;
          const point = legal[Math.floor(next() * legal.length)];
          const after = applyTurn(state, { kind: "place", row: point.row, col: point.col });
          if (after === state) break;
          state = after;
        }
      }
    }
    expect(compared).toBeGreaterThan(200);
    // A board carrying obstacles is the case where "not a stone" and "not
    // empty" come apart, and a sweep that never met one would not have tested it.
    expect(withObstacles).toBeGreaterThan(0);
  });

  it("counts an obstacle as neither a stone to be near nor a point to play", () => {
    /*
     * An obstacle is not a stone, so it draws no neighbourhood of its own; and
     * it is not empty, so it is never offered. A version reading "anything on
     * the board" for either half would fail one of these.
     */
    const state = fromDiagram(
      `
        . . . . . . .
        . . . . . . .
        . . # . . . .
        . . . x . . .
        . . . . . . .
        . . . . . . .
        . . . . . . .
      `,
      { toPlay: STONES.white },
    );
    const offered = candidatePoints(state);
    expect(asText(offered)).toBe(asText(byTheRule(state)));
    // The obstacle itself, and a point near only the obstacle.
    expect(offered.some((one) => one.row === 2 && one.col === 2)).toBe(false);
    expect(offered.some((one) => one.row === 0 && one.col === 0)).toBe(false);
    // Within two of the stone, so offered.
    expect(offered.some((one) => one.row === 5 && one.col === 5)).toBe(true);
  });
});
