import { describe, expect, it } from "vitest";

import { kanaBase, kanaFamily, kanaFound, kanaTone, markKanaGuess, type KanaMarked } from "./kanaMarks";

const kana = (word: string) => [...word];
/** The marks alone, as a string: g green, G green with an arrow, o orange, y yellow, . grey. */
function marks(guess: string, word: string): string {
  return markKanaGuess(kana(guess), kana(word))
    .map((each: KanaMarked) => (each.mark === "hit" ? (each.wrongSize || each.wrongMark ? "G" : "g") : each.mark === "near" ? "o" : each.mark === "kin" ? "y" : "."))
    .join("");
}

describe("reading a kana", () => {
  it("takes off its size and its mark to find its base", () => {
    expect(kanaBase("ぱ")).toBe("は");
    expect(kanaBase("ば")).toBe("は");
    expect(kanaBase("っ")).toBe("つ");
    expect(kanaBase("づ")).toBe("つ");
    expect(kanaBase("ゃ")).toBe("や");
    expect(kanaBase("ゔ")).toBe("う");
    expect(kanaBase("ー")).toBe("ー");
    expect(kanaTone("ぱ")).toBe("゜");
    expect(kanaTone("が")).toBe("゛");
    expect(kanaTone("か")).toBe("");
  });

  it("puts it in its gojūon row, voiced forms with their base, and ー in none", () => {
    expect(kanaFamily("が")).toBe(kanaFamily("こ"));
    expect(kanaFamily("ぴ")).toBe(kanaFamily("へ"));
    expect(kanaFamily("ょ")).toBe(kanaFamily("ゆ"));
    expect(kanaFamily("を")).toBe(kanaFamily("わ"));
    expect(kanaFamily("ん")).not.toBe(kanaFamily("な"));
    expect(kanaFamily("ー")).toBeNull();
  });
});

describe("colouring a guess, by John's table", () => {
  it("greens the same kana in its place, and finds the word only when every place is plain green", () => {
    expect(marks("さくら", "さくら")).toBe("ggg");
    expect(kanaFound(kana("さくら"), kana("さくら"))).toBe(true);
  });

  it("greens the right kana with the wrong size or mark, with its arrow, and does not call it found", () => {
    const small = markKanaGuess(kana("きつて"), kana("きって"));
    expect(small[1]).toEqual({ mark: "hit", wrongSize: true, wrongMark: false });
    const toned = markKanaGuess(kana("はん"), kana("ぱん"));
    expect(toned[0]).toEqual({ mark: "hit", wrongSize: false, wrongMark: true });
    expect(kanaFound(kana("はん"), kana("ぱん"))).toBe(false);
  });

  it("oranges a kana that is in the word elsewhere, with an arrow when its mark differs", () => {
    expect(marks("くさら", "さくら")).toBe("oog");
    const toned = markKanaGuess(kana("ばなな"), kana("なはな"));
    expect(toned[0]).toEqual({ mark: "near", wrongSize: false, wrongMark: true });
  });

  it("yellows a kana whose row is the row of the word's kana in this place", () => {
    // か in the first place, where the word has こ: the same row, not the same kana, and か is nowhere in the word.
    expect(marks("かめ", "こい")).toBe("y.");
    // が is in か行 too.
    expect(marks("がめ", "こい")).toBe("y.");
  });

  it("greys a kana with nothing to say, and never yellows by a row somewhere else", () => {
    expect(marks("ねこ", "いぬ")).toBe("..");
    // か shares its row with the word's こ, but こ is in the other place: grey, not yellow. い is elsewhere: orange.
    expect(marks("かい", "いこ")).toBe(".o");
  });

  it("counts a kana as often as the word holds it: green first, then orange from what is left", () => {
    // たたみ against まった: the word holds one た, so the first is orange and the second is not; that second
    // one sits on っ, whose base つ is in た行 too, so it is yellow. み is grey: ま is in the word, but not here.
    expect(marks("たたみ", "まった")).toBe("oy.");
    expect(marks("ささか", "さかさ")).toBe("goo");
  });

  it("treats ー as a character of its own: green, orange or grey, never yellow, never an arrow", () => {
    expect(marks("らーめん", "らーめん")).toBe("gggg");
    expect(marks("ーらめん", "らーめん")).toBe("oogg");
    expect(marks("ぱーく", "ぱんだ")).toBe("g..");
  });
});

describe("the 小 and ゛゜ keys", () => {
  it("make a kana small or large again, and leave one with no small form alone", async () => {
    const { toggleSize } = await import("./kanaMarks");
    expect(toggleSize("つ")).toBe("っ");
    expect(toggleSize("っ")).toBe("つ");
    expect(toggleSize("よ")).toBe("ょ");
    expect(toggleSize("ゃ")).toBe("や");
    expect(toggleSize("か")).toBe("か");
    expect(toggleSize("ー")).toBe("ー");
  });

  it("turn a kana's mark round, は ば ぱ and back, and leave one with no mark alone", async () => {
    const { cycleMark } = await import("./kanaMarks");
    expect([cycleMark("は"), cycleMark("ば"), cycleMark("ぱ")]).toEqual(["ば", "ぱ", "は"]);
    expect([cycleMark("か"), cycleMark("が")]).toEqual(["が", "か"]);
    expect([cycleMark("う"), cycleMark("ゔ")]).toEqual(["ゔ", "う"]);
    expect(cycleMark("な")).toBe("な");
    expect(cycleMark("っ")).toBe("っ");
  });
});
