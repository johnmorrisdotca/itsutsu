import { describe, expect, it } from "vitest";

import { fill, placeholdersIn, speaker } from "./i18n";
import { PHRASES } from "./i18n.constants";

describe("filling a sentence in", () => {
  it("puts the value where the name is", () => {
    expect(fill("Play {game} →", { game: "Hex" })).toBe("Play Hex →");
  });

  it("fills every mention of a name", () => {
    expect(fill("{a} and {a}", { a: "x" })).toBe("x and x");
  });

  /*
   * A name nobody supplied is left standing. An empty gap reads as prose and
   * would be argued with as a wording problem; `{game}` on the page reads as
   * what it is. The coverage test is what keeps either off a page.
   */
  it("leaves a name nobody supplied standing rather than blanking it", () => {
    expect(fill("Play {game} →", {})).toBe("Play {game} →");
  });

  it("finds the names a phrase expects", () => {
    expect(placeholdersIn("Every game of {game} played by {who}")).toEqual(["game", "who"]);
    expect(placeholdersIn("Object")).toEqual([]);
  });
});

describe("saying something", () => {
  it("says it in English when English is asked for", () => {
    expect(speaker("en").say("rules.object")).toBe("Object");
  });

  it("says it in the reader's language", () => {
    expect(speaker("ja").say("rules.object")).toBe("目的");
    expect(speaker("ja").say("rules.inProgress")).toBe("対局中の盤面。");
  });

  it("falls back to the English original for a language with no dictionary", () => {
    // `de` is declared in LOCALES and has nothing to say yet.
    expect(speaker("de").say("rules.object")).toBe(PHRASES["rules.object"]);
  });
});

/*
 * John's rule: the kanji stays put whatever language is chosen, and the
 * English half beside it is the half that switches. These are the cases that
 * rule does not state and cannot survive without.
 */
describe("LOCALE + JP", () => {
  it("leaves English exactly as it was", () => {
    expect(speaker("en").pair("nav.players", "対局者")).toEqual({
      text: "Players",
      kanji: "対局者",
    });
  });

  /*
   * The edge the rule does not mention. "Players 対局者" translated into
   * Japanese is "対局者 対局者": the pairing exists to set two scripts against
   * each other, and for a reader of that script there is no pairing left to
   * make.
   */
  it("shows no second copy to a reader of that script", () => {
    expect(speaker("ja").pair("nav.players", "対局者")).toEqual({
      text: "対局者",
      kanji: null,
    });
  });

  /*
   * The open question, answered by the same rule rather than by taste: two
   * Han scripts stacked is the same redundancy, whichever two.
   */
  it("shows no second copy to a Chinese reader either", () => {
    expect(speaker("zh").pair("nav.players", "対局者").kanji).toBeNull();
  });

  it("says null rather than an empty string when there is no pairing", () => {
    expect(speaker("ja").pair("nav.players", "対局者").kanji).not.toBe("");
  });
});

describe("a name, which is nobody's to translate", () => {
  it("leaves the name in Latin script and keeps the kanji", () => {
    expect(speaker("en").pairName("Gomoku", "五目並べ")).toEqual({
      text: "Gomoku",
      kanji: "五目並べ",
    });
  });

  /*
   * The site already carries every game's Japanese name, beside its English
   * one, in a field it has had all along. For a Japanese reader that IS the
   * translation — so forty games are named in Japanese already, with no
   * dictionary written.
   */
  it("promotes the kanji to being the name for a Japanese reader", () => {
    expect(speaker("ja").pairName("Gomoku", "五目並べ")).toEqual({
      text: "五目並べ",
      kanji: null,
    });
  });

  /*
   * And does not do the same for Chinese. 五目並べ is Japanese orthography,
   * kana and all; handing it to a Chinese reader as their own word would be
   * guessing, and guessing is what this repo's rule about unanswerable
   * questions forbids.
   */
  it("does not hand Japanese orthography to a Chinese reader", () => {
    const shown = speaker("zh").pairName("Gomoku", "五目並べ");
    expect(shown.text).toBe("Gomoku");
    expect(shown.kanji).toBeNull();
  });

  /*
   * "No kanji" is null, never an empty string. A caller that got "" back
   * would render a gap where the pairing goes and call it a pairing — the
   * same fault as a distance measure answering 0 for "I cannot tell".
   */
  it("says null, not an empty string, for a name with no kanji", () => {
    expect(speaker("ja").pairName("Hex", "")).toEqual({ text: "Hex", kanji: null });
    expect(speaker("en").pairName("Hex", "")).toEqual({ text: "Hex", kanji: null });
    expect(speaker("en").pair("nav.players", "").kanji).toBeNull();
  });
});
