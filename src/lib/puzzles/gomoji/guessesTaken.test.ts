import { describe, expect, it } from "vitest";

import { guessesTaken, guessesText } from "./guessesTaken";

describe("how many guesses a word took", () => {
  it("counts the guesses against the level's allowance: 3 of 6 on hard, 2 of 9 on easy, five letters", () => {
    expect(guessesTaken("gomoji", 5, "hard", "CRANE", "slateirony" + "crane")).toEqual({ used: 3, allowed: 6 });
    expect(guessesText({ used: 3, allowed: 6 })).toBe("3/6");
    expect(guessesTaken("gomoji", 5, "easy", "CRANE", "slatecrane")).toEqual({ used: 2, allowed: 9 });
    expect(guessesTaken("gomoji", 4, "medium", "TREE", "tree")).toEqual({ used: 1, allowed: 6 });
  });

  it("counts a kana word's guesses, the free grey word taking a row of easy's board and no guess", () => {
    expect(guessesTaken("gomojiKana", 3, "hard", "サクラ", "さくら")).toEqual({ used: 1, allowed: 6 });
    expect(guessesTaken("gomojiKana", 3, "easy", "サクラ|ネズミ", "すずめさくら")).toEqual({ used: 2, allowed: 8 });
  });

  it("says nothing for another puzzle, or a solve kept without its answer", () => {
    expect(guessesTaken("numberPlace", 9, "easy", ".".repeat(81), "1".repeat(81))).toBeNull();
    expect(guessesTaken("gomoji", 5, "hard", "CRANE", null)).toBeNull();
    expect(guessesTaken("gomoji", 5, "hard", "CRANE", "abc")).toBeNull();
  });
});
