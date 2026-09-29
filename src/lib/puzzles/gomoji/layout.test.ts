import { describe, expect, it } from "vitest";

import { PUZZLE_LEVEL_LIST, PUZZLE_SPECS } from "../puzzles.constants";
import type { PuzzleLevel } from "../puzzles.types";
import { LEAST_SPAN, LONGEST_WORD, MOST_GUESSES, formerGuessesFor, gomojiBoard, gomojiLayout, guessesEverAllowed, guessesFor, rowsResumed } from "./layout";
import type { WordCount } from "./words.types";

/**
 * THE TABLE OF ROWS, pinned. John, 2026-09-28: "Why is the five letter ones 9
 * rows and four and six letter one 8 rows… make sure that the easiest ones to
 * the hardest go from most rows to the least." Every word kind, every length
 * it has, every level and every count of words: the rows are the level's and
 * the count's alone, easy more than medium more than hard, and the board as
 * tall at every length and level.
 */
const WORD_KINDS = ["gomoji", "gomojiMot", "gomojiWort", "gomojiPop", "gomojiKana"] as const;
const COUNTS: readonly WordCount[] = [1, 2, 4];
const EXPECTED: Record<WordCount, Record<PuzzleLevel, number>> = {
  1: { easy: 8, medium: 7, hard: 6 },
  2: { easy: 9, medium: 8, hard: 7 },
  4: { easy: 11, medium: 10, hard: 9 },
};

describe("the rows of every Gomoji", () => {
  it("are the level's and the count's alone, at every kind and length, easy most and hard fewest", () => {
    for (const kind of WORD_KINDS) {
      const grid = kind === "gomojiKana" ? "gomojiKana" : "gomoji";
      for (const size of PUZZLE_SPECS[kind].sizes) {
        for (const words of COUNTS) {
          const rows = (level: PuzzleLevel) => {
            // Kana's free grey word is one of the rows on easy and medium, never on hard.
            const free = grid === "gomojiKana" && level !== "hard" ? 1 : 0;
            return free + guessesFor(grid, size, level, free, words);
          };
          for (const level of PUZZLE_LEVEL_LIST) expect(rows(level), `${kind} ${size} ×${words} ${level}`).toBe(EXPECTED[words][level]);
          expect(rows("easy")).toBeGreaterThan(rows("medium"));
          expect(rows("medium")).toBeGreaterThan(rows("hard"));
        }
      }
    }
  });

  it("gives kana a free grey word inside its rows: seven guesses at easy, six at medium, six at hard", () => {
    expect([guessesFor("gomojiKana", 4, "easy", 1), guessesFor("gomojiKana", 4, "medium", 1), guessesFor("gomojiKana", 4, "hard", 0)]).toEqual([7, 6, 6]);
    // A kana puzzle whose level found no grey word has its rows all as guesses.
    expect(guessesFor("gomojiKana", 4, "easy", 0)).toBe(8);
  });

  it("gives four letters at hard the same six as every length: a short word is no easier to find", () => {
    for (const size of [4, 5, 6]) expect(guessesFor("gomoji", size, "hard", 0)).toBe(6);
  });
});

describe("a Gomoji board", () => {
  it("is as tall at every length and level: eight for one word, nine for two, eleven for each of four's boards", () => {
    for (const kind of WORD_KINDS) {
      const grid = kind === "gomojiKana" ? "gomojiKana" : "gomoji";
      for (const size of PUZZLE_SPECS[kind].sizes) {
        for (const words of COUNTS) {
          for (const level of PUZZLE_LEVEL_LIST) {
            const free = grid === "gomojiKana" && level !== "hard" ? 1 : 0;
            const layout = gomojiLayout(grid, size, level, free, words);
            expect(layout.rows, `${kind} ${size} ×${words} ${level}`).toBe(EXPECTED[words].easy);
            expect(layout.top + free + layout.guesses).toBeLessThanOrEqual(layout.rows);
            // Fewer rows sit in the middle, the spare one over to the top.
            expect(layout.top).toBeGreaterThanOrEqual(layout.rows - layout.top - free - layout.guesses);
            expect(Number.isInteger(layout.left), `${kind} ${size} ×${words}: the word on whole squares`).toBe(true);
            expect(layout.guesses).toBeLessThanOrEqual(MOST_GUESSES);
            expect(size).toBeLessThanOrEqual(LONGEST_WORD);
          }
        }
      }
    }
  });

  it("is one word at least eight wide, an odd word a square wider than tall; two words exactly their width", () => {
    expect(gomojiBoard(4, 1, 8)).toEqual({ cols: 8, rows: 8, top: 0, left: 2 });
    expect(gomojiBoard(5, 1, 8)).toEqual({ cols: 9, rows: 8, top: 0, left: 2 });
    expect(gomojiBoard(6, 1, 6)).toEqual({ cols: 8, rows: 8, top: 1, left: 1 });
    expect(gomojiBoard(3, 1, 7)).toMatchObject({ cols: 9, rows: 8 });
    expect(gomojiBoard(5, 2, 9)).toEqual({ cols: 10, rows: 9, top: 0, left: 0 });
    expect(gomojiBoard(6, 4, 9)).toEqual({ cols: 12, rows: 11, top: 1, left: 0 });
    expect(LEAST_SPAN).toBe(8);
  });
});

describe("what was kept under the counts before 2026-09-28", () => {
  it("remembers the old counts, and takes up to the larger of old and new", () => {
    expect([formerGuessesFor("gomoji", 5, "easy", 0), formerGuessesFor("gomoji", 5, "medium", 0), formerGuessesFor("gomoji", 5, "hard", 0)]).toEqual([9, 7, 6]);
    expect(formerGuessesFor("gomoji", 4, "hard", 0)).toBe(5);
    expect(formerGuessesFor("gomoji", 6, "easy", 0, 2)).toBe(10);
    expect(guessesEverAllowed("gomoji", 5, "easy", 0)).toBe(9);
    expect(guessesEverAllowed("gomoji", 4, "hard", 0)).toBe(6);
    expect(guessesEverAllowed("gomoji", 6, "easy", 0, 2)).toBe(10);
  });

  it("opens a run that has used today's count with one guess left, never more than it was promised", () => {
    expect(rowsResumed("gomoji", 5, "easy", 0, 1, 3)).toBe(8);
    expect(rowsResumed("gomoji", 5, "easy", 0, 1, 8)).toBe(9);
    expect(rowsResumed("gomoji", 6, "easy", 0, 2, 9)).toBe(10);
    // Nothing beyond what it had: a run at today's count with no larger count behind it has none left.
    expect(rowsResumed("gomoji", 5, "hard", 0, 1, 6)).toBe(6);
  });
});
