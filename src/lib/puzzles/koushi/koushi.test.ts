import { describe, expect, it } from "vitest";

import { isWord } from "../gomoji/code";
import { checkOutOfGuesses, checkSolution } from "../puzzleCheck";
import { pointsFor } from "../puzzlePoints";
import { progressFits } from "../puzzleProgress";
import { PUZZLE_SPECS } from "../puzzles.constants";
import type { PuzzleLevel } from "../puzzles.types";
import { checkKoushi, koushiPoints, swapsTaken } from "./check";
import { generateKoushi } from "./generate";
import {
  LATTICE_CELLS,
  LATTICE_HOLES,
  LEAST_SWAPS,
  LETTER_CELLS,
  LINES_OF,
  decodeGivens,
  decodePlay,
  encodeGrid,
  encodePlay,
  markLattice,
  replay,
  swapsAllowed,
  wordsOf,
  type Swap,
} from "./lattice";
import { leastSwaps, swapsSolving } from "./leastSwaps";

const LEVELS: PuzzleLevel[] = ["easy", "medium", "hard"];

describe("the koushi lattice", () => {
  it("has 21 letters, four holes and nine crossings", () => {
    expect(LETTER_CELLS).toHaveLength(21);
    expect(LATTICE_HOLES).toEqual([6, 8, 16, 18]);
    expect(LINES_OF.filter((lines) => lines.length === 2)).toHaveLength(9);
    expect(LATTICE_HOLES.every((cell) => LINES_OF[cell]!.length === 0)).toBe(true);
  });
});

describe("making a koushi", () => {
  for (const level of LEVELS) {
    it(`at ${level}: six different real words that cross, solvable in exactly ${LEAST_SWAPS[level]} swaps, none right at the start`, () => {
      for (const seed of [1, 2, 3, 20260926, 99_999]) {
        const puzzle = generateKoushi(level, seed);
        const asked = decodeGivens(puzzle.givens)!;
        expect(asked).not.toBeNull();
        const words = wordsOf(asked.solution);
        expect(new Set(words).size).toBe(6);
        for (const word of words) expect(isWord(word, 5), word).toBe(true);
        const start = wordsOf(asked.scramble);
        expect(start.some((word, line) => word === words[line]), "a word already right").toBe(false);
        expect(leastSwaps(asked.scramble, asked.solution, LETTER_CELLS)).toBe(LEAST_SWAPS[level]);
        // Its solution is an answer: the grid and a shortest run of swaps to it.
        const played = decodePlay(puzzle.solution)!;
        expect(played.swaps).toHaveLength(LEAST_SWAPS[level]);
        expect(checkSolution("koushi", 5, puzzle.givens, puzzle.solution, level)).toEqual({ ok: true });
        expect(generateKoushi(level, seed)).toEqual(puzzle);
      }
    });
  }

  it("makes a different puzzle from another seed", () => {
    expect(generateKoushi("medium", 11).givens).not.toBe(generateKoushi("medium", 12).givens);
  });
});

describe("the colours", () => {
  // Every letter different, so each colour has one reason: rows ABCDE, IJKLM, QRSTU; columns AFINQ, CGKOS, EHMPU.
  const solution = [..."abcde" + "f.g.h" + "ijklm" + "n.o.p" + "qrstu"];
  const swap = (a: number, b: number) => {
    const grid = [...solution];
    [grid[a], grid[b]] = [grid[b]!, grid[a]!];
    return markLattice(grid, solution);
  };

  it("marks green in place, gold where a word needs the letter elsewhere, and nothing in a hole", () => {
    const marks = swap(1, 2);
    expect(marks[0]).toBe("hit");
    expect([marks[1], marks[2]]).toEqual(["near", "near"]);
    expect(LATTICE_HOLES.map((cell) => marks[cell])).toEqual([null, null, null, null]);
  });

  it("lights a crossing gold if either of its words wants the letter", () => {
    // The top-left crossing given F, which only the word down wants; and given B, which only the word across wants.
    expect(swap(0, 5)[0]).toBe("near");
    expect(swap(0, 1)[0]).toBe("near");
  });

  it("leaves a letter plain that neither of its words wants", () => {
    const marks = swap(0, 24);
    expect([marks[0], marks[24]]).toEqual(["miss", "miss"]);
  });

  it("lights a letter only as often as its word still needs it, the first it comes to", () => {
    const target = [..."sleep" + "t.x.l" + "abcde" + "r.x.o" + "fghij"];
    const grid = [...target];
    // SLEEP laid as SEL E E: its middle E is green, and it still wants one L, one E and one P.
    grid[1] = "e";
    grid[2] = "l";
    grid[4] = "e";
    const marks = markLattice(grid, target);
    expect(marks[3]).toBe("hit");
    expect([marks[1], marks[2], marks[4]]).toEqual(["near", "near", "miss"]);
  });
});

describe("the server's check", () => {
  const puzzle = generateKoushi("medium", 42);
  const asked = decodeGivens(puzzle.givens)!;
  const best = swapsSolving(asked.scramble, asked.solution, LETTER_CELLS)!;

  it("accepts the solution reached in the fewest swaps, and in more, up to the level's allowance", () => {
    expect(checkKoushi(5, puzzle.givens, encodePlay(asked.solution, best), "found", "medium")).toEqual({ ok: true });
    // A wasted swap there and back is still a solve, two swaps dearer.
    const wasted: Swap[] = [[best[0]![0], best[0]![1]], [best[0]![0], best[0]![1]], ...best];
    expect(checkKoushi(5, puzzle.givens, encodePlay(asked.solution, wasted), "found", "medium")).toEqual({ ok: true });
  });

  it("refuses a grid the swaps did not make, a grid that is not the solution, too many swaps, and no level", () => {
    expect(checkKoushi(5, puzzle.givens, encodePlay(asked.solution, best.slice(1)), "found", "medium").ok).toBe(false);
    expect(checkKoushi(5, puzzle.givens, encodePlay(asked.scramble, []), "found", "medium").ok).toBe(false);
    const padding: Swap[] = Array.from({ length: 6 }, () => [0, 1] as const);
    const tooMany = [...best, ...padding];
    expect(replay(asked.scramble, tooMany)).toEqual(asked.solution);
    expect(checkKoushi(5, puzzle.givens, encodePlay(asked.solution, tooMany), "found", "medium").ok).toBe(false);
    expect(checkKoushi(5, puzzle.givens, encodePlay(asked.solution, best), "found", undefined).ok).toBe(false);
  });

  it("refuses a solution that is not six real words", () => {
    const fake = [...asked.solution];
    fake[0] = "q";
    const scramble = [...asked.scramble];
    const givens = encodeGrid(scramble) + encodeGrid(fake).toUpperCase();
    expect(checkKoushi(5, givens, encodePlay(fake, []), "found", "medium").ok).toBe(false);
  });

  it("accepts a puzzle played out only when every swap is spent and the grid is not right", () => {
    const allowed = swapsAllowed("medium");
    const spent: Swap[] = Array.from({ length: allowed }, () => [best[0]![0], best[0]![1]] as const);
    const grid = replay(asked.scramble, spent);
    expect(checkOutOfGuesses("koushi", 5, puzzle.givens, encodePlay(grid, spent), "medium")).toEqual({ ok: true });
    expect(checkOutOfGuesses("koushi", 5, puzzle.givens, encodePlay(grid, spent.slice(2)), "medium").ok).toBe(false);
    expect(checkOutOfGuesses("koushi", 5, puzzle.givens, encodePlay(asked.solution, best), "medium").ok).toBe(false);
  });

  it("keeps a run's progress in the answer's shape", () => {
    expect(progressFits("koushi", 5, encodePlay(asked.scramble, []))).toBe(true);
    expect(progressFits("koushi", 5, encodePlay(asked.solution, best))).toBe(true);
    expect(progressFits("koushi", 5, "abc")).toBe(false);
    expect(puzzle.givens.length).toBe(2 * LATTICE_CELLS);
    expect(puzzle.solution.length).toBeLessThanOrEqual(PUZZLE_SPECS.koushi.mostCells);
  });
});

describe("the score", () => {
  const puzzle = generateKoushi("medium", 7);
  const asked = decodeGivens(puzzle.givens)!;
  const best = swapsSolving(asked.scramble, asked.solution, LETTER_CELLS)!;
  const wasted: Swap[] = [[best[0]![0], best[0]![1]], [best[0]![0], best[0]![1]], ...best];

  it("puts fewer swaps above a faster time, and a faster time above a slower one", () => {
    const perfectSlow = koushiPoints(puzzle.givens, encodePlay(asked.solution, best), 30 * 60_000, "medium");
    const wastefulFast = koushiPoints(puzzle.givens, encodePlay(asked.solution, wasted), 5_000, "medium");
    const perfectFast = koushiPoints(puzzle.givens, encodePlay(asked.solution, best), 5_000, "medium");
    expect(perfectSlow).toBe(1000);
    expect(perfectFast).toBe(1099);
    expect(wastefulFast).toBe(899);
    expect(perfectFast).toBeGreaterThan(perfectSlow);
    expect(perfectSlow).toBeGreaterThan(wastefulFast);
    expect(pointsFor("koushi", 5, puzzle.givens, 0, 0, encodePlay(asked.solution, best), 5_000, "medium")).toBe(perfectFast);
  });

  it("scores a puzzle played out by the letters it left green, below any solve", () => {
    const points = koushiPoints(puzzle.givens, encodePlay(asked.scramble, []), 0, "medium");
    const greens = LETTER_CELLS.filter((cell) => asked.scramble[cell] === asked.solution[cell]).length;
    expect(points).toBe(5 * greens);
    expect(points).toBeLessThan(500);
  });

  it("says how many swaps a solve took, out of the level's allowance", () => {
    expect(swapsTaken("medium", puzzle.givens, encodePlay(asked.solution, best))).toEqual({ used: 10, allowed: 15 });
    expect(swapsTaken("medium", puzzle.givens, null)).toBeNull();
  });
});
