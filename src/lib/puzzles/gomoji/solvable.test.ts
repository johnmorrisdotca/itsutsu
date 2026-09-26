import { describe, expect, it } from "vitest";

import { answersFor, markGuess, type GomojiLanguage } from "./code";
import { guessesFor } from "./layout";
import { DE_WORDS } from "./words.de.data";
import { EN_WORDS } from "./words.en.data";
import { FR_WORDS } from "./words.fr.data";

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
