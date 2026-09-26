import { describe, expect, it } from "vitest";

import { answersFor, isWord } from "./code";

/**
 * THE WORD LISTS ARE WORDS OF THEIR LANGUAGE. John, 2026-09-26, on a French
 * puzzle whose hidden word was RUDD: "Why is the French Word RUDD accepted???
 * what is wrong with our dictionary!?" — and "other languages might have this
 * same problem, which is not acceptable." The French and German lists were a
 * count of film subtitles, and dubbed dialogue is full of English names and
 * words. Real dictionaries decide what is a word now
 * (`scripts/word-lists-fr-de.mjs`); this holds the words that got through
 * before, so a rebuild from a looser source fails here rather than on a
 * player's board.
 */

/** Names and noise the subtitle count carried as French or German, none of them a word of either: never guessed, never hidden. */
const NOT_WORDS = ["rudd", "rood", "aang", "alec", "ahem", "abed", "aldo", "ailo", "aziz", "andi", "anya", "ahab", "argh", "aaron", "abdul", "ahmed", "akira", "alice", "allah"];

/** English words each language borrows, which may be guessed but must never be the hidden word. */
const BORROWED: Record<"fr" | "de", readonly string[]> = {
  fr: ["cool", "team", "baby", "lady", "boss", "deal", "look", "star", "black", "crash", "house", "loser", "class", "smart"],
  de: ["like", "team", "song", "cool", "head", "push", "jump", "gate", "army", "take", "after", "party", "crash"],
};

/** Inflected forms, which a dictionary knows and a puzzle does not hide: the base form is the answer. */
const NOT_BASE: Record<"fr" | "de", readonly string[]> = {
  fr: ["aime", "fera", "parle", "croit", "sais"],
  de: ["neue", "gute", "rote", "slums", "alte"],
};

/** Brands and names a dictionary carries unmarked, which the second dictionary (Wiktionary) does not have. */
const BRANDS: Record<"fr" | "de", readonly string[]> = {
  fr: ["lego", "ajax", "kodak", "juan"],
  de: ["volvo", "rolex", "rhein", "ipod"],
};

/** Everyday words each list must keep, as answers and as guesses. */
const EVERYDAY: Record<"fr" | "de", readonly string[]> = {
  fr: ["arbre", "ecole", "table", "carte", "lapin", "cage", "loup", "pont", "agent", "chat", "rouge"],
  de: ["abend", "tisch", "vogel", "haus", "brot", "berg", "hand", "kind"],
};

describe("the Gomoji word lists", () => {
  for (const lang of ["fr", "de"] as const) {
    it(`${lang}: no name or subtitle noise may be guessed or hidden`, () => {
      for (const word of NOT_WORDS) {
        expect(isWord(word, word.length, lang), `${lang} accepts ${word}`).toBe(false);
        expect(answersFor(word.length, false, lang), `${lang} hides ${word}`).not.toContain(word);
      }
    });

    it(`${lang}: a borrowed English word, an inflected form, a brand or a name is never the hidden word`, () => {
      for (const word of [...BORROWED[lang], ...NOT_BASE[lang], ...BRANDS[lang]]) {
        expect(answersFor(word.length, false, lang), `${lang} hides ${word}`).not.toContain(word);
        expect(answersFor(word.length, true, lang), `${lang} hides ${word} on easy`).not.toContain(word);
      }
    });

    it(`${lang}: a borrowed English word and an inflected form may still be guessed`, () => {
      for (const word of [...BORROWED[lang], ...NOT_BASE[lang]]) expect(isWord(word, word.length, lang), `${lang} refuses ${word}`).toBe(true);
    });

    it(`${lang}: keeps the everyday words, as answers and as guesses`, () => {
      for (const word of EVERYDAY[lang]) {
        expect(isWord(word, word.length, lang), `${lang} refuses ${word}`).toBe(true);
        expect(answersFor(word.length, false, lang), `${lang} never hides ${word}`).toContain(word);
      }
    });
  }
});
