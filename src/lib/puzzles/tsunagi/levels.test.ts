import { relettered, transformed } from "@johnmorrisdotca/tsunagi";
import { beforeAll, describe, expect, it } from "vitest";

import { checkSolution } from "../puzzleCheck";
import { PUZZLE_CODE_LONGEST, PUZZLE_SPECS } from "../puzzles.constants";
import { isTsunagiLevel, levelSeed, loadEveryTsunagiLevel, nextLevelLabel, setOfSeed, TSUNAGI_LEVEL_COUNTS, TSUNAGI_PORTAL_COUNTS, TSUNAGI_PORTAL_SEED, TSUNAGI_PORTAL_SIZES, TSUNAGI_SIZES, tsunagiBand, tsunagiLevelOf, tsunagiLevelsOf, tsunagiPuzzle } from "./levels";
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

describe("the levels with portals, as puzzles of the site", () => {
  it.each(TSUNAGI_PORTAL_SIZES.map((size) => [size]))("keeps each %i×%i portal level by a seed past every level of the first set, and pays its one answer", (size) => {
    const count = TSUNAGI_PORTAL_COUNTS[size]!;
    const seed = levelSeed("portals", 12);
    expect(seed).toBe(TSUNAGI_PORTAL_SEED + 12);
    expect(setOfSeed(seed)).toEqual({ set: "portals", level: 12 });
    expect(Math.max(...Object.values(TSUNAGI_LEVEL_COUNTS))).toBeLessThan(TSUNAGI_PORTAL_SEED);
    expect(isTsunagiLevel(size, seed)).toBe(true);
    expect(isTsunagiLevel(size, levelSeed("portals", count + 1))).toBe(false);
    expect(isTsunagiLevel(size, TSUNAGI_PORTAL_SEED)).toBe(false);
    const puzzle = tsunagiPuzzle(size, seed);
    expect(puzzle.seed).toBe(seed);
    expect(puzzle.givens).toContain("|portals");
    expect(tsunagiLevelOf(size, puzzle.givens)).toBe(seed);
    expect(tsunagiBand(size, levelSeed("portals", 1))).toBe("easy");
    expect(tsunagiBand(size, levelSeed("portals", count))).toBe("hard");
    for (const [givens, answer] of tsunagiLevelsOf(size, "portals")) expect(checkSolution("tsunagi", size, givens, answer)).toEqual({ ok: true });
  });

  it("names a level of the first set by its own number, and a seed that names no level as the first level", () => {
    expect(tsunagiLevelOf(5, tsunagiPuzzle(5, 3).givens)).toBe(3);
    expect(tsunagiPuzzle(5, 99999).seed).toBe(1);
    expect(isTsunagiLevel(5, 0)).toBe(false);
  });
});
