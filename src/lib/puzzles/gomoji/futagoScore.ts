import { kanaScore, type KanaScore } from "../gomojiKana/kanaScore";
import { boardGuesses } from "./futago";
import { wordScore, type WordScore } from "./wordScore";

/**
 * WHAT A FUTAGO SCORES: each board scored as a Gomoji word is (`wordScore`,
 * `kanaScore`), on the guesses it was shown, and the two added. Each letter
 * found is worth what it is worth on one board, each word found brings its
 * bonus, and a board found inside a minute its speed, so two words found are
 * worth about two words' points and one found and one lost about one and a
 * half — and a word lost still pays for every letter it gave up.
 *
 * Read from the guesses and the time alone, like a word's score, so the
 * server works it out itself.
 */
function added<Score extends WordScore>(scores: readonly Score[]): Score {
  const total = { ...scores[0]! };
  for (const score of scores.slice(1)) for (const key of Object.keys(total) as (keyof Score)[]) (total[key] as number) += score[key] as number;
  return total;
}

export function futagoScore(words: readonly string[], guesses: readonly string[], rows: number, elapsedMs: number): WordScore {
  return added(words.map((word) => wordScore(word, boardGuesses(guesses, word), rows, elapsedMs)));
}

export function futagoKanaScore(words: readonly string[], guesses: readonly string[], rows: number, elapsedMs: number): KanaScore {
  return added(words.map((word) => kanaScore(word, boardGuesses(guesses, word), rows, elapsedMs)));
}
