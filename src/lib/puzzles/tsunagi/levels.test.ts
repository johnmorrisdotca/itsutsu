import { relettered, transformed } from "@johnmorrisdotca/tsunagi";
import { beforeAll, describe, expect, it } from "vitest";

import { checkSolution } from "../puzzleCheck";
import { PUZZLE_CODE_LONGEST, PUZZLE_SPECS } from "../puzzles.constants";
import { loadEveryTsunagiLevel, nextLevelLabel, TSUNAGI_LEVEL_COUNTS, TSUNAGI_SIZES, tsunagiBand, tsunagiLevelOf, tsunagiLevelsOf, tsunagiPuzzle } from "./levels";
import "./levelsModule";

/**
 * TSUNAGI'S LEVELS AS THE SITE TAKES THEM. Every level itself — proved to have
 * one answer, measured, marked — is proved in Tsunagi's own repository on
 * every build; what is held here is what the site adds: each level a puzzle
 * named by its number, a solve of it checked and paid, and every code short
 * enough for the routes that carry it.
 */
beforeAll(loadEveryTsunagiLevel, 120_000);

describe("each level, as a puzzle of the site", () => {
  it.each(TSUNAGI_SIZES.map((size) => [size]))("names each %i×%i level by its layout, files it in its third, and pays its one answer", (size) => {
    const count = TSUNAGI_LEVEL_COUNTS[size]!;
    const puzzle = tsunagiPuzzle(size, 12);
    expect(puzzle.seed).toBe(12);
    expect(tsunagiLevelOf(size, puzzle.givens)).toBe(12);
    expect(tsunagiBand(size, 1)).toBe("easy");
    expect(tsunagiBand(size, Math.ceil(count / 2))).toBe("medium");
    expect(tsunagiBand(size, count)).toBe("hard");
    for (const [givens, answer] of tsunagiLevelsOf(size)) expect(checkSolution("tsunagi", size, givens, answer)).toEqual({ ok: true });
  });

  it("refuses a board that is not one of the levels, and a layout that is no layout", () => {
    const [givens, answer] = tsunagiLevelsOf(5)[0]!;
    // A level mirrored (and its marbles lettered afresh) is a sound board, and no level: the levels hold no two boards that are each other turned or mirrored.
    expect(checkSolution("tsunagi", 5, relettered(transformed(givens, 5, 0, true)), answer)).toEqual({ ok: false, reason: "not one of the site's levels" });
    expect(checkSolution("tsunagi", 5, "nonsense", answer)).toEqual({ ok: false, reason: "the givens are not a Tsunagi layout" });
  });

  it.each(TSUNAGI_SIZES.map((size) => [size]))("fits every %i×%i level's layout and answer within what the solve and race routes accept", (size) => {
    // A walled 9×9 layout ran to 109 characters when the route took 81, and every solve of it was refused (2026-09-26).
    for (const [givens, answer] of tsunagiLevelsOf(size)) {
      for (const code of [givens, answer]) {
        expect(code.length, givens).toBeLessThanOrEqual(PUZZLE_SPECS.tsunagi.mostCells);
        expect(code.length, givens).toBeLessThanOrEqual(PUZZLE_CODE_LONGEST);
      }
    }
  });
});

describe("the button to the next level", () => {
  it("names the gap, and says the level after plainly when that is the gap", () => {
    // John's screenshot: level 10 solved on its own, and "Level 11 →" offered.
    expect(nextLevelLabel(10, 1)).toBe("Level 1, the first one you have not finished →");
    expect(nextLevelLabel(5, 3)).toBe("Level 3, the first one you have not finished →");
    expect(nextLevelLabel(3, 4)).toBe("Level 4 →");
  });
});
