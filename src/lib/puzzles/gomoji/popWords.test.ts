import { describe, expect, it } from "vitest";

import { checkSolution } from "../puzzleCheck";
import { dailyLengths } from "../dailyWords/dailyPools";
import { PUZZLE_SPECS, sizesOffered } from "../puzzles.constants";
import { answersFor, isWord, languageOf } from "./code";
import { generateGomoji } from "./generate";
import { POP_OWN_GUESS_LENGTHS, isPopWord, loadPopGuesses, popAnswers, popCategoryOf } from "./popWords";
import { POP_CATEGORIES } from "./words.pop.data";

/**
 * POP GOMOJI (gomojiPop): a pop-culture Gomoji whose every answer shows its
 * category as the clue, three to seven letters, with the English dictionary
 * and its own list as the guesses.
 */
describe("Pop Gomoji's words", () => {
  it("has answers at every length from three to seven, each a to z of its length with a category", () => {
    expect(sizesOffered("gomojiPop")).toEqual([3, 4, 5, 6, 7]);
    for (const size of sizesOffered("gomojiPop")) {
      const words = popAnswers(size);
      expect(words.length, `${size} letters`).toBeGreaterThan(50);
      for (const word of words) {
        expect(word).toMatch(new RegExp(`^[a-z]{${size}}$`));
        expect(POP_CATEGORIES, word).toContain(popCategoryOf(word));
      }
      expect(new Set(words).size, `${size} letters twice`).toBe(words.length);
    }
  });

  it("shows the category a word belongs to, and nothing for a word it does not hide", () => {
    expect(popCategoryOf("pikachu")).toBe("Pokemon");
    expect(popCategoryOf("zeus")).toBe("Greek deity");
    expect(popCategoryOf("sushi")).toBe("Japanese food");
    expect(popCategoryOf("table")).toBeNull();
  });

  it("hides nothing a children's site keeps out", () => {
    const all = sizesOffered("gomojiPop").flatMap((size) => popAnswers(size));
    for (const word of ["gyatt", "twerk", "doom", "halo", "skynet", "trojan", "cracker", "gin"]) expect(all, word).not.toContain(word);
  });

  it("takes its own answers and English words as guesses, and refuses what is neither", () => {
    expect(isWord("mario", 5, "pop")).toBe(true);
    expect(isWord("house", 5, "pop")).toBe(true);
    expect(isWord("xqzvw", 5, "pop")).toBe(false);
    expect(answersFor(5, true, "pop")).toEqual(popAnswers(5));
    expect(languageOf("gomojiPop")).toBe("pop");
  });

  it("refuses to judge a three- or seven-letter guess before its dictionary is fetched, then judges it", async () => {
    expect(POP_OWN_GUESS_LENGTHS).toEqual([3, 7]);
    await loadPopGuesses(3);
    await loadPopGuesses(7);
    expect(isPopWord("cat", 3)).toBe(true);
    expect(isPopWord("ash", 3)).toBe(true);
    expect(isPopWord("example", 7)).toBe(true);
    expect(isPopWord("pikachu", 7)).toBe(true);
    expect(isPopWord("zzzzzzz", 7)).toBe(false);
  });

  it("makes a puzzle at every length and level whose word is an answer, found by a check the server would pass", async () => {
    for (const size of sizesOffered("gomojiPop")) await loadPopGuesses(size);
    for (const size of sizesOffered("gomojiPop")) {
      for (const level of PUZZLE_SPECS.gomojiPop.levels) {
        const puzzle = generateGomoji(size, level, 7, "pop", "gomojiPop");
        expect(puzzle.kind).toBe("gomojiPop");
        expect(popAnswers(size)).toContain(puzzle.solution);
        expect(checkSolution("gomojiPop", size, puzzle.givens, puzzle.solution, level), `${size} ${level}`).toEqual({ ok: true });
      }
    }
  });

  it("has a word of the day at every length, both shelves", () => {
    expect(dailyLengths("gomojiPop")).toEqual([3, 4, 5, 6, 7]);
  });
});
