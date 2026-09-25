import { describe, expect, it } from "vitest";

import { checkOutOfGuesses, checkSolution } from "../puzzleCheck";
import { decodeGomojiProgress, progressFits } from "../puzzleProgress";
import { PUZZLE_LEVEL_LIST, PUZZLE_SPECS } from "../puzzles.constants";
import { answersFor, decodeGuesses, decodeHidden, isWord } from "./code";
import { generateGomoji } from "./generate";

/**
 * GOMOJI MOT (French) AND GOMOJI WORT (German): the same engine as English's
 * Gomoji (`generate.test.ts`), reused through a language parameter rather than
 * copied. What is worth testing here is what is DIFFERENT about these two —
 * the alphabet each is spelled with — not the shared mechanics generate.test.ts
 * already covers.
 */
describe("drawing a Gomoji Mot (French)", () => {
  for (const size of PUZZLE_SPECS.gomojiMot.sizes) {
    for (const level of PUZZLE_LEVEL_LIST) {
      it(`${size} letters, ${level}: a French word of the list, the same from the same seed`, () => {
        for (const seed of [1, 2, 3, 99]) {
          const puzzle = generateGomoji(size, level, seed, "fr", "gomojiMot");
          expect(puzzle.kind).toBe("gomojiMot");
          const word = decodeHidden(puzzle.givens, size, "fr")!;
          expect(word).toHaveLength(size);
          expect(isWord(word, size, "fr")).toBe(true);
          expect(answersFor(size, level === "easy", "fr")).toContain(word);
          expect(generateGomoji(size, level, seed, "fr", "gomojiMot")).toEqual(puzzle);
        }
      });
    }
  }

  it("draws only plain A–Z: accents are folded away when the list is written, and œ/æ words are left out entirely", () => {
    for (const size of [4, 5]) {
      for (const word of answersFor(size, false, "fr")) {
        expect(word).toMatch(/^[a-z]+$/);
        expect(word).not.toMatch(/[œæ]/);
      }
    }
  });

  it("checks a French word the way English's is checked, through the same server function", () => {
    const puzzle = generateGomoji(5, "medium", 7, "fr", "gomojiMot");
    expect(checkSolution("gomojiMot", 5, puzzle.givens, puzzle.solution, "medium")).toEqual({ ok: true });
    expect(checkSolution("gomojiMot", 5, puzzle.givens, `zzzzz${puzzle.solution}`, "medium")).toEqual({ ok: false, reason: "zzzzz is not in the word list" });
    // An English guess with no French meaning is refused as an unknown word, not accepted.
    expect(checkSolution("gomojiMot", 5, puzzle.givens, "zzzzz", "medium")).toEqual({ ok: false, reason: "zzzzz is not in the word list" });
  });
});

describe("drawing a Gomoji Wort (German)", () => {
  for (const size of PUZZLE_SPECS.gomojiWort.sizes) {
    for (const level of PUZZLE_LEVEL_LIST) {
      it(`${size} letters, ${level}: a German word of the list, the same from the same seed`, () => {
        for (const seed of [1, 2, 3, 99]) {
          const puzzle = generateGomoji(size, level, seed, "de", "gomojiWort");
          expect(puzzle.kind).toBe("gomojiWort");
          const word = decodeHidden(puzzle.givens, size, "de")!;
          expect(word).toHaveLength(size);
          expect(isWord(word, size, "de")).toBe(true);
          expect(answersFor(size, level === "easy", "de")).toContain(word);
        }
      });
    }
  }

  it("keeps Ä, Ö and Ü as letters of their own, and leaves out any word spelled with ß", () => {
    for (const size of [4, 5]) {
      for (const word of answersFor(size, false, "de")) {
        expect(word).toMatch(/^[a-zäöü]+$/);
        expect(word).not.toContain("ß");
      }
    }
  });

  it("decodes and checks a German word carrying an umlaut", () => {
    // A German answer list at length 4 or 5 is certain to hold at least one umlaut word (wärt, wähl, öfen…).
    const umlautWord = [...answersFor(4, false, "de"), ...answersFor(5, false, "de")].find((word) => /[äöü]/.test(word))!;
    expect(umlautWord).toBeDefined();
    const size = umlautWord.length;
    const givens = umlautWord.toUpperCase();
    expect(decodeHidden(givens, size, "de")).toBe(umlautWord);
    // The plain A–Z decoder does not accept an umlaut: the two alphabets are kept apart.
    expect(decodeHidden(givens, size)).toBeNull();
    expect(isWord(umlautWord, size, "de")).toBe(true);
    expect(decodeGuesses(umlautWord, size, "de")).toEqual([umlautWord]);
    // Refused because the word was found, not for want of a level: the check reads the German alphabet.
    expect(checkOutOfGuesses("gomojiWort", size, givens, umlautWord.repeat(size + 1), "hard")).toEqual({ ok: false, reason: "the word was found" });
  });

  it("keeps a run's guesses in German's own alphabet", () => {
    const puzzle = generateGomoji(5, "medium", 12, "de", "gomojiWort");
    const code = puzzle.solution;
    expect(decodeGomojiProgress(code, 5, "de")).toEqual([puzzle.solution]);
    expect(progressFits("gomojiWort", 5, code)).toBe(true);
    expect(progressFits("gomojiWort", 5, "zzzz")).toBe(false);
  });
});
