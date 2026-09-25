import { describe, expect, it } from "vitest";

import { isWord } from "./code";
import { WORD_SCORE, foundBonus, wordScore } from "./wordScore";

describe("what a Gomoji word scores", () => {
  it("is 0 only when no letter was ever found", () => {
    // BUMPY and FJOLD share no letter with CRANE; GIRLS shares its R.
    expect(wordScore("crane", ["bumpy", "fjord".replace("r", "l")], 6, 0).total).toBe(0);
    expect(wordScore("crane", ["bumpy", "girls"], 6, 0).total).toBeGreaterThan(0);
  });

  it("pays a letter in its place more than one found elsewhere, and either more the sooner", () => {
    const placedFirst = wordScore("crane", ["cxxxx"], 6, 0);
    expect(placedFirst).toEqual({ placed: WORD_SCORE.placed * 6, elsewhere: 0, found: 0, speed: 0, total: 60 });
    const placedLast = wordScore("crane", ["xxxxx", "xxxxx", "xxxxx", "xxxxx", "xxxxx", "cxxxx"], 6, 0);
    expect(placedLast.placed).toBe(WORD_SCORE.placed * 1);
    const elsewhereFirst = wordScore("crane", ["xcxxx"], 6, 0);
    expect(elsewhereFirst.elsewhere).toBe(WORD_SCORE.elsewhere * 6);
    expect(elsewhereFirst.placed).toBe(0);
  });

  it("pays a letter once: found elsewhere and later placed counts as placed", () => {
    const score = wordScore("crane", ["xcxxx", "cxxxx"], 6, 0);
    expect(score.placed).toBe(WORD_SCORE.placed * 5);
    expect(score.elsewhere).toBe(0);
  });

  it("counts a doubled letter twice", () => {
    // ALLOT has two Ls; LXXXL shows both, neither in its place.
    const score = wordScore("allot", ["lxxxl"], 6, 0);
    expect(score.elsewhere).toBe(WORD_SCORE.elsewhere * 6 * 2);
  });

  it("pays for the word, the rows left and the speed only when it is found", () => {
    const quick = wordScore("crane", ["slate", "crane"], 6, 30_000);
    expect(quick.found).toBe(foundBonus(5, 6) + WORD_SCORE.rowLeft * 4);
    expect(foundBonus(5, 6)).toBe(300);
    expect(foundBonus(5, 9)).toBe(450);
    expect(quick.speed).toBe(WORD_SCORE.speedMost);
    expect(wordScore("crane", ["slate", "crane"], 6, 60_000 + 6_000 * 10).speed).toBe(40);
    expect(wordScore("crane", ["slate", "crane"], 6, 60 * 60_000).speed).toBe(0);
    expect(wordScore("crane", ["slate"], 6, 1_000).speed).toBe(0);
  });

  it("is always more for a word found than for any word lost, however many guesses the level gives", () => {
    for (const size of [4, 5]) {
      for (let rows = size + 1; rows <= 9; rows += 1) {
        const hidden = size === 5 ? "crane" : "cake";
        // The best a loss can do: all but the last letter placed on the first row, the last on the second.
        const nearly = hidden.slice(0, -1) + "x";
        const last = "x".repeat(size - 1) + hidden.at(-1)!;
        const bestLoss = wordScore(hidden, [nearly, last, ...new Array<string>(rows - 2).fill("x".repeat(size))], rows, 0).total;
        const worstWin = wordScore(hidden, [...new Array<string>(rows - 1).fill("x".repeat(size)), hidden], rows, 60 * 60_000).total;
        expect(bestLoss, `${size} letters, ${rows} guesses`).toBeLessThan(worstWin);
      }
    }
    expect(isWord("crane", 5)).toBe(true);
  });
});
