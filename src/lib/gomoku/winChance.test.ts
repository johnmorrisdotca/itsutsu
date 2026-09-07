import { describe, expect, it } from "vitest";
import { assess } from "./analysis";
import { winChance } from "./winChance";
import { fromDiagram } from "./gomoku.test-support";
import { STONES } from "./gomoku.constants";
import { playMove } from "./engine";

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

const EMPTY = `
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
`;

describe("winChance", () => {
  it("always splits a hundred points between the two colours", () => {
    for (const diagram of [OPEN_FOUR, CLOSED_FOUR, EMPTY]) {
      const state = fromDiagram(diagram, { toPlay: STONES.white });
      const chance = winChance(state);
      expect(chance.black + chance.white).toBe(100);
    }
  });

  it("gives an untouched board an even split", () => {
    const chance = winChance(fromDiagram(EMPTY, { toPlay: STONES.black }));
    expect(chance.black).toBeGreaterThan(40);
    expect(chance.black).toBeLessThan(60);
  });

  it("reports a finished game as settled", () => {
    const state = fromDiagram(CLOSED_FOUR, { toPlay: STONES.black });
    const won = playMove(state, { row: 4, col: 6 });

    expect(winChance(won).black).toBe(100);
    expect(winChance(won).white).toBe(0);
  });

  it("is nearly settled when a win cannot be prevented", () => {
    const chance = winChance(fromDiagram(OPEN_FOUR, { toPlay: STONES.white }));
    expect(chance.black).toBeGreaterThanOrEqual(95);
  });

  it("favours the side holding the threats", () => {
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
      { toPlay: STONES.white },
    );
    expect(winChance(state).black).toBeGreaterThan(55);
  });

  it("accepts an assessment that has already been computed", () => {
    const state = fromDiagram(OPEN_FOUR, { toPlay: STONES.white });
    expect(winChance(state, assess(state))).toEqual(winChance(state));
  });
});

describe("early warning", () => {
  it("names where the opponent could build a new open three", () => {
    // Black has two stones with room; white is told before the three exists.
    const state = fromDiagram(
      `
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . x x . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
      `,
      { toPlay: STONES.white },
    );
    const reading = assess(state);

    expect(reading.buildingPoints.length).toBeGreaterThan(0);
    // Nothing is forced yet — this is a warning, not an emergency.
    expect(reading.forcedPoints).toEqual([]);
    expect(reading.outlook.white).toBe("even");
  });

  it("has nothing to warn about on a quiet board", () => {
    expect(assess(fromDiagram(EMPTY, { toPlay: STONES.black })).buildingPoints)
      .toEqual([]);
  });
});
