import { beforeAll, describe, expect, it } from "vitest";

import "../gomoji/wordDataModule";
import { isWord } from "../gomoji/code";
import { loadWordData } from "../gomoji/wordData";
import { generatePuzzle } from "../generate";
import { checkSolution } from "../puzzleCheck";
import { checkHachinosu } from "./check";
import { encodeHive, HIVE_LANGUAGES, lettersProblem, readFound, readHive, wordPoints } from "./code";
import { commonWordsOf, generateHachinosu } from "./generate";

beforeAll(async () => {
  await Promise.all([loadWordData("en"), loadWordData("fr"), loadWordData("de")]);
});

describe("hachinosu: what makes it different", () => {
  const hive = { centre: "a", letters: "treslo", goal: 7 };
  const givens = encodeHive(hive);

  it("takes a word only of the hive's letters, with its centre, and of at least four letters", () => {
    expect(lettersProblem(hive, "rat")).toBe("short");
    expect(lettersProblem(hive, "rose")).toBe("centre");
    expect(lettersProblem(hive, "train")).toBe("letters");
    expect(lettersProblem(hive, "alto")).toBeNull();
    // A letter may be used as often as you like.
    expect(lettersProblem(hive, "lalala")).toBeNull();
  });

  it("scores a four-letter word 1, and a longer one its length", () => {
    expect(wordPoints("alto")).toBe(1);
    expect(wordPoints("later")).toBe(5);
    expect(wordPoints("relate")).toBe(6);
  });

  it("finishes at the goal and not before, on words of the list, none twice and none after it", () => {
    expect(checkHachinosu(1, givens, "alto,later,rates").ok).toBe(true);
    expect(checkHachinosu(1, givens, "alto").ok).toBe(false);
    // A word on no list.
    expect(checkHachinosu(1, givens, "alto,aaaaa,later").ok).toBe(false);
    // The same word twice.
    expect(checkHachinosu(1, givens, "later,later").ok).toBe(false);
    // Past the goal with a word to spare.
    expect(checkHachinosu(1, givens, "later,rates,alto").ok).toBe(false);
    // Out of the hive.
    expect(checkHachinosu(1, givens, "train,later,rates").ok).toBe(false);
    // Not a hive.
    expect(checkHachinosu(1, "aaaaaaa.7", "later,rates").ok).toBe(false);
    expect(checkHachinosu(9, givens, "later,rates").ok).toBe(false);
  });

  it("holds the words to the language of its size", () => {
    expect(isWord("later", 5, HIVE_LANGUAGES[1]!)).toBe(true);
    expect(isWord("later", 5, HIVE_LANGUAGES[3]!)).toBe(false);
    expect(checkHachinosu(3, givens, "alto,later,rates").ok).toBe(false);
  });

  it("makes every language and level a hive of seven different letters, finishable by common words alone, the goal rising with the level", () => {
    for (const size of [1, 2, 3]) {
      for (const level of ["easy", "medium", "hard"] as const) {
        for (const seed of [3, 500, 20261030]) {
          const puzzle = generatePuzzle("hachinosu", size, level, seed);
          const asked = readHive(puzzle.givens)!;
          expect(asked).not.toBeNull();
          const common = commonWordsOf(size, asked.centre, asked.letters);
          const worth = common.reduce((sum, word) => sum + wordPoints(word), 0);
          expect(worth, `${size} ${level} ${seed}`).toBeGreaterThanOrEqual(asked.goal);
          expect(common.every((word) => word.includes(asked.centre))).toBe(true);
          expect(checkSolution("hachinosu", size, puzzle.givens, puzzle.solution, level)).toEqual({ ok: true });
          expect(readFound(puzzle.solution)!.every((word) => common.includes(word))).toBe(true);
        }
      }
    }
    const mean = (level: "easy" | "hard") => Array.from({ length: 40 }, (_, at) => readHive(generateHachinosu(1, level, at * 13 + 1).givens)!.goal).reduce((sum, goal) => sum + goal, 0);
    expect(mean("hard")).toBeGreaterThan(mean("easy"));
  });

  it("makes one seed's hive in every browser, and a different hive in each language on one day", () => {
    expect(generatePuzzle("hachinosu", 1, "medium", 20261030)).toEqual(generatePuzzle("hachinosu", 1, "medium", 20261030));
    const today = [1, 2, 3].map((size) => generatePuzzle("hachinosu", size, "medium", 20261030).givens);
    expect(new Set(today).size).toBe(3);
  });

  it("reads a hive and a list of words only when they are what they say", () => {
    expect(readHive("aelnrst.42")).toEqual({ centre: "a", letters: "elnrst", goal: 42 });
    expect(readHive("aelnrsa.42")).toBeNull();
    expect(readHive("aelnrst.0")).toBeNull();
    expect(readHive("aelnrst")).toBeNull();
    expect(readFound("")).toEqual([]);
    expect(readFound("rain,train")).toEqual(["rain", "train"]);
    expect(readFound("rain,rain")).toBeNull();
    expect(readFound("cat")).toBeNull();
    expect(readFound("ABCD")).toBeNull();
  });
});
