import { describe, expect, it } from "vitest";

import { SUIDO_PIECE_GUIDE } from "@johnmorrisdotca/suido";

import { speaker } from "@/lib/i18n/i18n";

import { GUIDE_WORDS } from "./suidoGuideWords";

/**
 * THE GUIDE TO SUIDO'S PIECES, ON THE RULES PAGE, is the package's own list of pieces with its words in the phrase table: a piece the package
 * adds or rewords fails here until the table follows, so the page never shows a piece in one language only or says something the package no longer does.
 */
describe("the words of the guide to Suido's pieces", () => {
  it("are one name and one sentence for every piece the package guides, and for nothing else", () => {
    expect(Object.keys(GUIDE_WORDS).sort()).toEqual(SUIDO_PIECE_GUIDE.map((piece) => piece.id).sort());
  });

  it("say in English what the package says, word for word", () => {
    const en = speaker("en");
    for (const piece of SUIDO_PIECE_GUIDE) {
      expect(en.say(GUIDE_WORDS[piece.id]!.name), piece.id).toBe(piece.name);
      expect(en.say(GUIDE_WORDS[piece.id]!.text), piece.id).toBe(piece.text);
    }
  });

  it("are in Japanese for every piece, not the English again", () => {
    const en = speaker("en");
    const ja = speaker("ja");
    for (const piece of SUIDO_PIECE_GUIDE) {
      for (const key of [GUIDE_WORDS[piece.id]!.name, GUIDE_WORDS[piece.id]!.text]) {
        expect(ja.say(key), `${piece.id} ${key}`).not.toBe(en.say(key));
        expect(ja.say(key), `${piece.id} ${key}`).toMatch(/[぀-ヿ一-鿿]/);
      }
    }
    expect(ja.say("pmaze.guide.family", { family: "2+2", count: "36" })).toBe("2+2・36通り");
  });
});
