import { describe, expect, it } from "vitest";

import { breaksKanaHardRule, decodeKanaGivens, decodeKanaGuesses, encodeKanaGivens, greyWordFor, kanaWordFor } from "./kanaCode";
import { markKanaGuess } from "./kanaMarks";
import { KANA_SIZES, loadKanaWords } from "./kanaWords";

describe("a kana puzzle written down", () => {
  it("keeps the word and its grey word in katakana, and reads them back", () => {
    const givens = encodeKanaGivens("さくら", "ねずみ");
    expect(givens).toBe("サクラ|ネズミ");
    expect(decodeKanaGivens(givens, 3)).toEqual({ word: "さくら", grey: "ねずみ" });
    expect(decodeKanaGivens("サクラ", 3)).toEqual({ word: "さくら", grey: null });
    expect(decodeKanaGivens("さくら", 3)).toBeNull();
    expect(decodeKanaGivens("サクラ", 4)).toBeNull();
  });

  it("reads an answer as whole hiragana guesses only", () => {
    expect(decodeKanaGuesses("ねこさくら", 3)).toBeNull();
    expect(decodeKanaGuesses("ねずみさくら", 3)).toEqual(["ねずみ", "さくら"]);
    expect(decodeKanaGuesses("サクラ", 3)).toBeNull();
  });
});

describe("choosing from a seed", () => {
  for (const size of KANA_SIZES) {
    it(`draws a ${size}-kana word from the level's list, the same for the same seed, and a grey word that is all grey`, async () => {
      const words = await loadKanaWords(size);
      for (const seed of [1, 7, 1234, 99991]) {
        const easy = kanaWordFor(words, true, seed);
        expect(words.easy).toContain(easy);
        expect(kanaWordFor(words, true, seed)).toBe(easy);
        expect(words.answers).toContain(kanaWordFor(words, false, seed));
        const grey = greyWordFor(words, easy, seed);
        expect(grey).not.toBeNull();
        expect(markKanaGuess([...grey!], [...easy]).every((each) => each.mark === "miss")).toBe(true);
      }
    });
  }

  it("keeps a seed's word when the list gains words that do not undercut it", async () => {
    const words = await loadKanaWords(3);
    const before = kanaWordFor(words, false, 42);
    const grown = { ...words, answers: [...words.answers, "ぬぬぬ"] };
    const after = kanaWordFor(grown, false, 42);
    expect(after === before || after === "ぬぬぬ").toBe(true);
  });
});

describe("the hard rule", () => {
  it("keeps a plain green in its place, and asks for any other kana found in some form", () => {
    expect(breaksKanaHardRule(["さかな"], "さくら", "さくら")).toBeNull();
    expect(breaksKanaHardRule(["さかな"], "さくら", "くさら")).toMatch(/さ must stay in place 1/);
    // く found elsewhere (orange) must be used again, in any place.
    expect(breaksKanaHardRule(["くもり"], "さくら", "さらだ")).toMatch(/く must be used/);
    // は for ぱ is right but wrongly marked: ぱ, ば or は satisfies it.
    expect(breaksKanaHardRule(["はん"], "ぱん", "ぱん")).toBeNull();
  });
});
