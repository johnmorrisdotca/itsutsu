import type { GomojiLanguage } from "./gomoji/code";
import { guessesOf, hiddenWordsOf, wordGridOf, wordRowsOf } from "./gomoji/futago";
import { futagoKanaScore, futagoScore } from "./gomoji/futagoScore";
import { guessesFor } from "./gomoji/layout";
import { asWordCount } from "./gomoji/wordsSeed";
import { kumimojiPoints } from "./kumimoji/check";
import { koushiPoints } from "./koushi/check";
import type { PuzzleKind, PuzzleLevel } from "./puzzles.types";

/**
 * WHAT A SOLVE SCORES ON A PUZZLE'S LEADERBOARD, as PuzzleMadness scores its
 * own (their `getScore`, read 2026-09-24): five points for every cell the
 * solver filled in, less fifty for every time they asked for help — here a
 * Check or a Hint — and never below nought. Printed cells score nothing, so a
 * harder puzzle is worth more simply because less of it is printed, and the
 * clock never costs anything; the fastest times are their own board.
 *
 * John, 2026-09-24, on PuzzleMadness: "I want leaderboards, which we have...
 * but these are so prominent and easy to read… Find out how they score these."
 * See docs/plans/numbers/NUM-11-puzzle-leaderboards.md.
 *
 * Worked out once, when a solve is kept (`keepSolve`), and stored with it, so a
 * board is one grouped query rather than a sum recomputed on every view.
 */
export const POINTS_A_CELL = 5;
export const POINTS_A_HELP = 50;

/**
 * The cells a solver filled: every cell of a Hidden Stones grid, the letters of
 * a Gomoji word, the unprinted ones of every other. A Bridges puzzle has no
 * cells to fill, so it counts every island's number — each end of every
 * bridge drawn — which is the work its answer is. A Picture logic puzzle has
 * no printed cells, and every cell is decided, shaded or empty, as in Hidden
 * Stones: its whole grid.
 */
export function cellsFilled(kind: PuzzleKind, size: number, givens: string): number {
  const area = size * size;
  if (kind === "hiddenStones" || kind === "pictureLogic") return area;
  if (kind === "bridges") return [...givens.slice(0, area)].reduce((total, cell) => total + (cell === "." ? 0 : Number(cell) || 0), 0);
  if (kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort" || kind === "gomojiPop") return size;
  // Every tile of a Kumimoji's bag is laid by the player: its givens are the bag.
  if (kind === "kumimoji") return givens.length;
  // Every tile of a Mahjong deal is taken by the player: its givens are the deal, a face a tile.
  if (kind === "mahjong") return givens.length;
  return [...givens.slice(0, area)].filter((cell) => cell === ".").length;
}

/**
 * A word puzzle has no cells to fill: it scores every letter it found, sooner
 * for more, the word itself, the rows it did not need and the time it took
 * (`wordScore`), and a word lost scores what it found. Read from the guesses,
 * run together as they are handed in. A Futago scores each of its two boards
 * so and adds them, and a Yotsugo each of its four (`futagoScore.ts`).
 */
export function wordPoints(size: number, givens: string, answer: string, elapsedMs: number, level?: PuzzleLevel, lang: GomojiLanguage = "en"): number {
  return wordsPoints(lang === "fr" ? "gomojiMot" : lang === "de" ? "gomojiWort" : lang === "pop" ? "gomojiPop" : "gomoji", size, givens, answer, elapsedMs, level);
}

/** A kana word, scored as English's is on the same scale (`kanaScore`). */
export function kanaPoints(size: number, givens: string, answer: string, elapsedMs: number, level?: PuzzleLevel): number {
  return wordsPoints("gomojiKana", size, givens, answer, elapsedMs, level);
}

function wordsPoints(kind: PuzzleKind, size: number, givens: string, answer: string, elapsedMs: number, level?: PuzzleLevel): number {
  const hidden = hiddenWordsOf(kind, size, givens);
  const guesses = guessesOf(kind, size, answer);
  if (hidden === null || guesses === null) return 0;
  // Weighed by the guesses the level gave (`layout.ts`); with no level, hard's count: the published one, a guess more for each word past the first. Mot and Wort are laid out as English is.
  const grid = wordGridOf(kind);
  const counted = level === undefined ? guessesFor(grid, size, "hard", 0, asWordCount(hidden.words.length)) : wordRowsOf(kind, size, level, hidden);
  // A solve kept under the larger count before 2026-09-28 is weighed by the rows it had, never fewer than the guesses it made.
  const rows = Math.max(counted, guesses.length);
  const score = grid === "gomojiKana" ? futagoKanaScore : futagoScore;
  return score(hidden.words, guesses, rows, elapsedMs).total;
}

export function pointsFor(
  kind: PuzzleKind,
  size: number,
  givens: string,
  checksUsed: number,
  hintsUsed: number,
  answer = "",
  elapsedMs = 0,
  level?: PuzzleLevel,
): number {
  /* A word's one help is its Head start, kept as a hint (`headStart.ts`) and priced as one: a free guess's worth off, never below nought. */
  const helped = (points: number) => Math.max(0, points - POINTS_A_HELP * hintsUsed);
  if (kind === "gomoji") return helped(wordPoints(size, givens, answer, elapsedMs, level));
  if (kind === "gomojiMot") return helped(wordPoints(size, givens, answer, elapsedMs, level, "fr"));
  if (kind === "gomojiWort") return helped(wordPoints(size, givens, answer, elapsedMs, level, "de"));
  if (kind === "gomojiPop") return helped(wordPoints(size, givens, answer, elapsedMs, level, "pop"));
  if (kind === "gomojiKana") return helped(kanaPoints(size, givens, answer, elapsedMs, level));
  // A tile game: ten a tile of the bag, and up to as much again for speed; each Help that arranged the hand into a word is a hint's worth off.
  if (kind === "kumimoji") return helped(kumimojiPoints(givens, elapsedMs));
  // Fewest swaps first, then time (`koushiPoints`); it has no helps to price.
  if (kind === "koushi") return koushiPoints(givens, answer, elapsedMs, level);
  return Math.max(0, POINTS_A_CELL * cellsFilled(kind, size, givens) - POINTS_A_HELP * (checksUsed + hintsUsed));
}
