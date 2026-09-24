import { describe, expect, it } from "vitest";

import { XP_EVENTS } from "./xp.constants";
import { puzzleAwards, puzzleSubject } from "./xpPuzzle";

describe("what a solved puzzle pays", () => {
  it("pays the solve, a first of the puzzle, and a first of the Numbers family, in that order", () => {
    const awards = puzzleAwards("numberPlace", 4, "1..4.3..2.1..4.3");
    expect(awards.map((award) => award.type)).toEqual([
      XP_EVENTS.puzzleSolved,
      XP_EVENTS.firstOfVariant,
      XP_EVENTS.firstOfFamily,
    ]);
    expect(awards[1].subject).toBe("numberPlace");
    expect(awards[2].subject).toBe("numbers");
  });

  it("keys the solve on the grid, so the same puzzle pays once and another pays again", () => {
    const one = puzzleSubject("numberPlace", 4, "1..4.3..2.1..4.3");
    expect(one).toMatch(/^numberPlace:4:[0-9a-f]{8}$/);
    expect(puzzleSubject("numberPlace", 4, "1..4.3..2.1..4.3")).toBe(one);
    expect(puzzleSubject("numberPlace", 4, "4..1.3..2.1..4.3")).not.toBe(one);
  });

  it("never pays a win: there is nobody to beat", () => {
    const types = puzzleAwards("numberPlace", 9, ".".repeat(81)).map((award) => award.type);
    expect(types).not.toContain(XP_EVENTS.gameWon);
    expect(types).not.toContain(XP_EVENTS.firstWinAtVariant);
  });
});
