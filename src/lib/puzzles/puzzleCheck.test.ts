import { describe, expect, it } from "vitest";

import { generateNumberPlace } from "./numberPlace/generate";
import { checkSolution } from "./puzzleCheck";
import { decodeCells, encodeCells, puzzleHash } from "./puzzleCode";
import { isSeed, seededRandom, shuffled } from "./random";

/**
 * The one check the server runs: a right grid says yes, and every way of
 * being wrong says no with its reason. Enumerated, because a check that
 * only ever sees right grids in its tests is a check nobody has seen refuse.
 */
describe("checking a Number Place answer", () => {
  const puzzle = generateNumberPlace(4, "easy", 3);
  const solution = decodeCells(puzzle.solution, 4)!;

  it("accepts the answer the generator made", () => {
    expect(checkSolution("numberPlace", 4, puzzle.givens, puzzle.solution)).toEqual({ ok: true });
  });

  it("refuses an answer with a hole", () => {
    const holed = [...solution];
    holed[5] = 0;
    expect(checkSolution("numberPlace", 4, puzzle.givens, encodeCells(holed)).ok).toBe(false);
  });

  it("refuses an answer that moved a given", () => {
    const givens = decodeCells(puzzle.givens, 4)!;
    const at = givens.findIndex((value) => value !== 0);
    const other = givens.findIndex((value, index) => value !== 0 && index !== at);
    // Swap two givens' values: still a permutation somewhere, no longer the puzzle asked.
    const moved = [...solution];
    [moved[at], moved[other]] = [moved[other], moved[at]];
    const verdict = checkSolution("numberPlace", 4, puzzle.givens, encodeCells(moved));
    expect(verdict.ok).toBe(false);
  });

  it("refuses a repeated number in a row, a column or a box", () => {
    const repeated = [...solution];
    repeated[0] = repeated[1];
    const verdict = checkSolution("numberPlace", 4, puzzle.givens, encodeCells(repeated));
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toMatch(/repeats|given/);
  });

  it("refuses a grid of the wrong size, a value past the side and a stray character", () => {
    expect(checkSolution("numberPlace", 4, puzzle.givens, puzzle.solution.slice(1)).ok).toBe(false);
    expect(checkSolution("numberPlace", 4, puzzle.givens, puzzle.solution.replace(/1/, "5")).ok).toBe(false);
    expect(checkSolution("numberPlace", 4, puzzle.givens, puzzle.solution.replace(/1/, "x")).ok).toBe(false);
    expect(checkSolution("numberPlace", 5, puzzle.givens, puzzle.solution).ok).toBe(false);
  });
});

describe("the puzzle code", () => {
  it("round-trips a grid and refuses what is not one", () => {
    expect(decodeCells(encodeCells([0, 2, 1, 0]), 2)).toEqual([0, 2, 1, 0]);
    expect(decodeCells(".21.", 2)).toEqual([0, 2, 1, 0]);
    expect(decodeCells(".21", 2)).toBeNull();
    expect(decodeCells(".23.", 2)).toBeNull();
    expect(decodeCells("a21.", 2)).toBeNull();
  });

  it("fingerprints the givens the same way every time, and differently for different givens", () => {
    expect(puzzleHash(".21.")).toBe(puzzleHash(".21."));
    expect(puzzleHash(".21.")).toMatch(/^[0-9a-f]{8}$/);
    expect(puzzleHash(".21.")).not.toBe(puzzleHash("1.2."));
  });
});

describe("the seeded random", () => {
  it("repeats for one seed and differs for another", () => {
    const a = seededRandom(9);
    const b = seededRandom(9);
    const c = seededRandom(10);
    const run = (r: () => number) => Array.from({ length: 5 }, r);
    expect(run(a)).toEqual(run(b));
    expect(run(seededRandom(9))).not.toEqual(run(c));
  });

  it("shuffles a copy, keeping every item once", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffled(items, seededRandom(4));
    expect(out).not.toBe(items);
    expect([...out].sort()).toEqual(items);
  });

  it("knows a seed from a number that is not one", () => {
    expect(isSeed(1)).toBe(true);
    expect(isSeed(0)).toBe(false);
    expect(isSeed(1.5)).toBe(false);
    expect(isSeed(2 ** 31)).toBe(false);
    expect(isSeed("7")).toBe(false);
  });
});
