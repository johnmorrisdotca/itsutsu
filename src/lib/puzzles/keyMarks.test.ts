import { describe, expect, it } from "vitest";

import { kanaKeyMarks, keyLabel, knownCounts, letterKeyMarks, typedCounts } from "./keyMarks";
import { markGuess } from "./gomoji/code";
import { kanaBase, markKanaGuess } from "./gomojiKana/kanaMarks";

describe("what the keys of a word puzzle show", () => {
  it("counts each letter of the row being typed, empty places left out", () => {
    expect(typedCounts(["e", "e", "", "r", "e"])).toEqual(new Map([["e", 3], ["r", 1]]));
    expect(typedCounts(["", "", ""]).size).toBe(0);
  });

  it("counts a kana by its base, so ぱ and は are two of は", () => {
    expect(typedCounts(["ぱ", "は", "か"], kanaBase)).toEqual(new Map([["は", 2], ["か", 1]]));
  });

  it("colours a key by the best its letter has had, yellow included for kana", () => {
    expect(letterKeyMarks(["slate", "crane"], "crane").get("a")).toBe("hit");
    expect(kanaKeyMarks(["かめ"], "こい").get("か")).toBe("kin");
  });
});

describe("how many of a letter the word is known to hold", () => {
  const marked = (guesses: string[], hidden: string) => knownCounts(guesses, guesses.map((guess) => markGuess(guess, hidden)));
  const kanaMarked = (rows: string[], word: string) =>
    knownCounts(
      rows,
      rows.map((row) => markKanaGuess([...row], [...word]).map((each) => each.mark)),
      kanaBase,
    );

  it("gives PRIOR, solved, two R's", () => {
    // John's word, 2026-09-26: two R's, both green once it is found.
    const known = marked(["slate", "proud", "prior"], "prior");
    expect(known.get("r")).toBe(2);
    expect(known.get("p")).toBe(1);
    expect(known.get("o")).toBe(1);
  });

  it("counts two greens in one guess", () => {
    expect(marked(["steep"], "sleep").get("e")).toBe(2);
  });

  it("counts a green and a yellow of the same letter in one guess", () => {
    // RARER against PRIOR: the last R in its place, the first elsewhere, the middle one grey.
    expect(markGuess("rarer", "prior")).toEqual(["near", "miss", "miss", "miss", "hit"]);
    expect(marked(["rarer"], "prior").get("r")).toBe(2);
  });

  it("takes the most any one guess proved, not the sum over guesses", () => {
    // A yellow R in each of two guesses may be the same R.
    expect(
      knownCounts(
        ["rxxxx", "xrxxx"],
        [
          ["near", "miss", "miss", "miss", "miss"],
          ["miss", "near", "miss", "miss", "miss"],
        ],
      ).get("r"),
    ).toBe(1);
    // Two yellows in the second guess are two R's, whatever the first said.
    expect(
      knownCounts(
        ["rxxxx", "xrxrx"],
        [
          ["near", "miss", "miss", "miss", "miss"],
          ["miss", "near", "miss", "near", "miss"],
        ],
      ).get("r"),
    ).toBe(2);
  });

  it("proves one of a letter typed three times with one green and two grey, so the key carries no count", () => {
    expect(markGuess("eerie", "crane")).toEqual(["miss", "miss", "near", "miss", "hit"]);
    expect(marked(["eerie"], "crane").get("e")).toBe(1);
  });

  it("says nothing of a letter only ever marked grey, nor before any guess", () => {
    expect(marked(["slate"], "prior").size).toBe(0);
    expect(knownCounts([], []).size).toBe(0);
  });

  it("counts kana by base on the key they are typed on, green with an arrow included", () => {
    // はぱ against ぱぱ: は is in ぱ's place with the wrong mark, still green; both are the は key.
    expect(kanaMarked(["はぱ"], "ぱぱ").get("は")).toBe(2);
    // っ and つ, the small kana and the large, are both the つ key.
    expect(kanaMarked(["つっ"], "っつ").get("つ")).toBe(2);
    // Orange, in the word elsewhere, counts as green does.
    expect(markKanaGuess([..."かいか"], [..."かかい"]).map((each) => each.mark)).toEqual(["hit", "near", "near"]);
    expect(kanaMarked(["かいか"], "かかい").get("か")).toBe(2);
  });

  it("does not count a kana's yellow, which says its row and not the kana", () => {
    expect(kanaKeyMarks(["かめ"], "こい").get("か")).toBe("kin");
    expect(kanaMarked(["かめ"], "こい").has("か")).toBe(false);
  });

  it("names a key's counts for a screen reader, from two, and nothing else when there are none", () => {
    expect(keyLabel("r", 2, 0)).toBe("R, in the word twice");
    expect(keyLabel("r", 3, 2)).toBe("R, in the word 3 times, 2 in the row");
    expect(keyLabel("は", 0, 2)).toBe("は, 2 in the row");
    expect(keyLabel("r", 1, 1)).toBeUndefined();
  });
});
