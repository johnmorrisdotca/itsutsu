import { describe, expect, it } from "vitest";

import { checkOutOfGuesses, checkSolution } from "../puzzleCheck";
import { wordPoints } from "../puzzlePoints";
import { decodeGomojiProgress, progressFits } from "../puzzleProgress";
import { PUZZLE_LEVEL_LIST, PUZZLE_SPECS } from "../puzzles.constants";
import { answersFor, breaksHardRule, decodeGuesses, decodeHidden, encodeHidden, foundInPlace, isWord, markGuess, rowsFor } from "./code";
import { generateGomoji } from "./generate";
import { foundBonus } from "./wordScore";

/**
 * Gomoji: a word drawn from the level's list by the seed, coloured the
 * way a person colours a guess on paper, and checked by the server from the
 * guesses alone.
 */
describe("drawing a Gomoji", () => {
  for (const size of PUZZLE_SPECS.gomoji.sizes) {
    for (const level of PUZZLE_LEVEL_LIST) {
      it(`${size} letters, ${level}: a word of the list, the same from the same seed`, () => {
        for (const seed of [1, 2, 3, 99]) {
          const puzzle = generateGomoji(size, level, seed);
          const word = decodeHidden(puzzle.givens, size)!;
          expect(word).toHaveLength(size);
          expect(isWord(word, size)).toBe(true);
          expect(answersFor(size, level === "easy")).toContain(word);
          expect(generateGomoji(size, level, seed)).toEqual(puzzle);
        }
      });
    }
  }

  it("draws different words from different seeds", () => {
    const words = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((seed) => generateGomoji(5, "medium", seed).solution));
    expect(words.size).toBeGreaterThan(5);
  });

  it("keeps its easy words inside its wider list, and every answer guessable", () => {
    for (const size of [4, 5]) {
      const wide = new Set(answersFor(size, false));
      for (const word of answersFor(size, true)) expect(wide.has(word)).toBe(true);
      for (const word of answersFor(size, false)) expect(isWord(word, size)).toBe(true);
    }
  });
});

describe("what the board has already found in place", () => {
  it("names, for each place, the letter an earlier guess found green there, and nothing it only found elsewhere", () => {
    const guesses = ["crane", "cream"];
    const marks = [markGuess("crane", "clasp"), markGuess("cream", "clasp")];
    // CRANE finds C and A in place; CREAM finds C again and its A only elsewhere, which adds nothing.
    expect(foundInPlace(guesses, marks, 5)).toEqual(["c", "", "a", "", ""]);
    expect(foundInPlace([], [], 4)).toEqual(["", "", "", ""]);
  });
});

describe("colouring a guess", () => {
  it("marks letters in place, elsewhere and absent", () => {
    expect(markGuess("crane", "cream")).toEqual(["hit", "hit", "near", "miss", "near"]);
  });

  it("lights a repeated letter only as often as the word holds it, the one in place first", () => {
    // SPEED against ABIDE: one E in the word, and E at the fourth place is not it — the first E is the near one.
    expect(markGuess("speed", "abide")).toEqual(["miss", "miss", "near", "miss", "near"]);
    // EERIE against THERE: THERE has two E's, at the third and fifth places. The fifth E of the guess is in place.
    expect(markGuess("eerie", "there")).toEqual(["near", "miss", "near", "miss", "hit"]);
    // ALLOW against LOYAL: two L's in each, neither in place.
    expect(markGuess("allow", "loyal")).toEqual(["near", "near", "near", "near", "miss"]);
  });
});

describe("Strict, where every letter found must be used again", () => {
  it("keeps a green letter in its place and a gold letter in the guess", () => {
    expect(breaksHardRule(["crane"], "cream", "clock")).toMatch(/second letter must be R/);
    expect(breaksHardRule(["crane"], "cream", "crust")).toMatch(/must use A/);
    expect(breaksHardRule(["crane"], "cream", "creak")).toBeNull();
  });
});

describe("what the server checks", () => {
  const givens = "CRANE";

  it("accepts the word found on the last guess, and nothing else", () => {
    expect(checkSolution("gomoji", 5, givens, "slatecrane", "hard")).toEqual({ ok: true });
    expect(checkSolution("gomoji", 5, givens, "crane", "hard")).toEqual({ ok: true });
    expect(checkSolution("gomoji", 5, givens, "slate", "hard").ok).toBe(false);
    expect(checkSolution("gomoji", 5, givens, "craneslate", "hard").ok).toBe(false);
    expect(checkSolution("gomoji", 5, givens, "zzzzzcrane", "hard").ok).toBe(false);
    expect(checkSolution("gomoji", 5, givens, "CRANE", "hard").ok).toBe(false);
    // Hard gives six guesses, so a seventh is refused; easy gives the board's nine, so it is not.
    expect(checkSolution("gomoji", 5, givens, `${"slate".repeat(6)}crane`, "hard").ok).toBe(false);
    expect(checkSolution("gomoji", 5, givens, `${"slate".repeat(6)}crane`, "easy")).toEqual({ ok: true });
    expect(checkSolution("gomoji", 5, givens, `${"slate".repeat(9)}crane`, "easy").ok).toBe(false);
    // With no level there is nothing to count the guesses by.
    expect(checkSolution("gomoji", 5, givens, "crane").ok).toBe(false);
  });

  it("accepts running out only when every row is a word and none is the word", () => {
    const six = "slate".repeat(6);
    expect(checkOutOfGuesses("gomoji", 5, givens, six, "hard")).toEqual({ ok: true });
    expect(checkOutOfGuesses("gomoji", 5, givens, "slate".repeat(5), "hard").ok).toBe(false);
    expect(checkOutOfGuesses("gomoji", 5, givens, `${"slate".repeat(5)}crane`, "hard").ok).toBe(false);
    expect(checkOutOfGuesses("numberPlace", 9, givens, six, "hard").ok).toBe(false);
    // Easy runs out at the board's nine; six is also taken, from a page opened before easy had nine.
    expect(checkOutOfGuesses("gomoji", 5, givens, "slate".repeat(9), "easy")).toEqual({ ok: true });
    expect(checkOutOfGuesses("gomoji", 5, givens, six, "easy")).toEqual({ ok: true });
    expect(checkOutOfGuesses("gomoji", 5, givens, "slate".repeat(8), "easy").ok).toBe(false);
  });

  it("scores from the guesses handed in, a word lost for what it found (see wordScore.test.ts)", () => {
    const crane = encodeHidden("crane");
    // Found at once, inside a minute: every letter placed on the first row, the word, five rows left, the speed.
    expect(wordPoints(5, crane, "crane", 10_000)).toBe(5 * 10 * 6 + foundBonus(5, 6) + 25 * 5 + 50);
    // Easy's nine rows weigh every guess more, and the word itself.
    expect(wordPoints(5, crane, "crane", 10_000, "easy")).toBe(5 * 10 * 9 + foundBonus(5, 9) + 25 * 8 + 50);
    // Lost: SLATE's A and E are placed on every row from the first, and nothing else is found.
    expect(wordPoints(5, crane, "slate".repeat(6), 10_000)).toBe(2 * 10 * 6);
    // Nothing a scorer can read scores nothing.
    expect(wordPoints(5, "not a word", "crane", 0)).toBe(0);
  });

  it("keeps a run's guesses as they are written, whole guesses only", () => {
    expect(decodeGomojiProgress("slatecrane", 5)).toEqual(["slate", "crane"]);
    expect(progressFits("gomoji", 5, "")).toBe(true);
    expect(progressFits("gomoji", 5, "slat")).toBe(false);
    expect(progressFits("gomoji", 5, "slate".repeat(10))).toBe(true);
    expect(progressFits("gomoji", 5, "slate".repeat(11))).toBe(false);
    expect(decodeGuesses("SLATE", 5)).toBeNull();
    expect(rowsFor(4)).toBe(5);
    // Six letters stop at the published six, not seven (`baseGuesses`).
    expect(rowsFor(6)).toBe(6);
  });
});
