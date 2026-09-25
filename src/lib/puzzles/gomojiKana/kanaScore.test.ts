import { describe, expect, it } from "vitest";

import { KANA_ROWS } from "./kanaCode";
import { foundBonus } from "../gomoji/wordScore";
import { kanaScore } from "./kanaScore";

describe("what a kana word scores", () => {
  it("is 0 only when no kana and no column was ever found", () => {
    expect(kanaScore("さくら", ["ねずみ"], KANA_ROWS, 0).total).toBe(0);
    expect(kanaScore("さくら", ["すずめ"], KANA_ROWS, 0).total).toBeGreaterThan(0);
  });

  it("pays a plain green 10, a kana found another way 4 and a column 1, each by the rows still to come", () => {
    expect(kanaScore("さくら", ["さずめ"], KANA_ROWS, 0).placed).toBe(10 * 6);
    // は for ぱ in its place: green with an arrow, so found another way.
    const arrowed = kanaScore("ぱんや", ["はずめ"], KANA_ROWS, 0);
    expect(arrowed.placed).toBe(0);
    expect(arrowed.elsewhere).toBe(4 * 6);
    // す where the word has さ: the same column.
    expect(kanaScore("さくら", ["すずめ"], KANA_ROWS, 0).column).toBe(1 * 6);
  });

  it("pays for the word, the rows left and the speed only when found", () => {
    const found = kanaScore("さくら", ["ねずみ", "さくら"], KANA_ROWS, 20_000);
    expect(found.found).toBe(foundBonus(3, KANA_ROWS) + 25 * 4);
    expect(found.speed).toBe(50);
    expect(kanaScore("さくら", ["ねずみ"], KANA_ROWS, 1_000).speed).toBe(0);
  });

  it("is always more for a word found than for any word lost, however many guesses the level gives", () => {
    for (const word of ["さくら", "べんとう", "えいきょう"]) {
      for (let rows = KANA_ROWS; rows <= 9; rows += 1) {
        const kana = [...word];
        const size = kana.length;
        const filler = "ぬ".repeat(size);
        const nearly = kana.slice(0, -1).join("") + "ぬ";
        const last = "ぬ".repeat(size - 1) + kana.at(-1)!;
        const bestLoss = kanaScore(word, [nearly, last, ...new Array<string>(rows - 2).fill(filler)], rows, 0).total;
        const worstWin = kanaScore(word, [...new Array<string>(rows - 1).fill(filler), word], rows, 60 * 60_000).total;
        expect(bestLoss, `${word}, ${rows} guesses`).toBeLessThan(worstWin);
      }
    }
  });
});
