import { describe, expect, it } from "vitest";

import { finishRomaji, readRomaji } from "./romaji";

const read = (typed: string) => readRomaji(typed).kana.join("");

describe("romaji into kana", () => {
  it("reads the plain sounds, Hepburn and Kunrei both", () => {
    expect(read("sakura")).toBe("さくら");
    // A last n waits for the next key, so a word ending in ん is read as Enter reads it.
    expect(finishRomaji("shinbun").join("")).toBe("しんぶん");
    expect(finishRomaji("sinbun").join("")).toBe("しんぶん");
    expect(read("tsuki")).toBe("つき");
    expect(read("tuki")).toBe("つき");
    expect(read("fuji")).toBe("ふじ");
    expect(read("huzi")).toBe("ふじ");
    expect(read("pan")).toBe("ぱ");
  });

  it("reads the contracted sounds as two kana, the second small", () => {
    expect(read("kyou")).toBe("きょう");
    expect(read("shashin")).toBe("しゃし");
    expect(read("jama")).toBe("じゃま");
    expect(read("chawan")).toBe("ちゃわ");
  });

  it("reads a doubled consonant as っ, and n, nn or n' before a consonant as ん", () => {
    expect(read("kitte")).toBe("きって");
    expect(read("zasshi")).toBe("ざっし");
    expect(read("kannda")).toBe("かんだ");
    expect(read("kanda")).toBe("かんだ");
    expect(read("konnichiha")).toBe("こんにちは");
    expect(read("konnnichiha")).toBe("こんにちは");
    expect(read("hannya")).toBe("はんにゃ");
    expect(read("kan'i")).toBe("かんい");
  });

  it("reads x or l before a sound as its small kana, and - as ー", () => {
    expect(read("xtsu")).toBe("っ");
    expect(read("xya")).toBe("ゃ");
    expect(read("ra-men")).toBe("らーめ");
  });

  it("keeps an unfinished sound pending, and settles a last n as ん at Enter", () => {
    expect(readRomaji("sak")).toEqual({ kana: ["さ"], rest: "k" });
    expect(readRomaji("ky")).toEqual({ kana: [], rest: "ky" });
    expect(readRomaji("pan")).toEqual({ kana: ["ぱ"], rest: "n" });
    expect(finishRomaji("pan").join("")).toBe("ぱん");
    expect(finishRomaji("sak").join("")).toBe("さ");
  });

  it("drops a key that cannot start a sound", () => {
    expect(read("q1ka")).toBe("か");
  });
});
