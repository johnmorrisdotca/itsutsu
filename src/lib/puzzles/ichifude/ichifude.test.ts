import { describe, expect, it } from "vitest";

import { checkSolution } from "../puzzleCheck";
import { generatePuzzle } from "../generate";
import { solvedAnswerOf } from "../solvedAnswer";
import { checkIchifude } from "./check";
import { adjacent, blankLine, decodeLine, decodeNumbers, encodeLine, encodeNumbers } from "./code";
import { lineAfter, lineAfterArrow, nextNumberOf } from "./draw";
import { generateIchifude, shakenLine } from "./generate";
import { hintedLine, offTheAnswer } from "./help";
import { ICHIFUDE_SPEC } from "./ichifude.constants";
import { searchLines, solutionOf } from "./solve";
import { seededRandom } from "../random";

/** A small board with a known answer: 3×3, the line a plain back and forth, numbered at its two ends and in the middle. */
const SNAKE = [0, 1, 2, 5, 4, 3, 6, 7, 8];

describe("ichifude: what makes it different", () => {
  it("walks one line through every cell, and the line it shakes is one", () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const line = shakenLine(6, seededRandom(seed));
      expect(new Set(line).size).toBe(36);
      for (let place = 1; place < line.length; place += 1) expect(adjacent(line[place - 1]!, line[place]!, 6)).toBe(true);
    }
  });

  it("refuses a line that jumps, crosses itself, skips a square, or takes the numbers out of order", () => {
    const givens = encodeNumbers([1, 0, 0, 0, 2, 0, 0, 0, 3]);
    const right = encodeLine(SNAKE, 3);
    expect(checkIchifude(3, givens, right)).toEqual({ ok: true });
    // Ends one short of the last square.
    expect(checkIchifude(3, givens, encodeLine(SNAKE.slice(0, -1), 3)).ok).toBe(false);
    // A jump: the last two squares swapped, so the line leaves a neighbour behind.
    expect(checkIchifude(3, givens, encodeLine([0, 1, 2, 5, 4, 3, 6, 8, 7], 3)).ok).toBe(false);
    // The numbers out of order: a line that meets 3 before 2.
    const swapped = encodeNumbers([1, 0, 0, 0, 3, 0, 0, 0, 2]);
    expect(checkIchifude(3, swapped, right).ok).toBe(false);
    // Starting anywhere but the first number.
    expect(checkIchifude(3, encodeNumbers([2, 0, 0, 0, 1, 0, 0, 0, 3]), right).ok).toBe(false);
    // Ending anywhere but the last number.
    expect(checkIchifude(3, encodeNumbers([1, 0, 0, 0, 0, 0, 0, 3, 2]), right).ok).toBe(false);
    // A place used twice.
    expect(checkIchifude(3, givens, right.replace("8", "7")).ok).toBe(false);
  });

  it("finds exactly the one answer the numbers leave, and tells two answers from one", () => {
    // Numbered every other square along the snake on a 2×3 strip is not the point: an open 3×3 with only its ends numbered has more than one way round.
    const open = searchLines(3, [1, 0, 0, 0, 0, 0, 0, 0, 2], 2);
    expect(open.found).toBe(2);
    expect(open.exhausted).toBe(false);
    const one = searchLines(3, [1, 0, 0, 0, 3, 2, 0, 0, 4], 3);
    expect(one.lines.every((line) => line[0] === 0 && line.at(-1) === 8)).toBe(true);
  });

  it("does not count a search that ran out of budget as having one answer", () => {
    const search = searchLines(8, [1, ...new Array<number>(62).fill(0), 2], 2, 5);
    expect(search.exhausted).toBe(true);
  });

  it("makes every size and level with exactly one answer, proved by a search with no budget to speak of, and the answer is the one the generator kept", () => {
    for (const size of ICHIFUDE_SPEC.sizes) {
      for (const level of ICHIFUDE_SPEC.levels) {
        for (const seed of [11, 202, 3003]) {
          const puzzle = generateIchifude(size, level, seed);
          const numbers = decodeNumbers(puzzle.givens, size)!;
          const search = searchLines(size, numbers, 2, 5_000_000);
          expect(search.exhausted, `${size} ${level} ${seed}`).toBe(false);
          expect(search.found, `${size} ${level} ${seed}`).toBe(1);
          expect(encodeLine(search.lines[0]!, size)).toBe(puzzle.solution);
          expect(checkSolution("ichifude", size, puzzle.givens, puzzle.solution, level)).toEqual({ ok: true });
        }
      }
    }
  }, 120_000);

  it("gives fewer numbers as the level rises, on average", () => {
    const count = (level: "easy" | "medium" | "hard") => {
      let total = 0;
      for (let seed = 1; seed <= 12; seed += 1) total += Math.max(...decodeNumbers(generateIchifude(7, level, seed).givens, 7)!);
      return total;
    };
    expect(count("easy")).toBeGreaterThan(count("medium"));
    expect(count("medium")).toBeGreaterThanOrEqual(count("hard"));
  }, 60_000);

  it("makes one seed's board in every browser, and a day's seed like any other", () => {
    expect(generatePuzzle("ichifude", 6, "medium", 20261030)).toEqual(generatePuzzle("ichifude", 6, "medium", 20261030));
    expect(generatePuzzle("ichifude", 6, "medium", 20261030).givens).not.toBe(generatePuzzle("ichifude", 6, "medium", 20261031).givens);
  });

  it("works a kept solve's answer out again from its givens", () => {
    const puzzle = generateIchifude(6, "hard", 77);
    expect(solutionOf(6, puzzle.givens)).toBe(puzzle.solution);
    expect(solvedAnswerOf("ichifude", 6, "hard", puzzle.givens)).toBe(puzzle.solution);
    expect(solutionOf(6, "not a board")).toBeNull();
  });
});

describe("ichifude: drawing the line", () => {
  const numbers = [1, 0, 0, 0, 2, 0, 0, 0, 3];

  it("starts on the first number, and a press beside the head takes a step", () => {
    const blank = blankLine(encodeNumbers(numbers), 3)!;
    expect(decodeLine(blank, 3)).toEqual([0]);
    expect(lineAfter([0], numbers, 1, 3)).toEqual([0, 1]);
    expect(lineAfter([0], numbers, 3, 3)).toEqual([0, 3]);
  });

  it("will not step on a number out of its turn, nor to a square away from the head", () => {
    const line = [0, 1];
    // 3 is not next: 2 is, and it is not where the head can step, so this leaves the line alone.
    expect(lineAfter([0, 1, 2, 5], numbers, 8, 3)).toEqual([0, 1, 2, 5]);
    expect(lineAfter(line, numbers, 8, 3)).toBe(line);
    // 2 is next, so it can be stepped on.
    expect(lineAfter([0, 1], numbers, 4, 3)).toEqual([0, 1, 4]);
    expect(nextNumberOf([0, 1, 4], numbers)).toBe(3);
  });

  it("cuts back to a square of the line that is pressed, and a press on the head does nothing", () => {
    const line = [0, 1, 2, 5];
    expect(lineAfter(line, numbers, 1, 3)).toEqual([0, 1]);
    expect(lineAfter(line, numbers, 5, 3)).toBe(line);
  });

  it("follows a fast finger along a straight run of free squares, and refuses one with a number out of turn in it", () => {
    const blank = new Array<number>(16).fill(0);
    blank[0] = 1;
    blank[15] = 2;
    expect(lineAfter([0], blank, 3, 4, true)).toEqual([0, 1, 2, 3]);
    // A tap is not a finger moving fast: it takes one step or none.
    expect(lineAfter([0], blank, 3, 4)).toEqual([0]);
    const guarded = [...blank];
    guarded[2] = 2;
    guarded[15] = 3;
    expect(lineAfter([0], guarded, 3, 4, true)).toEqual([0, 1, 2, 3]);
    guarded[2] = 3;
    guarded[15] = 2;
    expect(lineAfter([0], guarded, 3, 4, true)).toEqual([0]);
  });

  it("takes the arrow keys: a step on, or back the way it came", () => {
    expect(lineAfterArrow([0], numbers, "right", 3)).toEqual([0, 1]);
    expect(lineAfterArrow([0, 1], numbers, "left", 3)).toEqual([0]);
    expect(lineAfterArrow([0], numbers, "up", 3)).toEqual([0]);
  });
});

describe("ichifude: Check, Show and Hint", () => {
  const solution = encodeLine(SNAKE, 3);

  it("counts the squares after the line leaves the answer, and what is still to fill", () => {
    expect(offTheAnswer(3, encodeLine([0, 1, 2, 5], 3), solution)).toEqual({ right: 4, wrongCells: [], left: 5 });
    expect(offTheAnswer(3, encodeLine([0, 3, 4], 3), solution)).toEqual({ right: 1, wrongCells: [3, 4], left: 6 });
  });

  it("a hint cuts back to where it agrees and adds one right step, and offers nothing once the line is the answer", () => {
    expect(hintedLine(3, encodeLine([0, 3, 4], 3), solution)).toEqual([0, 1]);
    expect(hintedLine(3, encodeLine([0, 1], 3), solution)).toEqual([0, 1, 2]);
    expect(hintedLine(3, solution, solution)).toBeNull();
  });
});

describe("ichifude: the strings", () => {
  it("reads a board's numbers only where they run 1 to the highest, each once", () => {
    expect(decodeNumbers("1.......2", 3)).not.toBeNull();
    expect(decodeNumbers("1.......3", 3)).toBeNull();
    expect(decodeNumbers("1.......1", 3)).toBeNull();
    expect(decodeNumbers("........1", 3)).toBeNull();
    expect(decodeNumbers("1.......2.", 3)).toBeNull();
  });

  it("reads a line only where it is one unbroken line", () => {
    const code = encodeLine([0, 1, 2], 3);
    expect(decodeLine(code, 3)).toEqual([0, 1, 2]);
    expect(decodeLine(encodeLine([0, 2], 3), 3)).toBeNull();
    expect(decodeLine(".".repeat(9), 3)).toBeNull();
    expect(decodeLine("0", 3)).toBeNull();
  });
});
