import type { Word } from "@johnmorrisdotca/jisho/words";
import { describe, expect, it } from "vitest";

import { guessMeaning } from "./guessMeaning";
import { KANA_MEANING_BLOCKED, LINE_LONGEST, meaningLine } from "./meaningLine";

const word = (written: string, meaning: string, reading = "かみ"): Word => ({ written, reading, forms: [written], meaning, senses: [], kinds: "", common: true });

describe("the line a kana guess's meaning is said in", () => {
  it("puts the commonest words on one line, each with its first plain gloss", () => {
    expect(meaningLine("かみ", [word("紙", "paper"), word("神", "god, deity, divinity; god-tier"), word("髪", "hair (on the head)"), word("加味", "seasoning")])).toBe("紙 paper · 神 god · 髪 hair");
  });

  it("shows a word written in kana as its meaning alone, and keeps no gloss twice", () => {
    expect(meaningLine("あめ", [word("あめ", "candy", "あめ"), word("飴", "candy"), word("雨", "rain")])).toBe("candy · 雨 rain");
  });

  it("says nothing for a word with nothing quiet to say", () => {
    expect(meaningLine("あああ", [])).toBeNull();
    expect(meaningLine("ころす", [word("殺す", "to kill; to murder", "ころす")])).toBeNull();
    expect(meaningLine("あああ", [word("亜", "sexual thing")])).toBeNull();
  });

  it("never runs over its length, leaving a word off rather than cutting it", () => {
    const long = [word("一", "twenty letters long!"), word("二", "twenty more letters!!"), word("三", "yet more letters here")];
    const line = meaningLine("いち", long)!;
    expect([...line].length).toBeLessThanOrEqual(LINE_LONGEST);
    expect(line.startsWith("一 ")).toBe(true);
  });

  it("keeps out the readings Kotoba keeps out, and the words about killing, violence and abuse among them", () => {
    for (const reading of ["ころす", "ぼうりょく", "ぎゃくたい", "いじめ", "じさつ", "うんこ"]) expect(KANA_MEANING_BLOCKED).toContain(reading);
    expect(new Set(KANA_MEANING_BLOCKED).size).toBe(KANA_MEANING_BLOCKED.length);
  });

  it("is never fetched where there is no browser: a server's build reaches no dictionary", async () => {
    expect(await guessMeaning("かみ")).toBeNull();
  });
});
