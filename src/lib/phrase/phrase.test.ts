import { describe, expect, it } from "vitest";

import {
  CANDIDATES_PER_ROUND,
  PHRASE_LENGTH,
  PHRASE_SEPARATOR,
  canonicalPhrase,
  drawCandidates,
  isListWord,
  phraseBits,
  phraseProblems,
} from "./phrase";
import { WORDLIST } from "./wordlist.constants";

/** A generator that walks the list from the top, so a draw is reproducible. */
function counting(values: readonly number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length];
}

describe("the wordlist", () => {
  it("is EFF's short list: 1,296 words, none over five letters", () => {
    expect(WORDLIST).toHaveLength(1296);
    expect(new Set(WORDLIST).size).toBe(1296);
    for (const word of WORDLIST) expect(word.length).toBeLessThanOrEqual(5);
  });

  it("holds only lower-case letters and the one hyphen EFF put there", () => {
    for (const word of WORDLIST) expect(word).toMatch(/^[a-z][a-z-]{1,4}$/);
    expect(WORDLIST).toContain("yo-yo");
  });
});

describe("phraseBits", () => {
  /*
   * The arithmetic is asserted rather than written in a comment, because the
   * whole decision to use the short list rests on it. Anybody swapping the
   * list or the word count has to come here and say what the new number is.
   */
  it("is about 36 bits: four words from 1,296, order not counted", () => {
    expect(phraseBits()).toBeGreaterThan(35);
    expect(phraseBits()).toBeLessThan(37);
  });
});

describe("canonicalPhrase", () => {
  it("sorts, so the same four words in any order are the same phrase", () => {
    const asChosen = canonicalPhrase(["zebra", "acid", "mango", "flock"]);
    const asRemembered = canonicalPhrase(["flock", "zebra", "acid", "mango"]);
    expect(asChosen).not.toBeNull();
    expect(asChosen).toBe(asRemembered);
  });

  it("joins with a space, never a hyphen — one list word has a hyphen in it", () => {
    expect(canonicalPhrase(["yo-yo", "acid", "zebra", "mango"])).toContain(PHRASE_SEPARATOR);
    expect(canonicalPhrase(["yo-yo", "acid", "zebra", "mango"])).toBe(
      ["acid", "mango", "yo-yo", "zebra"].join(PHRASE_SEPARATOR),
    );
  });

  it("folds case and stray whitespace, so entry never depends on clean tapping", () => {
    expect(canonicalPhrase([" Acid ", "ZEBRA", "mango", "\tflock\n"])).toBe(
      canonicalPhrase(["acid", "zebra", "mango", "flock"]),
    );
  });

  it("refuses rather than guessing: wrong count, or a word off the list", () => {
    expect(canonicalPhrase(["acid", "zebra", "mango"])).toBeNull();
    expect(canonicalPhrase(["acid", "zebra", "mango", "flock", "acorn"])).toBeNull();
    expect(canonicalPhrase(["acid", "zebra", "mango", "xyzzy"])).toBeNull();
  });

  /*
   * THE NORMALISER DOES NOT CARE ABOUT REPEATS, and that is deliberate rather
   * than an omission. The picker avoids offering a word twice because a tile
   * that has to be tapped twice is a fiddly control — an interface decision,
   * not a correctness one. If a phrase with a repeat ever exists, whether from
   * an older build, a fixture, or a later change of mind, it has to stay
   * enterable: a normaliser that refused one would lock somebody out of their
   * own account, and nothing on screen would say why.
   */
  it("accepts a repeated word, and normalises it the same way every time", () => {
    const once = canonicalPhrase(["zoom", "zoom", "year", "acid"]);
    expect(once).not.toBeNull();
    expect(canonicalPhrase(["year", "zoom", "acid", "zoom"])).toBe(once);
    expect(canonicalPhrase(["acid", "ACID", "zebra", "mango"])).toBe(
      canonicalPhrase(["acid", "acid", "zebra", "mango"]),
    );
  });

  it("keeps a repeat as four words rather than collapsing it to three", () => {
    const phrase = canonicalPhrase(["zoom", "zoom", "year", "acid"]);
    expect(phrase?.split(PHRASE_SEPARATOR)).toHaveLength(PHRASE_LENGTH);
  });

  it("refuses anything that is not four strings", () => {
    expect(canonicalPhrase(null)).toBeNull();
    expect(canonicalPhrase(["acid", "zebra", "mango", 7])).toBeNull();
    expect(canonicalPhrase("acid zebra mango flock")).toBeNull();
  });
});

describe("phraseProblems", () => {
  it("says nothing about a good phrase", () => {
    expect(phraseProblems(["acid", "zebra", "mango", "flock"])).toEqual([]);
  });

  it("names each fault in words a person could act on", () => {
    expect(phraseProblems(["acid", "zebra"]).join(" ")).toMatch(/four/i);
    expect(phraseProblems(["acid", "zebra", "mango", "xyzzy"]).join(" ")).toMatch(/xyzzy/);
  });

  it("does not call a repeated word a fault — see canonicalPhrase", () => {
    expect(phraseProblems(["zoom", "zoom", "year", "acid"])).toEqual([]);
  });
});

describe("isListWord", () => {
  it("knows the list and nothing else", () => {
    expect(isListWord("acid")).toBe(true);
    expect(isListWord("yo-yo")).toBe(true);
    expect(isListWord("abdominal")).toBe(false);
    expect(isListWord("")).toBe(false);
    expect(isListWord(undefined)).toBe(false);
  });

  it("is case- and space-insensitive, the same way canonicalPhrase is", () => {
    expect(isListWord(" ACID ")).toBe(true);
  });
});

describe("drawCandidates", () => {
  it("offers four words", () => {
    expect(drawCandidates([], counting([0]))).toHaveLength(CANDIDATES_PER_ROUND);
  });

  it("never offers the same word twice in one round", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const offered = drawCandidates([], Math.random);
      expect(new Set(offered).size).toBe(CANDIDATES_PER_ROUND);
    }
  });

  it("never offers a word already kept — without order, a repeat is ambiguous", () => {
    const kept = [WORDLIST[0], WORDLIST[1], WORDLIST[2]];
    /*
     * A generator stuck at the top of the list: every draw wants WORDLIST[0],
     * which is kept, so a naive implementation returns it anyway. This is the
     * case that breaks a phrase once sorting makes a repeat ambiguous.
     */
    const offered = drawCandidates(kept, counting([0]));
    for (const word of offered) expect(kept).not.toContain(word);
    expect(new Set(offered).size).toBe(CANDIDATES_PER_ROUND);
  });

  it("ignores a kept word's case and padding when excluding it", () => {
    const offered = drawCandidates([" ACID "], counting([WORDLIST.indexOf("acid") / WORDLIST.length]));
    expect(offered).not.toContain("acid");
  });

  it("draws only from the list", () => {
    for (const word of drawCandidates([], Math.random)) expect(WORDLIST).toContain(word);
  });

  it("spreads over the list rather than favouring one end", () => {
    const seen = new Set<string>();
    for (let round = 0; round < 200; round += 1) {
      for (const word of drawCandidates([], Math.random)) seen.add(word);
    }
    // 800 draws from 1,296 words: a generator stuck anywhere would show it.
    expect(seen.size).toBeGreaterThan(400);
  });
});

describe("the shape of a phrase", () => {
  it("is four words picked over four rounds of four candidates", () => {
    expect(PHRASE_LENGTH).toBe(4);
    expect(CANDIDATES_PER_ROUND).toBe(4);
  });

  it("leaves enough of the list to draw every round, repeats excluded", () => {
    // Four rounds of four, with earlier picks withheld, needs 4 + 3 words at worst.
    expect(WORDLIST.length).toBeGreaterThan(PHRASE_LENGTH + CANDIDATES_PER_ROUND);
  });
});
