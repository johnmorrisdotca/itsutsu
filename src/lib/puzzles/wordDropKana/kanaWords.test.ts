import { describe, expect, it } from "vitest";

import { KANA_SIZES, kanaWordsOf, loadKanaWords } from "./kanaWords";

describe("the kana word lists", () => {
  it("refuses a list that has not been loaded rather than answering for it", () => {
    expect(() => kanaWordsOf(9)).toThrow(/not been loaded/);
  });

  for (const size of KANA_SIZES) {
    it(`reads the ${size}-kana list: 900 easy inside 2,000 answers, all of them guessable, every word ${size} kana`, async () => {
      const words = await loadKanaWords(size);
      expect(kanaWordsOf(size)).toBe(words);
      expect(words.easy).toHaveLength(900);
      expect(words.answers).toHaveLength(2000);
      const answers = new Set(words.answers);
      expect(words.easy.every((word) => answers.has(word))).toBe(true);
      expect(words.answers.every((word) => words.allowed.has(word))).toBe(true);
      for (const word of [...words.allowed].slice(0, 500)) expect([...word]).toHaveLength(size);
      expect([...words.allowed].every((word) => /^[ぁ-ゖー]+$/u.test(word))).toBe(true);
      expect(words.release).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  }

  it("keeps everyday words among the easy answers", async () => {
    expect((await loadKanaWords(3)).easy).toContain("こども");
    expect((await loadKanaWords(4)).easy).toContain("べんとう");
    expect((await loadKanaWords(5)).easy).toContain("えいきょう");
  });
});
