import { beforeAll, describe, expect, it } from "vitest";

import { dailyYotsugoWordsOf } from "../dailyWords/dailyPools";
import { dailyWordSeed, dayAfter, dayOfDailyWordSeed } from "../dailyWords/dailyDay";
import { generatePuzzle, prepareEveryPuzzle } from "../generate";
import { markKanaGuess } from "../gomojiKana/kanaMarks";
import { keptRunAsked, puzzleAsked, puzzleQuery } from "../puzzleAddress";
import { checkOutOfGuesses, checkSolution } from "../puzzleCheck";
import { pointsFor } from "../puzzlePoints";
import { runGuessesFit } from "../puzzleProgress";
import { PUZZLE_LEVEL_LIST, PUZZLE_SPECS } from "../puzzles.constants";
import type { PuzzleKind } from "../puzzles.types";
import { freshSeed } from "../random";
import { answersFor, isWord, markGuess } from "./code";
import { hiddenWordsOf, isFutagoGivens, isYotsugoGivens, wordCountOfGivens, wordsShown } from "./futago";
import { futagoScore } from "./futagoScore";
import { isFutagoSeed } from "./futagoSeed";
import { guessesTaken } from "./guessesTaken";
import { headStartKeys } from "./headStart";
import { MOST_GUESSES, guessesFor } from "./layout";
import { wordScore } from "./wordScore";
import { wordModeDisplay, YOTSUGO_DISPLAY } from "./yotsugo";
import { YOTSUGO_SEED_BLOCK, dayOfYotsugoSeed, freshYotsugoSeed, isYotsugoSeed, yotsugoDailySeed } from "./yotsugoSeed";

beforeAll(prepareEveryPuzzle);

/**
 * GOMOJI YOTSUGO 四つ子: four hidden words at once (`yotsugo.ts`), in every
 * Gomoji language, on Futago's machinery. What is tested is what is new: four
 * words in one set of givens, the seeds that say a run is a Yotsugo's and name
 * no day of the one word's, nine guesses for five letters, and a day's four.
 */
const LETTERED = [
  { kind: "gomoji", lang: "en" },
  { kind: "gomojiMot", lang: "fr" },
  { kind: "gomojiWort", lang: "de" },
] as const;
const EVERY: readonly PuzzleKind[] = ["gomoji", "gomojiMot", "gomojiWort", "gomojiKana"];
const A_YOTSUGO = YOTSUGO_SEED_BLOCK.from + 2_345_678;
const GIVENS = "CRANE+SLATE+IRONY+POUCH";

describe("a Yotsugo's seeds say it is one, and no other seed does", () => {
  it("draws fresh Yotsugo seeds inside its block, and neither ordinary nor Futago seeds inside it", () => {
    for (let draw = 0; draw < 2000; draw += 1) {
      const seed = freshYotsugoSeed();
      expect(isYotsugoSeed(seed)).toBe(true);
      expect(isFutagoSeed(seed)).toBe(false);
      expect(isYotsugoSeed(freshSeed())).toBe(false);
    }
    expect(isYotsugoSeed(freshYotsugoSeed(() => 0))).toBe(true);
    expect(isYotsugoSeed(freshYotsugoSeed(() => 0.999_999_999))).toBe(true);
  });

  it("puts a day's Yotsugo ten million over the day's word, and reads the day back", () => {
    expect(yotsugoDailySeed("2026-10-03")).toBe(1_030_261_003);
    expect(dayOfYotsugoSeed(yotsugoDailySeed("2026-10-03"))).toBe("2026-10-03");
    expect(dayOfYotsugoSeed(yotsugoDailySeed("2099-12-31"))).toBe("2099-12-31");
  });

  it("names no day of the one word for any Yotsugo seed, and no Yotsugo day for a drawn one", () => {
    for (let draw = 0; draw < 500; draw += 1) {
      const seed = freshYotsugoSeed();
      expect(dayOfYotsugoSeed(seed)).toBeNull();
      expect(dayOfDailyWordSeed(seed)).toBeNull();
    }
    expect(dayOfDailyWordSeed(yotsugoDailySeed("2026-10-03"))).toBeNull();
    expect(isYotsugoSeed(dailyWordSeed("2026-10-03"))).toBe(false);
    // The one word's days are untouched.
    expect(dayOfDailyWordSeed(dailyWordSeed("2999-12-31"))).toBe("2999-12-31");
  });
});

describe("a Yotsugo's givens hold four words", () => {
  it("reads four different words, and never three or five, or one twice", () => {
    expect(hiddenWordsOf("gomoji", 5, GIVENS)).toEqual({ words: ["crane", "slate", "irony", "pouch"], grey: null });
    expect(hiddenWordsOf("gomoji", 5, "CRANE+SLATE+CRANE+POUCH")).toBeNull();
    expect(hiddenWordsOf("gomoji", 5, "CRANE+SLATE+IRONY")).toBeNull();
    expect(hiddenWordsOf("gomoji", 5, `${GIVENS}+TEMPO`)).toBeNull();
    expect(hiddenWordsOf("gomojiKana", 3, "サクラ+スズメ+ネコヤ+タマゴ|ヒカリ")?.words).toHaveLength(4);
  });

  it("counts its words apart from a Futago's", () => {
    expect(wordCountOfGivens(GIVENS)).toBe(4);
    expect(wordCountOfGivens("サクラ+スズメ+ネコヤ+タマゴ|ヒカ+リ")).toBe(4);
    expect(isYotsugoGivens(GIVENS)).toBe(true);
    expect(isFutagoGivens(GIVENS)).toBe(false);
    expect(isFutagoGivens("CRANE+SLATE")).toBe(true);
    expect(wordModeDisplay(4)).toBe(YOTSUGO_DISPLAY);
    expect(wordModeDisplay(1)).toBeNull();
    expect(wordsShown("gomoji", ["crane", "slate", "irony", "pouch"])).toBe("CRANE, SLATE, IRONY and POUCH");
  });
});

describe("drawing a Yotsugo in every language", () => {
  for (const { kind, lang } of LETTERED) {
    it(`${kind}: four different words of the level's list, the same from the same seed`, () => {
      for (const size of PUZZLE_SPECS[kind].sizes) {
        for (const level of PUZZLE_LEVEL_LIST) {
          for (const seed of [A_YOTSUGO, A_YOTSUGO + 11, freshYotsugoSeed(() => 0.5)]) {
            const puzzle = generatePuzzle(kind, size, level, seed);
            const hidden = hiddenWordsOf(kind, size, puzzle.givens)!;
            expect(hidden.words).toHaveLength(4);
            expect(new Set(hidden.words).size).toBe(4);
            for (const word of hidden.words) expect(answersFor(size, level === "easy", lang)).toContain(word);
            expect(generatePuzzle(kind, size, level, seed)).toEqual(puzzle);
          }
        }
      }
    });
  }

  it("gomojiKana: four different kana words, and a free grey word grey against all four below hard", () => {
    for (const size of PUZZLE_SPECS.gomojiKana.sizes) {
      for (const level of PUZZLE_LEVEL_LIST) {
        const puzzle = generatePuzzle("gomojiKana", size, level, A_YOTSUGO + size);
        const hidden = hiddenWordsOf("gomojiKana", size, puzzle.givens)!;
        expect(new Set(hidden.words).size).toBe(4);
        if (level === "hard") expect(hidden.grey).toBeNull();
        else if (hidden.grey !== null) for (const word of hidden.words) expect(markKanaGuess([...hidden.grey], [...word]).every((each) => each.mark === "miss")).toBe(true);
        expect(checkSolution("gomojiKana", size, puzzle.givens, puzzle.solution, level)).toEqual({ ok: true });
      }
    }
  });

  it("hides a day's four words at the day's Yotsugo seed, at every length, four different words", () => {
    const day = "2026-10-03";
    for (const kind of EVERY) {
      for (const size of PUZZLE_SPECS[kind].offered) {
        const four = dailyYotsugoWordsOf(kind, size, day);
        if (four === null) continue;
        expect(new Set(four).size).toBe(4);
        const puzzle = generatePuzzle(kind, size, PUZZLE_SPECS[kind].defaultLevel, yotsugoDailySeed(day));
        expect(hiddenWordsOf(kind, size, puzzle.givens)!.words).toEqual(four);
        expect(dailyYotsugoWordsOf(kind, size, dayAfter(day))).not.toEqual(four);
      }
    }
  });
});

describe("a Yotsugo's guesses", () => {
  it("gives nine for five letters on hard, as Quordle does, and one more below it, never past the most any Gomoji has", () => {
    const count = (size: number, level: "easy" | "medium" | "hard") => guessesFor("gomoji", size, level, 0, 4);
    expect([count(5, "hard"), count(5, "medium"), count(5, "easy")]).toEqual([9, 10, 10]);
    expect([count(4, "hard"), count(4, "medium"), count(4, "easy")]).toEqual([8, 9, 9]);
    for (const size of [3, 4, 5, 6]) for (const level of PUZZLE_LEVEL_LIST) for (const free of [0, 1]) expect(guessesFor("gomojiKana", size, level, free, 4)).toBeLessThanOrEqual(MOST_GUESSES);
    expect(guessesTaken("gomoji", 5, "hard", GIVENS, "craneslateironypouch")).toEqual({ used: 4, allowed: 9 });
  });

  it("checks four words found, the last guess finding the last, and an ending only when all nine are spent", () => {
    const misses = ["tempo", "bluff", "chord", "dwarf", "wight", "jumpy"].filter((word) => isWord(word, 5));
    expect(checkSolution("gomoji", 5, GIVENS, `${misses[0]}pouchironyslatecrane`, "hard")).toEqual({ ok: true });
    expect(checkSolution("gomoji", 5, GIVENS, "craneslateirony", "hard")).toEqual({ ok: false, reason: "a word was not guessed" });
    const nine = `craneslateirony${misses.slice(0, 6).join("")}`;
    expect(misses.length).toBe(6);
    expect(checkOutOfGuesses("gomoji", 5, GIVENS, nine, "hard")).toEqual({ ok: true });
    expect(checkOutOfGuesses("gomoji", 5, GIVENS, nine.slice(5), "hard")).toEqual({ ok: false, reason: "there are guesses left" });
  });

  it("scores each of the four boards on the guesses it was shown, and adds them", () => {
    const guesses = ["slate", "crane", "irony"];
    const four = futagoScore(["crane", "slate", "irony", "pouch"], guesses, 9, 30_000);
    const each = [wordScore("crane", ["slate", "crane"], 9, 30_000), wordScore("slate", ["slate"], 9, 30_000), wordScore("irony", guesses, 9, 30_000), wordScore("pouch", guesses, 9, 30_000)];
    expect(four.total).toBe(each.reduce((sum, score) => sum + score.total, 0));
    expect(pointsFor("gomoji", 5, GIVENS, 0, 0, guesses.join(""), 30_000, "hard")).toBe(four.total);
  });

  it("keeps a run of a Yotsugo's guesses by its seed", () => {
    const seed = freshYotsugoSeed();
    expect(runGuessesFit("gomoji", 5, "hard", seed, "slate".repeat(9))).toBe(true);
    expect(runGuessesFit("gomoji", 5, "hard", seed, "slate".repeat(10))).toBe(false);
    expect(runGuessesFit("gomoji", 5, "hard", freshSeed(), "slate".repeat(9))).toBe(false);
  });

  it("greys a head start's keys in none of the four words", () => {
    const puzzle = generatePuzzle("gomoji", 5, "easy", A_YOTSUGO);
    const words = hiddenWordsOf("gomoji", 5, puzzle.givens)!.words;
    for (const key of headStartKeys("gomoji", 5, puzzle.givens)) for (const word of words) expect(markGuess(key.repeat(5), word).every((mark) => mark === "miss")).toBe(true);
  });
});

describe("a Yotsugo's address", () => {
  it("asks for four words by four=1 until a seed is drawn, and from then the seed says it", () => {
    expect(puzzleAsked("gomoji", { size: "5", level: "medium", four: "1" }).four).toBe(true);
    expect(puzzleAsked("gomoji", { size: "5", level: "medium", four: "1", twins: "1" })).toMatchObject({ four: true, twins: false });
    expect(puzzleAsked("gomoji", { size: "5", level: "medium" }).four).toBeUndefined();
    expect(puzzleAsked("gomoji", { size: "5", level: "medium", seed: String(A_YOTSUGO) }).four).toBe(true);
    expect(puzzleAsked("gomoji", { size: "5", level: "medium", seed: "12345", four: "1" }).four).toBeUndefined();
    expect(puzzleAsked("numberPlace", { size: "9", level: "medium", four: "1" }).four).toBeUndefined();
    expect(puzzleQuery({ size: 5, level: "medium", seed: null, four: true })).toBe("?size=5&level=medium&four=1");
    const kept = keptRunAsked("gomoji", { size: 5, level: "medium", seed: A_YOTSUGO, checksAllowed: null, hintsAllowed: false, strict: false });
    expect(kept.four).toBe(true);
  });
});
