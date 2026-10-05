import { bandOf, MEIKYUU_LEVELS_PER_SIZE, MEIKYUU_MAZE_LEVELS, sizeOf } from "@johnmorrisdotca/meikyuu/levels";
import { MEIKYUU_LEGACY_MAZE_LEVELS, legacyLevelOfCode } from "@johnmorrisdotca/meikyuu/levels/legacy";
import { COLOSSAL_TALL_HEIGHT, COLOSSAL_TALL_WIDTH, MEIKYUU_COLOSSAL_LEVELS, MEIKYUU_COLOSSAL_PER_LIST, MEIKYUU_COLOSSAL_TALL_LEVELS } from "@johnmorrisdotca/meikyuu/levels/colossal";
import { MEIKYUU_TALL_LEVELS, MEIKYUU_TALL_PER_SIZE, MEIKYUU_TALL_SIZES as PACKAGE_TALL_SIZES, TALL_RATIO } from "@johnmorrisdotca/meikyuu/levels/tall";
import { solutionOf } from "@johnmorrisdotca/meikyuu";
import { beforeAll, describe, expect, it } from "vitest";

import { fixedLevelOf, nextLevelLabel } from "../fixedLevel";
import { puzzleAsked, puzzleQuery } from "../puzzleAddress";
import { checkSolution } from "../puzzleCheck";
import { PUZZLE_CODE_LONGEST, PUZZLE_SPECS } from "../puzzles.constants";
import { MEIKYUU_COLOSSAL_LEVELS_A_SIZE, MEIKYUU_LEVEL_COUNTS, MEIKYUU_LEVELS_A_SIZE, isMeikyuuLevelAt, meikyuuBlockOf, meikyuuBlockRange, meikyuuBlocksIn, meikyuuLevelBand, meikyuuLevelCount } from "./levelCounts";
import { loadEveryMeikyuuLevels, meikyuuLevelOfBoard, meikyuuLevelPuzzle, meikyuuLevelsAt } from "./levels";
import "./levelsModule";
import { meikyuuCodeFits, MEIKYUU_MOST_STEPS } from "./progress";
import { isMeikyuuColossal, MEIKYUU_COLOSSAL_SIZE, MEIKYUU_COLOSSAL_SIZES, MEIKYUU_COLOSSAL_TALL_SIZE, MEIKYUU_EVERY_SIZE, MEIKYUU_SIZES, MEIKYUU_SIZE_WORDS, MEIKYUU_TALL_RATIO, MEIKYUU_TALL_SIZES, isMeikyuuSize, isMeikyuuTall, meikyuuSizeFromAddress, meikyuuSizeInAddress, meikyuuSizeInWords, meikyuuSizeLabel, meikyuuSizeOfWord, meikyuuSizeWord, meikyuuTallShape } from "./sizes";
import { decodeWay, encodeCells, wayOfRun } from "./steps";
import { encodeWay, mazeOf } from "./way";

/*
 * MEIKYUU, the maze (`@johnmorrisdotca/meikyuu`): its levels on the site. The package holds its own list
 * to its rules (every level rebuilt, proved a perfect maze and solved by drawing); what is held here is the
 * site's side of it: the four sizes, the numbers an address reads without the list, the line as the site
 * keeps it, and the check the server runs.
 */
beforeAll(loadEveryMeikyuuLevels);

describe("meikyuu's sizes are the package's words for how big a maze is", () => {
  it("are four, in the package's order, numbered from 1", () => {
    expect(MEIKYUU_SIZES).toEqual([1, 2, 3, 4]);
    expect(MEIKYUU_SIZE_WORDS).toEqual(["small", "medium", "large", "huge"]);
    expect(MEIKYUU_SIZE_WORDS.map(meikyuuSizeOfWord)).toEqual([1, 2, 3, 4]);
    expect(MEIKYUU_SIZES.map(meikyuuSizeWord)).toEqual([...MEIKYUU_SIZE_WORDS]);
    expect(meikyuuSizeLabel(3)).toBe("Large");
    expect(isMeikyuuSize(0)).toBe(false);
    // Five is the colossal square size, which is not one of the package's four words.
    expect(isMeikyuuSize(5)).toBe(true);
    expect(meikyuuSizeWord(5)).toBeNull();
    expect(isMeikyuuSize(6)).toBe(false);
    expect(isMeikyuuSize(2.5)).toBe(false);
    expect(meikyuuSizeWord(9)).toBeNull();
  });

  it("have the levels the package's list has of each, 256 to a size, which the address reads without the list", () => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const level of MEIKYUU_MAZE_LEVELS) counts[meikyuuSizeOfWord(level.size)]! += 1;
    expect(MEIKYUU_LEVELS_A_SIZE).toBe(MEIKYUU_LEVELS_PER_SIZE);
    expect(MEIKYUU_LEVEL_COUNTS).toMatchObject(counts);
    expect(Object.keys(MEIKYUU_LEVEL_COUNTS).map(Number).sort((a, b) => a - b)).toEqual([...MEIKYUU_EVERY_SIZE].sort((a, b) => a - b));
    for (const size of MEIKYUU_SIZES) {
      expect(meikyuuLevelCount(size)).toBe(256);
      expect(meikyuuLevelsAt(size)).toHaveLength(256);
    }
    expect(Object.values(counts).reduce((total, count) => total + count, 0)).toBe(MEIKYUU_MAZE_LEVELS.length);
    expect(MEIKYUU_MAZE_LEVELS).toHaveLength(1024);
    expect(meikyuuLevelCount(6)).toBe(0);
  });

  it("put every level at the place in its size that the package gives it, with its score", () => {
    for (const level of MEIKYUU_MAZE_LEVELS) {
      const row = meikyuuLevelsAt(meikyuuSizeOfWord(level.size))[level.inSize - 1]!;
      expect(row.code).toBe(level.code);
      expect(row.number).toBe(level.number);
      expect(row.score).toBe(level.score);
      expect(row.score).toBeGreaterThanOrEqual(0);
      expect(row.score).toBeLessThanOrEqual(100);
    }
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
    expect(isMeikyuuLevelAt(1, 256)).toBe(true);
    expect(isMeikyuuLevelAt(1, 257)).toBe(false);
    expect(isMeikyuuLevelAt(1, 0)).toBe(false);
    expect(isMeikyuuLevelAt(6, 1)).toBe(false);
    expect(isMeikyuuLevelAt(5, 128)).toBe(true);
    expect(isMeikyuuLevelAt(5, 129)).toBe(false);
    for (const size of MEIKYUU_SIZES) {
      const count = meikyuuLevelCount(size);
      expect(meikyuuLevelBand(size, 1)).toBe("easy");
      expect(meikyuuLevelBand(size, Math.ceil(count / 2))).toBe("medium");
      expect(meikyuuLevelBand(size, count)).toBe("hard");
    }
  });

  it("make the package's thirds of a size, 86 easy, 85 medium and 85 hard", () => {
    const thirds = { easy: 0, medium: 0, hard: 0 };
    for (let level = 1; level <= MEIKYUU_LEVELS_A_SIZE; level += 1) {
      expect(meikyuuLevelBand(1, level)).toBe(bandOf(level));
      thirds[meikyuuLevelBand(1, level)] += 1;
    }
    expect(thirds).toEqual({ easy: 86, medium: 85, hard: 85 });
  });

  it("make blocks of sixteen, the last ending at the count", () => {
    expect(meikyuuBlocksIn(256)).toBe(16);
    expect(meikyuuBlockOf(1)).toBe(1);
    expect(meikyuuBlockOf(16)).toBe(1);
    expect(meikyuuBlockOf(17)).toBe(2);
    expect(meikyuuBlockRange(1, 256)).toEqual({ first: 1, last: 16 });
    expect(meikyuuBlockRange(16, 256)).toEqual({ first: 241, last: 256 });
    // A size that is not a whole number of pages still ends at its count.
    expect(meikyuuBlockRange(14, 217)).toEqual({ first: 209, last: 217 });
  });

  it("are asked for by the seed, which is the level's number in its size, and the address keeps it", () => {
    expect(fixedLevelOf("meikyuu", 12)).toBe(12);
    expect(fixedLevelOf("meikyuu", 0)).toBeNull();
    const asked = puzzleAsked("meikyuu", { size: "3", seed: "200" });
    expect(asked).toMatchObject({ size: 3, seed: 200, level: meikyuuLevelBand(3, 200), clock: "none" });
    expect(puzzleQuery(asked)).toBe(`?size=3&level=${meikyuuLevelBand(3, 200)}&seed=200`);
    // A number past the size's levels asks for nothing, and an unknown size is the first.
    expect(puzzleAsked("meikyuu", { size: "1", seed: "257" }).seed).toBeNull();
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

  it("fits in a character a step at every cell of every level, tall and colossal ones too", () => {
    for (const level of [...MEIKYUU_MAZE_LEVELS, ...MEIKYUU_TALL_LEVELS, ...MEIKYUU_COLOSSAL_LEVELS, ...MEIKYUU_COLOSSAL_TALL_LEVELS]) {
      const maze = mazeOf(level.code)!;
      for (const neighbours of maze.grid.neighbours) expect(neighbours.length, level.code).toBeLessThanOrEqual(36);
    }
  }, 300_000);
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

describe("a maze solved under the first list's numbers is still a solve of that maze", () => {
  /*
   * THE RULE FOR OLD SOLVES (2026-10-02, the package's 2.0.0 renumbered its list). A solve keeps its maze's recipe as
   * its givens, and every page finds a level by that recipe (`meikyuuLevelOfBoard`, `meikyuuSolvedBy`, `keptSolves`),
   * never by the number it had. So: a maze that is still a level is marked solved at the place it has NOW, whether
   * that is the place it had or another; a maze that left the list is a solved record in History, My games and XP
   * (nothing already shown or paid is taken away) and is marked on no level, because it is no level. A NEW solve
   * must still be of a current level (`checkMeikyuu`), so a retired recipe cannot be handed in again.
   */
  it("is marked at the place the maze has now, and on no level when the maze is not one any longer", () => {
    let same = 0;
    let moved = 0;
    let gone = 0;
    for (const old of MEIKYUU_LEGACY_MAZE_LEVELS) {
      const size = meikyuuSizeOfWord(old.size);
      const now = meikyuuLevelOfBoard(size, old.code);
      // What the package says became of it is what the site finds, level for level.
      expect(now, old.code).toBe(old.nowInSize);
      expect(legacyLevelOfCode(old.code)?.number).toBe(old.number);
      if (now === null) gone += 1;
      else if (now === old.place) same += 1;
      else moved += 1;
    }
    expect(same + moved + gone).toBe(1000);
    expect(same).toBe(843);
    expect(moved).toBe(0);
    expect(gone).toBe(157);
  });

  it("is refused as a new solve once the maze is no level, whoever solved it before", () => {
    const gone = MEIKYUU_LEGACY_MAZE_LEVELS.find((old) => old.now === null)!;
    const size = meikyuuSizeOfWord(gone.size);
    const solution = encodeWay(gone.code)!;
    expect(checkSolution("meikyuu", size, gone.code, solution, "easy").ok).toBe(false);
    // The maze itself is as good a maze as ever: only the list has moved on.
    expect(mazeOf(gone.code)).not.toBeNull();
  });
});

describe("meikyuu's tall levels are the package's second list, kept under their width and height", () => {
  it("are six sizes of 256, written as columns and rows in one number, as Suido's long boards are", () => {
    expect(MEIKYUU_TALL_SIZES).toEqual([609, 812, 1015, 1218, 1624, 2030]);
    expect(MEIKYUU_TALL_SIZES).toEqual(PACKAGE_TALL_SIZES.map((size) => size.width * 100 + size.height));
    expect(MEIKYUU_TALL_RATIO).toBe(TALL_RATIO);
    expect(MEIKYUU_TALL_PER_SIZE).toBe(MEIKYUU_LEVELS_A_SIZE);
    for (const size of MEIKYUU_TALL_SIZES) {
      expect(isMeikyuuTall(size)).toBe(true);
      expect(isMeikyuuSize(size)).toBe(true);
      expect(meikyuuLevelCount(size)).toBe(256);
      expect(meikyuuLevelsAt(size)).toHaveLength(256);
    }
    expect(MEIKYUU_EVERY_SIZE).toHaveLength(12);
    // No size is two things: the four are under a hundred and the tall ones are not.
    expect(MEIKYUU_SIZES.some(isMeikyuuTall)).toBe(false);
    expect(isMeikyuuSize(610)).toBe(false);
    expect(meikyuuTallShape(1015)).toEqual({ width: 10, height: 15 });
    expect(meikyuuTallShape(3)).toBeNull();
    expect(meikyuuSizeLabel(1015)).toBe("Tall 10×15");
    expect(meikyuuSizeInWords(1015)).toBe("tall 10×15 size");
    expect(meikyuuSizeInWords(2)).toBe("medium size");
  });

  it("put every level at the place in its size that the package gives it", () => {
    for (const level of MEIKYUU_TALL_LEVELS) {
      const shape = PACKAGE_TALL_SIZES.find((size) => size.size === level.size)!;
      const row = meikyuuLevelsAt(shape.width * 100 + shape.height)[level.inSize - 1]!;
      expect(row.code).toBe(level.code);
      expect(row.score).toBe(level.score);
    }
  });

  it("are asked for in an address as 6x9, and the address keeps it", () => {
    expect(meikyuuSizeInAddress(609)).toBe("6x9");
    expect(meikyuuSizeInAddress(3)).toBe("3");
    expect(meikyuuSizeFromAddress("20x30")).toBe(2030);
    expect(meikyuuSizeFromAddress("3")).toBe(3);
    expect(meikyuuSizeFromAddress("x")).toBeNull();
    const asked = puzzleAsked("meikyuu", { size: "10x15", seed: "200" });
    expect(asked).toMatchObject({ size: 1015, seed: 200, level: meikyuuLevelBand(1015, 200), clock: "none" });
    expect(puzzleQuery(asked)).toBe(`?size=10x15&level=${meikyuuLevelBand(1015, 200)}&seed=200`);
    // A shape that is no tall size is the first size, as any other unknown size is.
    expect(puzzleAsked("meikyuu", { size: "7x9", seed: "3" })).toMatchObject({ size: 1, seed: 3 });
    expect(puzzleAsked("meikyuu", { size: "1015", seed: "257" }).seed).toBeNull();
  });

  it("make a puzzle of every level whose answer the server's check passes, and no other line", () => {
    let longest = 0;
    for (const size of MEIKYUU_TALL_SIZES) {
      meikyuuLevelsAt(size).forEach((row, at) => {
        const puzzle = meikyuuLevelPuzzle(size, at + 1);
        expect(puzzle).toMatchObject({ kind: "meikyuu", size, seed: at + 1, givens: row.code });
        expect(puzzle.givens.length).toBeLessThanOrEqual(PUZZLE_SPECS.meikyuu.mostCells);
        expect(checkSolution("meikyuu", size, puzzle.givens, puzzle.solution, puzzle.level), row.code).toEqual({ ok: true });
        expect(checkSolution("meikyuu", size, puzzle.givens, puzzle.solution.slice(0, -1), puzzle.level).ok, row.code).toBe(false);
        longest = Math.max(longest, puzzle.solution.length);
        expect(meikyuuLevelOfBoard(size, row.code)).toBe(at + 1);
      });
    }
    expect(longest).toBeLessThanOrEqual(MEIKYUU_MOST_STEPS);
  });

  it("is held to its own size: a tall maze is no level of a square size, a square one none of a tall size, and one tall size's is none of another", () => {
    const tall = meikyuuLevelPuzzle(609, 1);
    const square = meikyuuLevelPuzzle(1, 1);
    expect(checkSolution("meikyuu", 1, tall.givens, tall.solution, tall.level).ok).toBe(false);
    expect(checkSolution("meikyuu", 609, square.givens, square.solution, square.level).ok).toBe(false);
    expect(checkSolution("meikyuu", 812, tall.givens, tall.solution, tall.level).ok).toBe(false);
    expect(checkSolution("meikyuu", 609, tall.givens, tall.solution, tall.level).ok).toBe(true);
  });
});

describe("meikyuu's colossal levels are the package's third list, two sizes of 128", () => {
  it("are size 5 for the square list and 6496 (64×96) for the tall one, with 128 levels each", () => {
    expect(MEIKYUU_COLOSSAL_SIZES).toEqual([5, 6496]);
    expect(MEIKYUU_COLOSSAL_SIZE).toBe(5);
    expect(MEIKYUU_COLOSSAL_TALL_SIZE).toBe(COLOSSAL_TALL_WIDTH * 100 + COLOSSAL_TALL_HEIGHT);
    expect(MEIKYUU_COLOSSAL_LEVELS_A_SIZE).toBe(MEIKYUU_COLOSSAL_PER_LIST);
    for (const size of MEIKYUU_COLOSSAL_SIZES) {
      expect(isMeikyuuColossal(size)).toBe(true);
      expect(isMeikyuuSize(size)).toBe(true);
      expect(meikyuuLevelCount(size)).toBe(128);
      expect(meikyuuLevelsAt(size)).toHaveLength(128);
    }
    // The tall colossal one is played in a tall box, like the tall sizes, and is not one of their six.
    expect(isMeikyuuTall(6496)).toBe(true);
    expect(isMeikyuuTall(5)).toBe(false);
    expect(MEIKYUU_TALL_SIZES).not.toContain(6496);
    expect(meikyuuTallShape(6496)).toEqual({ width: 64, height: 96 });
    expect(meikyuuSizeLabel(5)).toBe("Colossal");
    expect(meikyuuSizeLabel(6496)).toBe("Colossal tall 64×96");
    expect(meikyuuSizeInWords(5)).toBe("colossal size");
    expect(meikyuuLevelBand(5, 1)).toBe("easy");
    expect(meikyuuLevelBand(5, 64)).toBe("medium");
    expect(meikyuuLevelBand(5, 128)).toBe("hard");
  });

  it("put every level at the place in its list that the package gives it", () => {
    MEIKYUU_COLOSSAL_LEVELS.forEach((level, at) => {
      const row = meikyuuLevelsAt(5)[at]!;
      expect(row).toMatchObject({ code: level.code, number: level.number, score: level.score, cells: level.cells });
    });
    MEIKYUU_COLOSSAL_TALL_LEVELS.forEach((level, at) => {
      const row = meikyuuLevelsAt(6496)[at]!;
      expect(row).toMatchObject({ code: level.code, number: level.number, score: level.score, cells: level.cells });
    });
  });

  it("are asked for in an address as 5 and as 64x96", () => {
    expect(meikyuuSizeInAddress(6496)).toBe("64x96");
    expect(meikyuuSizeFromAddress("64x96")).toBe(6496);
    const asked = puzzleAsked("meikyuu", { size: "64x96", seed: "100" });
    expect(asked).toMatchObject({ size: 6496, seed: 100, level: meikyuuLevelBand(6496, 100), clock: "none" });
    expect(puzzleQuery(asked)).toBe(`?size=64x96&level=${meikyuuLevelBand(6496, 100)}&seed=100`);
    expect(puzzleAsked("meikyuu", { size: "5", seed: "128" })).toMatchObject({ size: 5, seed: 128 });
    expect(puzzleAsked("meikyuu", { size: "5", seed: "129" }).seed).toBeNull();
  });

  it("make a puzzle of every level whose answer the server's check passes (the longest, 5,009 steps, among them) and no other line", () => {
    let longest = 0;
    for (const size of MEIKYUU_COLOSSAL_SIZES) {
      meikyuuLevelsAt(size).forEach((row, at) => {
        const puzzle = meikyuuLevelPuzzle(size, at + 1);
        expect(puzzle).toMatchObject({ kind: "meikyuu", size, seed: at + 1, givens: row.code });
        expect(puzzle.givens.length).toBeLessThanOrEqual(PUZZLE_SPECS.meikyuu.mostCells);
        expect(checkSolution("meikyuu", size, puzzle.givens, puzzle.solution, puzzle.level), row.code).toEqual({ ok: true });
        expect(checkSolution("meikyuu", size, puzzle.givens, puzzle.solution.slice(0, -1), puzzle.level).ok, row.code).toBe(false);
        longest = Math.max(longest, puzzle.solution.length);
        expect(meikyuuLevelOfBoard(size, row.code)).toBe(at + 1);
      });
    }
    expect(longest).toBeGreaterThan(MEIKYUU_TALL_LEVELS.length > 0 ? 2434 : 0);
    expect(longest).toBeLessThanOrEqual(MEIKYUU_MOST_STEPS);
    expect(PUZZLE_SPECS.meikyuu.mostCells).toBeGreaterThanOrEqual(longest + 800);
  });

  it("is held to its own size, and the stones a run keeps are never an answer", () => {
    const colossal = meikyuuLevelPuzzle(5, 1);
    const tall = meikyuuLevelPuzzle(6496, 1);
    expect(checkSolution("meikyuu", 1, colossal.givens, colossal.solution, colossal.level).ok).toBe(false);
    expect(checkSolution("meikyuu", 6496, colossal.givens, colossal.solution, colossal.level).ok).toBe(false);
    expect(checkSolution("meikyuu", 5, tall.givens, tall.solution, tall.level).ok).toBe(false);
    expect(checkSolution("meikyuu", 5, colossal.givens, `${colossal.solution}~1a.2f`, colossal.level).ok).toBe(false);
  });

  it("keeps a run half way with its stones: the steps, a tilde and the cells in base 36, held to what a route may take", () => {
    expect(meikyuuCodeFits("0231")).toBe(true);
    expect(meikyuuCodeFits("0231~1a.2f")).toBe(true);
    expect(meikyuuCodeFits("~1a")).toBe(true);
    expect(meikyuuCodeFits("0231~")).toBe(false);
    expect(meikyuuCodeFits("0231~1a..2f")).toBe(false);
    expect(meikyuuCodeFits("0231~1A")).toBe(false);
    expect(meikyuuCodeFits("0231~1a~2f")).toBe(false);
    expect(meikyuuCodeFits(`${"0".repeat(MEIKYUU_MOST_STEPS)}~${"z.".repeat(300)}z`)).toBe(true);
    expect(meikyuuCodeFits(`0~${"z.".repeat(400)}z`)).toBe(false);
    expect(wayOfRun("0231~1a.2f")).toBe("0231");
    expect(wayOfRun("0231")).toBe("0231");
    // The longest run a colossal maze can have, and a good many stones with it, fits what the runs route accepts.
    expect(MEIKYUU_MOST_STEPS + 1 + 800).toBeLessThanOrEqual(PUZZLE_CODE_LONGEST);
  });
});
