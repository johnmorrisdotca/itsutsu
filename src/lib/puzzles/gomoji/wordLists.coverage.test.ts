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
  fr: ["cool", "team", "baby", "lady", "boss", "deal", "look", "star", "black", "crash", "house", "loser", "class", "smart", "design", "leader"],
  de: ["like", "team", "song", "cool", "head", "push", "jump", "gate", "army", "take", "after", "party", "crash", "design", "leader", "update"],
};

/** Inflected forms, which a dictionary knows and a puzzle does not hide: the base form is the answer. */
const NOT_BASE: Record<"fr" | "de", readonly string[]> = {
  fr: ["aime", "fera", "parle", "croit", "sais", "aimait", "parlez", "grande", "petite"],
  de: ["neue", "gute", "rote", "slums", "alte", "kleine", "schöne"],
};

/** Brands and names a dictionary carries unmarked, which the second dictionary (Wiktionary) does not have, or the lists of names hold back. */
const BRANDS: Record<"fr" | "de", readonly string[]> = {
  fr: ["lego", "ajax", "kodak", "juan", "claude", "robert", "sylvie"],
  de: ["volvo", "rolex", "rhein", "ipod", "toyota", "barbie", "boeing"],
};

/** Everyday words each list must keep, as answers and as guesses. */
const EVERYDAY: Record<"fr" | "de", readonly string[]> = {
  fr: ["arbre", "ecole", "table", "carte", "lapin", "cage", "loup", "pont", "agent", "chat", "rouge", "maison", "jardin", "cheval", "soleil", "oiseau", "enfant"],
  de: ["abend", "tisch", "vogel", "haus", "brot", "berg", "hand", "kind", "garten", "himmel", "wasser", "sommer", "kirche", "freund"],
};

/**
 * GOMOJI 6 (John, 2026-09-26: "Introduce Gomoji 6… I hope we have enough
 * words for 10 years if possible"). Six letters bring words four and five
 * never met, so each list was read for vulgarity, slurs, drugs and insults
 * and the ones found were added to its script's lists: these may be guessed
 * and are never hidden, as the shorter lengths' are.
 */
const NOT_AN_ANSWER_AT_SIX: Record<"en" | "fr" | "de", readonly string[]> = {
  en: ["raping", "faggot", "orgasm", "heroin", "stupid", "retard"],
  fr: ["putain", "salope", "encule", "youpin", "gouine", "sperme"],
  de: ["ficken", "vögeln", "muschi", "kokain", "schwul", "türken"],
};

/** The fewest six-letter answers a list may hold: four years of one a day, where it now holds 4.7 (German) to 8.1 (English). */
const LEAST_ANSWERS_AT_SIX = 4 * 365;

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

  for (const lang of ["en", "fr", "de"] as const) {
    it(`${lang}: six letters hold years of answers, easy's among them, every one a word that may be guessed`, () => {
      const answers = answersFor(6, false, lang);
      const easy = answersFor(6, true, lang);
      expect(answers.length).toBeGreaterThanOrEqual(LEAST_ANSWERS_AT_SIX);
      expect(easy.length).toBeGreaterThan(0);
      for (const word of easy) expect(answers, `${lang} easy ${word} is not an answer`).toContain(word);
      for (const word of answers) {
        expect(word).toHaveLength(6);
        expect(isWord(word, 6, lang), `${lang} hides ${word} and refuses it as a guess`).toBe(true);
      }
    });

    it(`${lang}: six letters' vulgarity, slurs, drugs and insults may be guessed, and are never hidden`, () => {
      for (const word of NOT_AN_ANSWER_AT_SIX[lang]) {
        expect(isWord(word, 6, lang), `${lang} refuses ${word}`).toBe(true);
        expect(answersFor(6, false, lang), `${lang} hides ${word}`).not.toContain(word);
      }
    });
  }
});
