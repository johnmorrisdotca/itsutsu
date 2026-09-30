import { cubeSolved, decodeCubeMoves, encodeCubeMoves, parseMoves, turnAll } from "kyuubu";
import { describe, expect, it } from "vitest";

import { checkSolution, checkOutOfGuesses } from "../puzzleCheck";
import { progressFits } from "../puzzleProgress";

import { checkCube } from "./check";
import { CUBE_SIZES, SCRAMBLE_LENGTHS, cubeOfSeed, generateCube, scrambleOf } from "./generate";

describe("a cube made from a seed", () => {
  it.each(CUBE_SIZES)("is scrambled as far as its level says, the same every time, on the %i×%i", (size) => {
    for (const level of ["easy", "medium", "hard"] as const) {
      const cube = generateCube(size, level, 11);
      expect(cube).toEqual(generateCube(size, level, 11));
      expect(scrambleOf(size, level, 11).length).toBeGreaterThanOrEqual(SCRAMBLE_LENGTHS[level][size]);
      expect(cubeSolved(cube.givens, size)).toBe(false);
      expect(cube.givens).toBe(cubeOfSeed(size, level, 11));
      expect(checkSolution("cube", size, cube.givens, cube.solution, level)).toEqual({ ok: true });
    }
  });

  it("is another cube from another seed", () => {
    expect(generateCube(3, "hard", 1).givens).not.toBe(generateCube(3, "hard", 2).givens);
  });
});

describe("the check the server runs on a cube", () => {
  const cube = generateCube(3, "medium", 5);

  it("takes any way to solved, not only the scramble taken back", () => {
    // A turn undone on the way and a look round at the end change nothing: it is still solved.
    const wandering = `${encodeCubeMoves(parseMoves("R R'", 3)!)}${cube.solution}${encodeCubeMoves(parseMoves("x y'", 3)!)}`;
    expect(checkCube(3, cube.givens, wandering)).toEqual({ ok: true });
  });

  it("refuses a cube not solved, a move the cube does not have, and no moves at all", () => {
    const short = cube.solution.slice(0, -3);
    expect(checkCube(3, cube.givens, short).ok).toBe(false);
    expect(checkCube(3, cube.givens, "x53").ok).toBe(false);
    expect(checkCube(3, cube.givens, "").ok).toBe(false);
    expect(checkCube(6, cube.givens, cube.solution).ok).toBe(false);
  });

  it("takes a cube given up only when it was turned and is not solved", () => {
    const some = cube.solution.slice(0, 6);
    expect(checkOutOfGuesses("cube", 3, cube.givens, some, "medium")).toEqual({ ok: true });
    expect(checkOutOfGuesses("cube", 3, cube.givens, cube.solution, "medium").ok).toBe(false);
    expect(checkOutOfGuesses("cube", 3, cube.givens, "", "medium").ok).toBe(false);
  });

  it("keeps a half-turned cube's turns, and nothing that is not turns", () => {
    expect(progressFits("cube", 3, cube.solution.slice(0, 9))).toBe(true);
    expect(progressFits("cube", 3, "not turns")).toBe(false);
    expect(turnAll(cube.givens, 3, decodeCubeMoves(cube.solution)!)).toMatch(/^U{9}R{9}F{9}D{9}L{9}B{9}$/);
  });
});
