import { KUNIATE_GUESSES } from "./pool.constants";

/**
 * KUNIATE'S STRINGS. Givens are the hidden country's two-letter code and the way it
 * is asked (`KuniateWay`, the puzzle's size): `FR1` is France by its outline. What is
 * played is the guesses run together, two letters each: `DEBEFR`. A win ends on the
 * hidden code, and a kept run is the guesses so far.
 */

/** How a country is asked for: its outline, its flag or its capital. The set-up's three tiles, and the puzzle's size. */
export const KUNIATE_OUTLINE = 1;
export const KUNIATE_FLAG = 2;
export const KUNIATE_CAPITAL = 3;

/** The guesses a game gives. */
export const KUNIATE_GUESS_COUNT = 6;

/** The hidden code and its way, or null for givens that are not a question of this size. */
export function readQuestion(givens: string, size: number): string | null {
  if (typeof givens !== "string" || givens.length !== 3 || givens[2] !== String(size)) return null;
  const code = givens.slice(0, 2);
  return KUNIATE_GUESSES.has(code) ? code : null;
}

/** The guesses in a string of them, or null for anything but places on the list, none twice, and no more than a game gives. */
export function readGuesses(code: string): string[] | null {
  if (typeof code !== "string" || code.length % 2 !== 0 || code.length > KUNIATE_GUESS_COUNT * 2) return null;
  const guesses: string[] = [];
  for (let at = 0; at < code.length; at += 2) {
    const guess = code.slice(at, at + 2);
    if (!KUNIATE_GUESSES.has(guess) || guesses.includes(guess)) return null;
    guesses.push(guess);
  }
  return guesses;
}
