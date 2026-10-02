import { MEIKYUU_MAZE_LEVELS, sizeOf } from "@johnmorrisdotca/meikyuu/levels";
import { solutionOf } from "@johnmorrisdotca/meikyuu";
import { beforeAll, describe, expect, it } from "vitest";

import { fixedLevelOf, nextLevelLabel } from "../fixedLevel";
import { puzzleAsked, puzzleQuery } from "../puzzleAddress";
import { checkSolution } from "../puzzleCheck";
import { PUZZLE_SPECS } from "../puzzles.constants";
import { MEIKYUU_LEVEL_COUNTS, isMeikyuuLevelAt, meikyuuBlockOf, meikyuuBlockRange, meikyuuBlocksIn, meikyuuLevelBand, meikyuuLevelCount } from "./levelCounts";
import { loadMeikyuuLevels, meikyuuLevelOfBoard, meikyuuLevelPuzzle, meikyuuLevelsAt } from "./levels";
import "./levelsModule";
import { meikyuuCodeFits, MEIKYUU_MOST_STEPS } from "./progress";
import { MEIKYUU_SIZES, MEIKYUU_SIZE_WORDS, isMeikyuuSize, meikyuuSizeLabel, meikyuuSizeOfWord, meikyuuSizeWord } from "./sizes";
import { decodeWay, encodeCells } from "./steps";
import { encodeWay, mazeOf } from "./way";

/*
 * MEIKYUU, the maze (`@johnmorrisdotca/meikyuu`): its levels on the site. The package holds its own list
 * to its rules (every level rebuilt, proved a perfect maze and solved by drawing); what is held here is the
 * site's side of it: the four sizes, the numbers an address reads without the list, the line as the site
 * keeps it, and the check the server runs.
 */
beforeAll(loadMeikyuuLevels);

describe("meikyuu's sizes are the package's words for how big a maze is", () => {
  it("are four, in the package's order, numbered from 1", () => {
    expect(MEIKYUU_SIZES).toEqual([1, 2, 3, 4]);
    expect(MEIKYUU_SIZE_WORDS).toEqual(["small", "medium", "large", "huge"]);
    expect(MEIKYUU_SIZE_WORDS.map(meikyuuSizeOfWord)).toEqual([1, 2, 3, 4]);
    expect(MEIKYUU_SIZES.map(meikyuuSizeWord)).toEqual([...MEIKYUU_SIZE_WORDS]);
    expect(meikyuuSizeLabel(3)).toBe("Large");
    expect(isMeikyuuSize(0)).toBe(false);
    expect(isMeikyuuSize(5)).toBe(false);
    expect(isMeikyuuSize(2.5)).toBe(false);
    expect(meikyuuSizeWord(9)).toBeNull();
  });

  it("have the levels the package's list has of each, which the address reads without the list", () => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const level of MEIKYUU_MAZE_LEVELS) counts[meikyuuSizeOfWord(sizeOf(level.cells))]! += 1;
    expect(MEIKYUU_LEVEL_COUNTS).toEqual(counts);
    for (const size of MEIKYUU_SIZES) {
      expect(meikyuuLevelCount(size)).toBe(counts[size]);
      expect(meikyuuLevelsAt(size)).toHaveLength(counts[size]!);
    }
    expect(Object.values(counts).reduce((total, count) => total + count, 0)).toBe(MEIKYUU_MAZE_LEVELS.length);
    expect(meikyuuLevelCount(5)).toBe(0);
  });

  it("keep the package's order inside a size, so no level is easier than the one before", () => {
    for (const size of MEIKYUU_SIZES) {
      const rows = meikyuuLevelsAt(size);
      rows.forEach((row, at) => {
        expect(MEIKYUU_SIZES.map((each) => meikyuuSizeWord(each)!)).toContain(sizeOf(row.cells));
        if (at > 0) {
          expect(row.number, `size ${size} level ${at + 1}`).toBeGreaterThan(rows[at - 1]!.number);
          expect(row.effort).toBeGreaterThanOrEqual(rows[at - 1]!.effort);
        }
      });
    }
  });
});

describe("meikyuu's levels as numbers and thirds", () => {
  it("know which levels a size has, and which third a level sits in", () => {
    expect(isMeikyuuLevelAt(1, 1)).toBe(true);
    expect(isMeikyuuLevelAt(1, 217)).toBe(true);
    expect(isMeikyuuLevelAt(1, 218)).toBe(false);
    expect(isMeikyuuLevelAt(1, 0)).toBe(false);
    expect(isMeikyuuLevelAt(5, 1)).toBe(false);
    for (const size of MEIKYUU_SIZES) {
      const count = meikyuuLevelCount(size);
      expect(meikyuuLevelBand(size, 1)).toBe("easy");
      expect(meikyuuLevelBand(size, Math.ceil(count / 2))).toBe("medium");
      expect(meikyuuLevelBand(size, count)).toBe("hard");
    }
  });

  it("make blocks of sixteen, the last ending at the count", () => {
    expect(meikyuuBlocksIn(217)).toBe(14);
    expect(meikyuuBlockOf(1)).toBe(1);
    expect(meikyuuBlockOf(16)).toBe(1);
    expect(meikyuuBlockOf(17)).toBe(2);
    expect(meikyuuBlockRange(1, 217)).toEqual({ first: 1, last: 16 });
    expect(meikyuuBlockRange(14, 217)).toEqual({ first: 209, last: 217 });
  });

  it("are asked for by the seed, which is the level's number in its size, and the address keeps it", () => {
    expect(fixedLevelOf("meikyuu", 12)).toBe(12);
    expect(fixedLevelOf("meikyuu", 0)).toBeNull();
    const asked = puzzleAsked("meikyuu", { size: "3", seed: "200" });
    expect(asked).toMatchObject({ size: 3, seed: 200, level: meikyuuLevelBand(3, 200), clock: "none" });
    expect(puzzleQuery(asked)).toBe(`?size=3&level=${meikyuuLevelBand(3, 200)}&seed=200`);
    // A number past the size's levels asks for nothing, and an unknown size is the first.
    expect(puzzleAsked("meikyuu", { size: "1", seed: "218" }).seed).toBeNull();
    expect(puzzleAsked("meikyuu", { size: "7", seed: "3" })).toMatchObject({ size: 1, seed: 3 });
    expect(nextLevelLabel(3, 4)).toBe("Level 4 →");
  });
});

describe("meikyuu's line", () => {
  it("is written a step to a character, and read back against the maze it was drawn through", () => {
    const maze = mazeOf(meikyuuLevelsAt(1)[0]!.code)!;
    const cells = solutionOf(maze);
    const code = encodeCells(maze, cells)!;
    expect(code).toHaveLength(cells.length - 1);
    expect(decodeWay(maze, code)).toEqual(cells);
    // A prefix is a line kept half way.
    expect(decodeWay(maze, code.slice(0, 2))).toEqual(cells.slice(0, 3));
    expect(decodeWay(maze, "")).toEqual([maze.start]);
  });

  it("is refused when it is not a way through: a step into a wall, off the maze, back onto the line, or not a character", () => {
    const maze = mazeOf(meikyuuLevelsAt(1)[0]!.code)!;
    const code = encodeCells(maze, solutionOf(maze))!;
    expect(decodeWay(maze, "z")).toBeNull();
    expect(decodeWay(maze, `${code}${code[0]!}`)).toBeNull();
    expect(decodeWay(maze, "A")).toBeNull();
    expect(decodeWay(maze, "1 2")).toBeNull();
    expect(meikyuuCodeFits("0a9z")).toBe(true);
    expect(meikyuuCodeFits("0A")).toBe(false);
    expect(meikyuuCodeFits("0".repeat(MEIKYUU_MOST_STEPS + 1))).toBe(false);
  });

  it("fits in a character a step at every cell of every level", () => {
    for (const level of MEIKYUU_MAZE_LEVELS) {
      const maze = mazeOf(level.code)!;
      for (const neighbours of maze.grid.neighbours) expect(neighbours.length, level.code).toBeLessThanOrEqual(36);
    }
  });
});

describe("meikyuu's levels are puzzles, each answered by its one way through", () => {
  it("makes a puzzle of every level whose answer the server's check passes, and no other line", () => {
    let longest = 0;
    for (const size of MEIKYUU_SIZES) {
      const spec = PUZZLE_SPECS.meikyuu;
      meikyuuLevelsAt(size).forEach((row, at) => {
        const puzzle = meikyuuLevelPuzzle(size, at + 1);
        expect(puzzle).toMatchObject({ kind: "meikyuu", size, seed: at + 1, givens: row.code, level: meikyuuLevelBand(size, at + 1) });
        expect(puzzle.givens.length).toBeLessThanOrEqual(spec.mostCells);
        expect(puzzle.solution.length).toBeLessThanOrEqual(MEIKYUU_MOST_STEPS);
        expect(checkSolution("meikyuu", size, puzzle.givens, puzzle.solution, puzzle.level), row.code).toEqual({ ok: true });
        // A line one step short never reaches the goal, and the same line twice over is no way through.
        expect(checkSolution("meikyuu", size, puzzle.givens, puzzle.solution.slice(0, -1), puzzle.level).ok, row.code).toBe(false);
        expect(checkSolution("meikyuu", size, puzzle.givens, puzzle.solution + puzzle.solution, puzzle.level).ok, row.code).toBe(false);
        longest = Math.max(longest, puzzle.solution.length);
        expect(meikyuuLevelOfBoard(size, row.code)).toBe(at + 1);
        expect(encodeWay(row.code)).toBe(puzzle.solution);
      });
    }
    // The room the routes allow is what the longest way needs, with a little to spare.
    expect(longest).toBeLessThanOrEqual(MEIKYUU_MOST_STEPS);
    expect(PUZZLE_SPECS.meikyuu.mostCells).toBeGreaterThanOrEqual(longest);
  });

  it("holds the maze to a level of its size: a maze of another size, or none, is refused", () => {
    const small = meikyuuLevelPuzzle(1, 1);
    expect(checkSolution("meikyuu", 2, small.givens, small.solution, small.level).ok).toBe(false);
    expect(checkSolution("meikyuu", 1, "square:3x3:prim:enter-leave:1", small.solution, small.level).ok).toBe(false);
    expect(checkSolution("meikyuu", 1, "not a maze", small.solution, small.level).ok).toBe(false);
    expect(meikyuuLevelOfBoard(1, "not a maze")).toBeNull();
  });

  it("is read as the first level when an address names none", () => {
    expect(meikyuuLevelPuzzle(2, 99999).seed).toBe(1);
  });
});
