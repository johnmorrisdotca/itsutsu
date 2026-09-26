import { beforeAll, describe, expect, it } from "vitest";

import { dailyFutagoWordsOf, dailyWordOf } from "../dailyWords/dailyPools";
import { dailyWordSeed, dayAfter, dayOfDailyWordSeed } from "../dailyWords/dailyDay";
import { generatePuzzle, prepareEveryPuzzle } from "../generate";
import { decodeKanaGivens } from "../gomojiKana/kanaCode";
import { markKanaGuess } from "../gomojiKana/kanaMarks";
import { kanaWordsOf } from "../gomojiKana/kanaWords";
import { puzzleAsked, puzzleQuery } from "../puzzleAddress";
import { checkOutOfGuesses, checkSolution } from "../puzzleCheck";
import { pointsFor } from "../puzzlePoints";
import { decodeGomojiProgress, progressFits, runGuessesFit } from "../puzzleProgress";
import { PUZZLE_LEVEL_LIST, PUZZLE_SPECS } from "../puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { freshSeed } from "../random";
import { answersFor, decodeHidden, isWord, markGuess } from "./code";
import { boardGuesses, everyWordFound, hiddenWordsOf, wordRowsOf } from "./futago";
import { futagoScore } from "./futagoScore";
import { FUTAGO_SEED_BLOCK, dayOfFutagoSeed, freshFutagoSeed, futagoDailySeed, isFutagoSeed } from "./futagoSeed";
import { guessesTaken } from "./guessesTaken";
import { headStartKeys } from "./headStart";
import { MOST_GUESSES, guessesFor } from "./layout";
import { wordScore } from "./wordScore";

beforeAll(prepareEveryPuzzle);

/**
 * GOMOJI FUTAGO 双子: two hidden words at once (`futago.ts`), in every Gomoji
 * language. What is tested here is what is new — two words in one set of
 * givens, a guess counted on each board until that board is found, the seeds
 * that say a run is a Futago's, and a day's two words — not the marking every
 * Gomoji shares, which `generate.test.ts` already covers.
 */
const LETTERED = [
  { kind: "gomoji", lang: "en" },
  { kind: "gomojiMot", lang: "fr" },
  { kind: "gomojiWort", lang: "de" },
] as const;
const EVERY: readonly PuzzleKind[] = ["gomoji", "gomojiMot", "gomojiWort", "gomojiKana"];
const A_FUTAGO = FUTAGO_SEED_BLOCK.from + 1_234_567;

describe("a Futago's seeds say it is one, and no other seed does", () => {
  it("draws fresh Futago seeds inside its block, and ordinary seeds never inside it", () => {
    for (let draw = 0; draw < 2000; draw += 1) {
      expect(isFutagoSeed(freshFutagoSeed())).toBe(true);
      expect(isFutagoSeed(freshSeed())).toBe(false);
    }
    expect(isFutagoSeed(freshFutagoSeed(() => 0))).toBe(true);
    expect(isFutagoSeed(freshFutagoSeed(() => 0.999_999_999))).toBe(true);
  });

  it("puts a day's Futago twenty million under the day's word, and reads the day back", () => {
    expect(futagoDailySeed("2026-10-03")).toBe(1_000_261_003);
    expect(dailyWordSeed("2026-10-03") - futagoDailySeed("2026-10-03")).toBe(20_000_000);
    expect(dayOfFutagoSeed(futagoDailySeed("2026-10-03"))).toBe("2026-10-03");
    expect(dayOfFutagoSeed(futagoDailySeed("2099-12-31"))).toBe("2099-12-31");
  });

  it("names no day for a drawn Futago, and a one-word Gomoji names no day for any Futago seed", () => {
    for (let draw = 0; draw < 500; draw += 1) expect(dayOfFutagoSeed(freshFutagoSeed())).toBeNull();
    expect(dayOfDailyWordSeed(futagoDailySeed("2026-10-03"))).toBeNull();
    expect(dayOfDailyWordSeed(A_FUTAGO)).toBeNull();
    expect(isFutagoSeed(dailyWordSeed("2026-10-03"))).toBe(false);
    expect(dayOfFutagoSeed(dailyWordSeed("2026-10-03"))).toBeNull();
  });
});

describe("a Futago's givens hold two words", () => {
  it("reads one word or two, and refuses the same word twice or three words", () => {
    expect(hiddenWordsOf("gomoji", 5, "CRANE")).toEqual({ words: ["crane"], grey: null });
    expect(hiddenWordsOf("gomoji", 5, "CRANE+SLATE")).toEqual({ words: ["crane", "slate"], grey: null });
    expect(hiddenWordsOf("gomoji", 5, "CRANE+CRANE")).toBeNull();
    expect(hiddenWordsOf("gomoji", 5, "CRANE+SLATE+IRONY")).toBeNull();
    expect(hiddenWordsOf("gomojiWort", 5, "HÖREN+BLATT")).toEqual({ words: ["hören", "blatt"], grey: null });
    expect(hiddenWordsOf("gomojiKana", 3, "サクラ+スズメ|ネコヤ")).toEqual({ words: ["さくら", "すずめ"], grey: "ねこや" });
    expect(hiddenWordsOf("gomojiKana", 3, "サクラ+スズメ")).toEqual({ words: ["さくら", "すずめ"], grey: null });
  });

  it("is refused by every one-word reader, so nothing written for one word takes a Futago for one", () => {
    expect(decodeHidden("CRANE+SLATE", 5)).toBeNull();
    expect(decodeKanaGivens("サクラ+スズメ|ネコヤ", 3)).toBeNull();
  });
});

describe("drawing a Futago in every language", () => {
  for (const { kind, lang } of LETTERED) {
    it(`${kind}: two different words of the level's list, the same from the same seed`, () => {
      for (const size of PUZZLE_SPECS[kind].sizes) {
        for (const level of PUZZLE_LEVEL_LIST) {
          for (const seed of [A_FUTAGO, A_FUTAGO + 7, freshFutagoSeed(() => 0.5)]) {
            const puzzle = generatePuzzle(kind, size, level, seed);
            const hidden = hiddenWordsOf(kind, size, puzzle.givens)!;
            expect(hidden.words).toHaveLength(2);
            expect(hidden.words[0]).not.toBe(hidden.words[1]);
            for (const word of hidden.words) expect(answersFor(size, level === "easy", lang)).toContain(word);
            expect(puzzle.solution).toBe(hidden.words.join(""));
            expect(generatePuzzle(kind, size, level, seed)).toEqual(puzzle);
          }
        }
      }
    });
  }

  it("gomojiKana: two different kana words, and a free grey word grey against both on easy and medium", () => {
    for (const size of PUZZLE_SPECS.gomojiKana.sizes) {
      for (const level of PUZZLE_LEVEL_LIST) {
        const puzzle = generatePuzzle("gomojiKana", size, level, A_FUTAGO + size);
        const hidden = hiddenWordsOf("gomojiKana", size, puzzle.givens)!;
        expect(hidden.words).toHaveLength(2);
        expect(hidden.words[0]).not.toBe(hidden.words[1]);
        if (level === "hard") expect(hidden.grey).toBeNull();
        else for (const word of hidden.words) expect(markKanaGuess([...hidden.grey!], [...word]).every((each) => each.mark === "miss")).toBe(true);
        expect(checkSolution("gomojiKana", size, puzzle.givens, puzzle.solution, level)).toEqual({ ok: true });
      }
    }
  });

  it("hides a day's two words at the day's Futago seed, at every length, and never one word twice", () => {
    const day = "2026-10-03";
    for (const kind of EVERY) {
      for (const size of PUZZLE_SPECS[kind].offered) {
        const pair = dailyFutagoWordsOf(kind, size, day);
        if (pair === null) continue;
        expect(pair[0]).not.toBe(pair[1]);
        const puzzle = generatePuzzle(kind, size, PUZZLE_SPECS[kind].defaultLevel, futagoDailySeed(day));
        expect(hiddenWordsOf(kind, size, puzzle.givens)!.words).toEqual(pair);
        // The next day's two are other words.
        expect(dailyFutagoWordsOf(kind, size, dayAfter(day))).not.toEqual(pair);
        // And the day's one word is its own seed's, as ever.
        expect(hiddenWordsOf(kind, size, generatePuzzle(kind, size, "medium", dailyWordSeed(day)).givens)!.words).toEqual([dailyWordOf(kind, size, day)!.word]);
      }
    }
  });
});

describe("a Futago gives a guess more, and a board takes guesses until its word is found", () => {
  it("gives one more guess than one word at hard and medium, and easy the whole of a taller board", () => {
    const count = (size: number, level: PuzzleLevel, boards: number) => guessesFor("gomoji", size, level, 0, boards);
    expect([count(5, "hard", 2), count(5, "medium", 2), count(5, "easy", 2)]).toEqual([7, 8, 9]);
    expect([count(4, "hard", 2), count(4, "medium", 2), count(4, "easy", 2)]).toEqual([6, 7, 8]);
    expect([count(6, "hard", 2), count(6, "medium", 2), count(6, "easy", 2)]).toEqual([7, 8, 10]);
    expect(guessesFor("gomojiKana", 5, "easy", 1, 2)).toBe(10);
    for (const size of [3, 4, 5, 6]) for (const level of PUZZLE_LEVEL_LIST) for (const free of [0, 1]) expect(guessesFor("gomojiKana", size, level, free, 2)).toBeLessThanOrEqual(MOST_GUESSES);
    // One word's counts stay as they were.
    expect([count(5, "hard", 1), count(5, "medium", 1), count(5, "easy", 1)]).toEqual([6, 7, 9]);
  });

  it("shows a board every guess until its word, and none after", () => {
    expect(boardGuesses(["slate", "crane", "irony"], "crane")).toEqual(["slate", "crane"]);
    expect(boardGuesses(["slate", "crane", "irony"], "pious")).toEqual(["slate", "crane", "irony"]);
    expect(everyWordFound(["slate", "crane", "irony"], ["crane", "irony"])).toBe(true);
    expect(everyWordFound(["slate", "crane"], ["crane", "irony"])).toBe(false);
  });
});

describe("checking a Futago, as the server does", () => {
  const givens = "CRANE+SLATE";
  const words = ["pious", "irony", "tempo", "bluff", "chord", "dwarf", "wight"].filter((word) => isWord(word, 5));

  it("accepts both words found, whichever first, with the last guess finding the last", () => {
    expect(checkSolution("gomoji", 5, givens, "craneslate", "hard")).toEqual({ ok: true });
    expect(checkSolution("gomoji", 5, givens, `${words[0]}slatecrane`, "hard")).toEqual({ ok: true });
  });

  it("refuses one word left unguessed, guesses after both were found, and more guesses than a Futago has", () => {
    expect(checkSolution("gomoji", 5, givens, `${words[0]}crane`, "hard")).toEqual({ ok: false, reason: "a word was not guessed" });
    expect(checkSolution("gomoji", 5, givens, `slatecrane${words[0]}`, "hard")).toEqual({ ok: false, reason: "guesses go on after both words were found" });
    expect(checkSolution("gomoji", 5, givens, `${words[0]!.repeat(7)}slatecrane`, "hard").ok).toBe(false);
    expect(checkSolution("gomoji", 5, givens, "zzzzzcraneslate", "hard")).toEqual({ ok: false, reason: "zzzzz is not in the word list" });
  });

  it("ends one unsolved only when every row a Futago has is spent and a word is still hidden", () => {
    const seven = `crane${words.slice(0, 6).join("")}`;
    expect(words.length).toBeGreaterThanOrEqual(6);
    expect(checkOutOfGuesses("gomoji", 5, givens, seven, "hard")).toEqual({ ok: true });
    // Six is one word's hard count, and a Futago has seven: a guess is left.
    expect(checkOutOfGuesses("gomoji", 5, givens, seven.slice(5), "hard")).toEqual({ ok: false, reason: "there are guesses left" });
    expect(checkOutOfGuesses("gomoji", 5, givens, `slate${words.slice(0, 5).join("")}crane`, "hard")).toEqual({ ok: false, reason: "both words were found" });
  });

  it("checks a kana Futago's guesses against the kana list", () => {
    const puzzle = generatePuzzle("gomojiKana", 3, "hard", A_FUTAGO);
    const [first, second] = hiddenWordsOf("gomojiKana", 3, puzzle.givens)!.words;
    const other = [...kanaWordsOf(3).allowed].find((word) => word !== first && word !== second)!;
    expect(checkSolution("gomojiKana", 3, puzzle.givens, `${other}${second}${first}`, "hard")).toEqual({ ok: true });
    expect(checkSolution("gomojiKana", 3, puzzle.givens, `${other}${first}`, "hard")).toEqual({ ok: false, reason: "a word was not guessed" });
  });
});

describe("scoring and counting a Futago", () => {
  it("scores each board on the guesses it was shown, and adds the two", () => {
    const guesses = ["slate", "crane", "irony"];
    const both = futagoScore(["crane", "irony"], guesses, 7, 20_000);
    const one = wordScore("crane", ["slate", "crane"], 7, 20_000);
    const two = wordScore("irony", guesses, 7, 20_000);
    expect(both.total).toBe(one.total + two.total);
    expect(pointsFor("gomoji", 5, "CRANE+IRONY", 0, 0, guesses.join(""), 20_000, "hard")).toBe(both.total);
    // One word scores as it always did.
    expect(futagoScore(["crane"], guesses.slice(0, 2), 6, 20_000)).toEqual(wordScore("crane", guesses.slice(0, 2), 6, 20_000));
  });

  it("counts guesses against a Futago's own allowance", () => {
    expect(guessesTaken("gomoji", 5, "hard", "CRANE+IRONY", "slatecraneirony")).toEqual({ used: 3, allowed: 7 });
    expect(guessesTaken("gomojiWort", 5, "easy", "HÖREN+BLATT", "blatthören")).toEqual({ used: 2, allowed: 9 });
    expect(wordRowsOf("gomojiKana", 4, "medium", { words: ["a", "b"], grey: "c" })).toBe(guessesFor("gomojiKana", 4, "medium", 1, 2));
  });

  it("keeps a run of a Futago's easy guesses, the most any Gomoji has", () => {
    const ten = "crane".repeat(10);
    expect(decodeGomojiProgress(ten, 5)).toHaveLength(10);
    expect(progressFits("gomoji", 5, ten)).toBe(true);
    expect(progressFits("gomoji", 5, "crane".repeat(11))).toBe(false);
  });

  it("greys a head start's keys in neither word", () => {
    const puzzle = generatePuzzle("gomoji", 5, "easy", A_FUTAGO);
    const [first, second] = hiddenWordsOf("gomoji", 5, puzzle.givens)!.words;
    const keys = headStartKeys("gomoji", 5, puzzle.givens);
    expect(keys).toHaveLength(5);
    for (const key of keys) expect(`${first}${second}`).not.toContain(key);
    // Each key greyed is grey on both boards, as a guess of it would have left it.
    for (const key of keys) for (const word of [first!, second!]) expect(markGuess(key.repeat(5), word).every((mark) => mark === "miss")).toBe(true);
  });
});

describe("a Futago's address", () => {
  it("asks for two words by twins=1 until a seed is drawn, and from then the seed says it", () => {
    expect(puzzleAsked("gomoji", { size: "5", level: "medium", twins: "1" }).twins).toBe(true);
    expect(puzzleAsked("gomoji", { size: "5", level: "medium" }).twins).toBe(false);
    expect(puzzleAsked("gomoji", { size: "5", level: "medium", seed: String(A_FUTAGO) }).twins).toBe(true);
    expect(puzzleAsked("gomoji", { size: "5", level: "medium", seed: "12345", twins: "1" }).twins).toBe(false);
    // A puzzle that is not a word has no Futago.
    expect(puzzleAsked("numberPlace", { size: "9", level: "medium", twins: "1" }).twins).toBe(false);
    expect(puzzleQuery({ size: 5, level: "medium", seed: null, twins: true })).toBe("?size=5&level=medium&twins=1");
  });
});

describe("a kept run holds no more guesses than its own puzzle has", () => {
  it("allows ten guesses only to a Futago that has ten, and counts the kana free word", () => {
    const one = freshSeed();
    const twins = freshFutagoSeed();
    // Five letters at easy: nine for one word, nine for a Futago too; six letters at easy: eight, and ten.
    expect(runGuessesFit("gomoji", 5, "easy", one, "slate".repeat(9))).toBe(true);
    expect(runGuessesFit("gomoji", 5, "easy", one, "slate".repeat(10))).toBe(false);
    expect(runGuessesFit("gomoji", 6, "easy", twins, "planet".repeat(10))).toBe(true);
    expect(runGuessesFit("gomoji", 6, "easy", one, "planet".repeat(10))).toBe(false);
    expect(runGuessesFit("gomojiMot", 5, "hard", one, "salut".repeat(7))).toBe(false);
    expect(runGuessesFit("gomojiMot", 5, "hard", twins, "salut".repeat(7))).toBe(true);
    // Kana: the free grey word takes a row below hard, so easy's guesses are the board less one.
    const kana = guessesFor("gomojiKana", 3, "easy", 1, 1);
    expect(runGuessesFit("gomojiKana", 3, "easy", one, "さくら".repeat(kana))).toBe(true);
    expect(runGuessesFit("gomojiKana", 3, "easy", one, "さくら".repeat(kana + 1))).toBe(false);
    // Not a word puzzle: nothing to count.
    expect(runGuessesFit("numberPlace", 9, "easy", one, "")).toBe(true);
  });
});
