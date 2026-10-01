import { beforeAll, describe, expect, it } from "vitest";

import { dailyYotsugoWordsOf } from "../dailyWords/dailyPools";
import { dailyWordSeed, dayAfter, dayOfDailyWordSeed } from "../dailyWords/dailyDay";
import { generatePuzzle } from "../generate";
import { prepareEveryPuzzle } from "../prepareEvery";
import { markKanaGuess, wordScore } from "@johnmorrisdotca/kotoba";
import { splitLetterKeyMarks } from "../keyMarks";
import { keptRunAsked, puzzleAsked, puzzleQuery } from "../puzzleAddress";
import { checkOutOfGuesses, checkSolution } from "../puzzleCheck";
import { pointsFor } from "../puzzlePoints";
import { progressFits, runGuessesFit } from "../puzzleProgress";
import { PUZZLE_LEVEL_LIST, PUZZLE_SPECS } from "../puzzles.constants";
import type { PuzzleKind } from "../puzzles.types";
import { freshSeed, seededRandom } from "../random";
import { answersFor, isWord, markGuess } from "./code";
import { boardGuesses, everyWordFound, hiddenWordsOf, wordCountOfGivens, wordsShown } from "./futago";
import { futagoScore } from "./futagoScore";
import { FUTAGO_SEED_BLOCK, freshFutagoSeed, futagoDailySeed, isFutagoSeed } from "./futagoSeed";
import { guessesTaken } from "./guessesTaken";
import { MOST_GUESSES, gomojiLayout, guessesFor } from "./layout";
import { freshSeedOf, wordCountOfSeed } from "./wordsSeed";
import { YOTSUGO_SEED_BLOCK, dayOfYotsugoSeed, freshYotsugoSeed, isYotsugoSeed, yotsugoDailySeed } from "./yotsugoSeed";

beforeAll(prepareEveryPuzzle);

/**
 * GOMOJI YOTSUGO 四つ子: four hidden words at once (`yotsugo.ts`), in every
 * Gomoji language. What is tested is what is new: four words in one set of
 * givens, a guess marked in each quarter until that quarter's word is found,
 * a key's four corners, the seeds that say a run hides four, a day's four
 * words, and the check and the score over four. The marking of one guess
 * against one word is every Gomoji's, and `generate.test.ts` covers it.
 */
const LETTERED = [
  { kind: "gomoji", lang: "en" },
  { kind: "gomojiMot", lang: "fr" },
  { kind: "gomojiWort", lang: "de" },
  { kind: "gomojiPop", lang: "pop" },
] as const;
const EVERY: readonly PuzzleKind[] = ["gomoji", "gomojiMot", "gomojiWort", "gomojiPop", "gomojiKana"];
const A_YOTSUGO = YOTSUGO_SEED_BLOCK.from + 2_345_678;
const GIVENS = "CRANE+SLATE+PIOUS+TEMPO";
const WORDS = ["crane", "slate", "pious", "tempo"];

describe("a Yotsugo's seeds say it is one, and no other seed does", () => {
  it("draws fresh Yotsugo seeds inside its block, and neither an ordinary nor a Futago seed inside it", () => {
    for (let draw = 0; draw < 2000; draw += 1) {
      expect(isYotsugoSeed(freshYotsugoSeed())).toBe(true);
      expect(isFutagoSeed(freshYotsugoSeed())).toBe(false);
      expect(isYotsugoSeed(freshSeed())).toBe(false);
      expect(isYotsugoSeed(freshFutagoSeed())).toBe(false);
    }
    expect(isYotsugoSeed(freshYotsugoSeed(() => 0))).toBe(true);
    expect(isYotsugoSeed(freshYotsugoSeed(() => 0.999_999_999))).toBe(true);
    // The two blocks never meet.
    expect(YOTSUGO_SEED_BLOCK.from).toBeGreaterThanOrEqual(FUTAGO_SEED_BLOCK.from + FUTAGO_SEED_BLOCK.size);
  });

  it("puts a day's Yotsugo ten million over the day's word, and reads the day back", () => {
    expect(yotsugoDailySeed("2026-10-03")).toBe(1_030_261_003);
    expect(dayOfYotsugoSeed(yotsugoDailySeed("2026-10-03"))).toBe("2026-10-03");
    expect(dayOfYotsugoSeed(yotsugoDailySeed("2099-12-31"))).toBe("2099-12-31");
    for (let draw = 0; draw < 500; draw += 1) expect(dayOfYotsugoSeed(freshYotsugoSeed())).toBeNull();
  });

  it("is never read as a day's one word, and a day's word or Futago is never read as a Yotsugo", () => {
    expect(dayOfDailyWordSeed(yotsugoDailySeed("2026-10-03"))).toBeNull();
    expect(dayOfDailyWordSeed(A_YOTSUGO)).toBeNull();
    // The daily words still name every day to the end of 2999.
    expect(dayOfDailyWordSeed(dailyWordSeed("2999-12-31"))).toBe("2999-12-31");
    expect(isYotsugoSeed(dailyWordSeed("2026-10-03"))).toBe(false);
    expect(isYotsugoSeed(futagoDailySeed("2026-10-03"))).toBe(false);
  });

  it("says how many words a seed hides, and draws a seed for each count", () => {
    expect(wordCountOfSeed(A_YOTSUGO)).toBe(4);
    expect(wordCountOfSeed(freshFutagoSeed())).toBe(2);
    expect(wordCountOfSeed(12345)).toBe(1);
    for (const count of [1, 2, 4] as const) expect(wordCountOfSeed(freshSeedOf(count))).toBe(count);
  });
});

describe("a Yotsugo's givens hold four words", () => {
  it("reads four different words, and refuses a word twice, three words or five", () => {
    expect(hiddenWordsOf("gomoji", 5, GIVENS)).toEqual({ words: WORDS, grey: null });
    expect(hiddenWordsOf("gomoji", 5, "CRANE+SLATE+PIOUS+CRANE")).toBeNull();
    expect(hiddenWordsOf("gomoji", 5, "CRANE+SLATE+PIOUS")).toBeNull();
    expect(hiddenWordsOf("gomoji", 5, `${GIVENS}+IRONY`)).toBeNull();
    expect(hiddenWordsOf("gomojiKana", 3, "サクラ+スズメ+カメラ+ミカン|ネコヤ")).toEqual({ words: ["さくら", "すずめ", "かめら", "みかん"], grey: "ねこや" });
    expect(wordCountOfGivens(GIVENS)).toBe(4);
    expect(wordCountOfGivens("CRANE")).toBe(1);
  });

  it("prints four words as a list", () => {
    expect(wordsShown("gomoji", WORDS)).toBe("CRANE, SLATE, PIOUS and TEMPO");
    expect(wordsShown("gomoji", WORDS.slice(0, 2))).toBe("CRANE and SLATE");
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
            expect(puzzle.solution).toBe(hidden.words.join(""));
            expect(generatePuzzle(kind, size, level, seed)).toEqual(puzzle);
            expect(checkSolution(kind, size, puzzle.givens, puzzle.solution, level)).toEqual({ ok: true });
          }
        }
      }
    });
  }

  it("gomojiKana: four different kana words, and a free grey word grey against all four on easy and medium", () => {
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

  it("draws a Futago's two exactly as it always has, so no kept Futago changes its words", () => {
    const seed = FUTAGO_SEED_BLOCK.from + 1_234_567;
    const words = answersFor(5, false, "en");
    const random = seededRandom(seed);
    const first = Math.floor(random() * words.length);
    const second = Math.floor(random() * (words.length - 1));
    const before = [words[first]!, words[second >= first ? second + 1 : second]!];
    expect(hiddenWordsOf("gomoji", 5, generatePuzzle("gomoji", 5, "medium", seed).givens)!.words).toEqual(before);
  });

  it("hides a day's four words at the day's Yotsugo seed, at every length, four different words and other ones tomorrow", () => {
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

describe("a Yotsugo's board and its guesses", () => {
  it("gives three guesses more than one word at hard, four at medium and five at easy", () => {
    const count = (size: number, level: (typeof PUZZLE_LEVEL_LIST)[number]) => guessesFor("gomoji", size, level, 0, 4);
    expect([count(5, "hard"), count(5, "medium"), count(5, "easy")]).toEqual([9, 10, 11]);
    expect([count(4, "hard"), count(4, "medium"), count(4, "easy")]).toEqual([9, 10, 11]);
    expect([count(6, "hard"), count(6, "medium"), count(6, "easy")]).toEqual([9, 10, 11]);
    // Kana's free grey word is one of the eleven rows.
    expect(guessesFor("gomojiKana", 3, "easy", 1, 4)).toBe(10);
  });

  it("is two words wide exactly, every row inside it, never more guesses than a kept run may hold", () => {
    for (const kind of ["gomoji", "gomojiKana"] as const) {
      for (const size of kind === "gomoji" ? [3, 4, 5, 6, 7] : PUZZLE_SPECS.gomojiKana.sizes) {
        for (const level of PUZZLE_LEVEL_LIST) {
          for (const free of kind === "gomojiKana" && level !== "hard" ? [0, 1] : [0]) {
            const layout = gomojiLayout(kind, size, level, free, 4);
            expect(layout.cols).toBe(2 * size);
            expect(layout.left).toBe(0);
            expect(layout.top + free + layout.guesses).toBeLessThanOrEqual(layout.rows);
            expect(layout.guesses).toBeLessThanOrEqual(MOST_GUESSES);
          }
        }
      }
    }
    // Five letters at hard: ten across, eleven down, nine rows of play and the spare ones over them.
    expect(gomojiLayout("gomoji", 5, "hard", 0, 4)).toMatchObject({ cols: 10, rows: 11, top: 1, left: 0, guesses: 9 });
  });
});

describe("a guess against four words", () => {
  const guesses = ["irony", "crane", "slate", "pious"];

  it("is shown in every quarter until the quarter's word is found, and in none after", () => {
    const rows = WORDS.map((word) => boardGuesses(guesses, word));
    expect(rows).toEqual([["irony", "crane"], ["irony", "crane", "slate"], guesses, guesses]);
    // Each quarter marks the guess against its own word.
    expect(markGuess("irony", "pious")).toEqual(["near", "miss", "hit", "miss", "miss"]);
    expect(markGuess("irony", "tempo")).toEqual(["miss", "miss", "near", "miss", "miss"]);
    expect(everyWordFound(guesses, WORDS)).toBe(false);
    expect(everyWordFound([...guesses, "tempo"], WORDS)).toBe(true);
  });

  it("splits each key four ways, each corner what its own quarter's guesses say, a found quarter's frozen when it was found", () => {
    const split = splitLetterKeyMarks(guesses, WORDS);
    expect(split).toHaveLength(4);
    const corners = (letter: string) => split.map((marks) => marks.get(letter));
    // C: in CRANE's place, not in SLATE (from CRANE), not in PIOUS or TEMPO.
    expect(corners("c")).toEqual(["hit", "miss", "miss", "miss"]);
    // P was guessed only after CRANE and SLATE were found: their corners never heard of it.
    expect(corners("p")).toEqual([undefined, undefined, "hit", "near"]);
    // A head start is grey in every corner.
    expect(splitLetterKeyMarks([], WORDS, ["z"]).map((marks) => marks.get("z"))).toEqual(["miss", "miss", "miss", "miss"]);
  });
});

describe("checking a Yotsugo, as the server does", () => {
  const others = ["irony", "bluff", "chord", "dwarf", "wight", "nymph", "vouch", "gawky"].filter((word) => isWord(word, 5) && !WORDS.includes(word));

  it("accepts all four found, in any order, the last guess finding the last", () => {
    expect(checkSolution("gomoji", 5, GIVENS, "tempocranepiousslate", "hard")).toEqual({ ok: true });
    expect(checkSolution("gomoji", 5, GIVENS, `${others[0]}craneslatepioustempo`, "hard")).toEqual({ ok: true });
  });

  it("refuses a word never guessed, guesses after all four, a wrong word, and more guesses than nine", () => {
    expect(checkSolution("gomoji", 5, GIVENS, "craneslatepious", "hard")).toEqual({ ok: false, reason: "a word was not guessed" });
    expect(checkSolution("gomoji", 5, GIVENS, `craneslatepioustempo${others[0]}`, "hard")).toEqual({ ok: false, reason: "guesses go on after all four words were found" });
    expect(checkSolution("gomoji", 5, GIVENS, "zzzzzcraneslatepioustempo", "hard")).toEqual({ ok: false, reason: "zzzzz is not in the word list" });
    expect(checkSolution("gomoji", 5, GIVENS, `${others.slice(0, 6).join("")}craneslatepioustempo`, "hard")).toEqual({ ok: false, reason: "more guesses than the rows allow" });
  });

  it("ends one unsolved only when all nine rows are spent and a word is still hidden", () => {
    expect(others.length).toBeGreaterThanOrEqual(6);
    const nine = `craneslatepious${others.slice(0, 6).join("")}`;
    expect(checkOutOfGuesses("gomoji", 5, GIVENS, nine, "hard")).toEqual({ ok: true });
    expect(checkOutOfGuesses("gomoji", 5, GIVENS, nine.slice(5), "hard")).toEqual({ ok: false, reason: "there are guesses left" });
    expect(checkOutOfGuesses("gomoji", 5, GIVENS, `craneslatepioustempo${others.slice(0, 5).join("")}`, "hard")).toEqual({ ok: false, reason: "all four words were found" });
  });
});

describe("scoring, counting and keeping a Yotsugo", () => {
  it("scores each quarter on the guesses it was shown, and adds the four", () => {
    const guesses = ["irony", "crane", "slate", "pious", "tempo"];
    const total = futagoScore(WORDS, guesses, 9, 40_000).total;
    const each = WORDS.map((word) => wordScore(word, boardGuesses(guesses, word), 9, 40_000).total);
    expect(total).toBe(each.reduce((sum, points) => sum + points, 0));
    expect(pointsFor("gomoji", 5, GIVENS, 0, 0, guesses.join(""), 40_000, "hard")).toBe(total);
    // With no level, hard's nine are the rows it is weighed by.
    expect(pointsFor("gomoji", 5, GIVENS, 0, 0, guesses.join(""), 40_000)).toBe(total);
  });

  it("counts guesses against its own nine", () => {
    expect(guessesTaken("gomoji", 5, "hard", GIVENS, "irony" + WORDS.join(""))).toEqual({ used: 5, allowed: 9 });
  });

  it("keeps a run of up to its own guesses, eleven at easy being the most any Gomoji has", () => {
    const yotsugo = freshYotsugoSeed();
    const one = freshSeed();
    expect(runGuessesFit("gomoji", 5, "easy", yotsugo, "slate".repeat(11))).toBe(true);
    expect(runGuessesFit("gomoji", 5, "easy", yotsugo, "slate".repeat(12))).toBe(false);
    expect(runGuessesFit("gomoji", 5, "hard", yotsugo, "slate".repeat(10))).toBe(false);
    expect(runGuessesFit("gomoji", 5, "easy", one, "slate".repeat(11))).toBe(false);
    expect(progressFits("gomoji", 6, "planet".repeat(11))).toBe(true);
    expect(progressFits("gomoji", 6, "planet".repeat(12))).toBe(false);
  });

  it("is asked for by quadruplets=1 until a seed is drawn, then the seed says it, and a kept run comes back as four", () => {
    expect(puzzleAsked("gomoji", { size: "5", level: "hard", quadruplets: "1" }).words).toBe(4);
    expect(puzzleAsked("gomoji", { size: "5", level: "hard", seed: String(A_YOTSUGO) }).words).toBe(4);
    expect(puzzleAsked("gomoji", { size: "5", level: "hard", seed: "12345", quadruplets: "1" }).words).toBe(1);
    expect(puzzleAsked("numberPlace", { size: "9", level: "hard", quadruplets: "1" }).words).toBe(1);
    expect(puzzleQuery({ size: 5, level: "hard", seed: null, words: 4 })).toBe("?size=5&level=hard&quadruplets=1");
    expect(keptRunAsked("gomoji", { size: 5, level: "hard", seed: A_YOTSUGO, checksAllowed: null, hintsAllowed: false, strict: false }).words).toBe(4);
  });
});
