import { cubeSolved, decodeCubeMoves, encodeCubeMoves, parseMoves, turnAll } from "@johnmorrisdotca/kyuubu";
import { describe, expect, it } from "vitest";

import { checkSolution, checkOutOfGuesses } from "../puzzleCheck";
import { decodeCubeProgress, encodeCubeProgress, progressFits } from "../puzzleProgress";

import { CUBE_MOVES_MOST, checkCube } from "./check";
import { CUBE_SIZES, SCRAMBLE_LENGTHS, cubeOfSeed, generateCube, scrambleOf } from "./generate";
import { cpuNow } from "@/lib/testing/cpuTime";

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

describe("the biggest cubes, 6×6 and 7×7", () => {
  it("are scrambled a competition's length on hard, and a first solve of seven thousand turns is checked in a moment", () => {
    expect(SCRAMBLE_LENGTHS.hard[6]).toBe(80);
    expect(SCRAMBLE_LENGTHS.hard[7]).toBe(100);
    const cube = generateCube(7, "hard", 3);
    expect(cube.givens).toHaveLength(6 * 49);
    // A long way round: seven thousand turns wandering and back, then the scramble taken back. Three characters a turn.
    const wandering = encodeCubeMoves(parseMoves("3R 3R' 2U 2U' ".repeat(1750), 7)!);
    const answer = `${wandering}${cube.solution}`;
    expect(answer.length).toBeGreaterThan(21_000);
    expect(answer.length).toBeLessThanOrEqual(CUBE_MOVES_MOST);
    const started = cpuNow();
    expect(checkCube(7, cube.givens, answer)).toEqual({ ok: true });
    expect(cpuNow() - started).toBeLessThan(2000);
    expect(progressFits("cube", 7, answer)).toBe(true);
    // And one turn too many to be kept is refused.
    expect(checkCube(7, cube.givens, `${answer}${"x01".repeat(Math.ceil((CUBE_MOVES_MOST - answer.length) / 3) + 1)}`).ok).toBe(false);
  });

  it("turn every layer they have, and refuse one they do not", () => {
    for (const size of [6, 7]) {
      const cube = generateCube(size, "easy", 9);
      expect(checkCube(size, cube.givens, `x${size}1`).ok).toBe(false);
      expect(turnAll(cube.givens, size, decodeCubeMoves(cube.solution)!)).toMatch(new RegExp(`^U{${size * size}}R{${size * size}}F{${size * size}}D{${size * size}}L{${size * size}}B{${size * size}}$`));
    }
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

  it("keeps whether its steps were shown, so a run opened again is still a helped one", () => {
    const moves = decodeCubeMoves(cube.solution.slice(0, 9))!;
    const guided = encodeCubeProgress(moves, true);
    expect(progressFits("cube", 3, guided)).toBe(true);
    expect(decodeCubeProgress(guided)).toEqual({ moves, guided: true });
    expect(decodeCubeProgress(encodeCubeProgress(moves))).toEqual({ moves, guided: false });
    expect(decodeCubeProgress("guided:not turns")).toBeNull();
  });
});
