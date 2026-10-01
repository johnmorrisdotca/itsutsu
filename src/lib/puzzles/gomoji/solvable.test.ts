import { describe, expect, it } from "vitest";

import { answersFor, markGuess, type GomojiLanguage } from "./code";
import { guessesFor } from "./layout";
import { DE_WORDS } from "@johnmorrisdotca/kotoba/words-de";
import { EN_WORDS } from "@johnmorrisdotca/kotoba/words-en";
import { FR_WORDS } from "@johnmorrisdotca/kotoba/words-fr";

/**
 * STILL WINNABLE, STILL A CHALLENGE. John, 2026-09-26, asking for six-letter
 * words: "hopefully still challenging and still winnable." A guess count is a
 * claim about how hard a word is to find, so it is measured, not assumed.
 *
 * The measure is a plain greedy player: it knows every word that may be
 * guessed (not which of them can be hidden, which no player knows), guesses
 * only words that fit everything seen so far, and among those the one whose
 * letters are commonest in their places. A person plays worse at the start and
 * better at the end, so the numbers are a yardstick for comparing sizes, not a
 * forecast: six letters at their counts must be found about as often as five
 * letters at theirs, which players already find winnable.
 */

const ALLOWED: Record<Exclude<GomojiLanguage, "pop">, Record<number, { allowed: string }>> = { en: EN_WORDS, fr: FR_WORDS, de: DE_WORDS };

function allowedWords(size: number, lang: Exclude<GomojiLanguage, "pop">): string[] {
  return ALLOWED[lang][size]!.allowed.split(/\s+/).filter(Boolean);
}

/** Among the words still possible, the one whose letters are commonest in their places and anywhere. */
function greedyGuess(possible: readonly string[], size: number): string {
  const inPlace = Array.from({ length: size }, () => new Map<string, number>());
  const anywhere = new Map<string, number>();
  for (const word of possible) {
    for (let at = 0; at < size; at += 1) inPlace[at]!.set(word[at]!, (inPlace[at]!.get(word[at]!) ?? 0) + 1);
    for (const letter of new Set(word)) anywhere.set(letter, (anywhere.get(letter) ?? 0) + 1);
  }
  let best = possible[0]!;
  let bestScore = -1;
  for (const word of possible) {
    let score = 0;
    for (let at = 0; at < size; at += 1) score += inPlace[at]!.get(word[at]!)!;
    for (const letter of new Set(word)) score += anywhere.get(letter)!;
    if (score > bestScore) [best, bestScore] = [word, score];
  }
  return best;
}

/** How many guesses the greedy player takes to find `hidden`, giving up past twelve. */
function guessesTaken(hidden: string, pool: readonly string[], opening: string, size: number): number {
  let possible = pool;
  for (let taken = 1; taken <= 12; taken += 1) {
    const guess = taken === 1 ? opening : greedyGuess(possible, size);
    if (guess === hidden) return taken;
    const said = markGuess(guess, hidden).join();
    possible = possible.filter((word) => markGuess(guess, word).join() === said);
  }
  return 13;
}

/** The share of a level's answers (every `step`th, for time) the greedy player finds within `within` guesses. */
function foundWithin(size: number, lang: Exclude<GomojiLanguage, "pop">, within: readonly number[], step: number): number[] {
  const pool = allowedWords(size, lang);
  const opening = greedyGuess(pool, size);
  const hidden = answersFor(size, false, lang).filter((_, at) => at % step === 0);
  const taken = hidden.map((word) => guessesTaken(word, pool, opening, size));
  return within.map((count) => taken.filter((each) => each <= count).length / taken.length);
}

describe("Gomoji 6 is still winnable and still a challenge", () => {
  for (const lang of ["en", "fr", "de"] as const) {
    it(`${lang}: six letters are found within medium's and hard's guesses about as often as five letters within theirs`, () => {
      const counts = (size: number) => [guessesFor("gomoji", size, "medium", 0), guessesFor("gomoji", size, "hard", 0), 3];
      const [sixMedium, sixHard, sixInThree] = foundWithin(6, lang, counts(6), 8);
      const [fiveMedium, fiveHard] = foundWithin(5, lang, counts(5), 8);
      // Winnable: nearly always within medium's count, and almost always within hard's (measured 2026-09-26: 99–100% and 98–99.6%).
      expect(sixMedium, `${lang} six letters within medium's ${counts(6)[0]}`).toBeGreaterThanOrEqual(0.97);
      expect(sixHard, `${lang} six letters within hard's ${counts(6)[1]}`).toBeGreaterThanOrEqual(0.95);
      // Level with five letters, at each level: neither the easy size nor the hard one by more than a few words in a hundred.
      expect(Math.abs(sixHard - fiveHard), `${lang} six against five, at hard`).toBeLessThanOrEqual(0.06);
      expect(Math.abs(sixMedium - fiveMedium), `${lang} six against five, at medium`).toBeLessThanOrEqual(0.04);
      // A challenge: about half the words take more than three guesses even for a player who never forgets a letter.
      expect(sixInThree, `${lang} six letters within three`).toBeLessThan(0.6);
    });
  }
});

/*
 * FOUR LETTERS ARE NOT EASIER. John, 2026-09-28: "yes short words aren't
 * really easier to find." Four letters had five guesses at hard, as if a short
 * word were easier; the same player finds a four-letter word within six
 * guesses less often than a five-letter word within six (measured 2026-09-28:
 * English 80% against 98%, French 79% against 97%, German 91% against 94%),
 * and within the old five barely two times in three in English and French. A
 * short word gives away fewer letters a guess, and many four-letter words
 * differ from each other by a single letter. So hard gives six at every length.
 */
describe("four letters are no easier to find than five", () => {
  for (const lang of ["en", "fr", "de"] as const) {
    it(`${lang}: four letters within six guesses are found no more often than five within six, and the old five lost too many`, () => {
      const [fourHard, fourInFive] = foundWithin(4, lang, [guessesFor("gomoji", 4, "hard", 0), 5], 8);
      const [fiveHard] = foundWithin(5, lang, [guessesFor("gomoji", 5, "hard", 0)], 8);
      expect(guessesFor("gomoji", 4, "hard", 0)).toBe(guessesFor("gomoji", 5, "hard", 0));
      expect(fourHard, `${lang} four letters within six against five within six`).toBeLessThanOrEqual(fiveHard);
      expect(fourInFive, `${lang} four letters within the old five`).toBeLessThan(0.85);
    });
  }
});
