import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { kanaWordsOf } from "../gomojiKana/kanaWords";
import { markKanaGuess } from "../gomojiKana/kanaMarks";
import { decodeKanaGivens } from "../gomojiKana/kanaCode";
import { answersFor, decodeHidden, languageOf, markGuess } from "./code";
import { replayDodge, dodgeWord, dodgeFound, type DodgeMarker, type GreenCounter } from "./dodge";
import { gomojiLayout, guessesFor } from "./layout";
import { decodeDodgeGivens, isDodgeGivens } from "./dodgeSeed";

/**
 * A GOMOJI NIGE IN EACH LANGUAGE: the dodger (`dodge.ts`) given the words it
 * dodges among and the colours it answers in.
 *
 * The lettered Gomojis dodge among their level's answers, coloured as a
 * Gomoji is (`markGuess`); the kana one among its, coloured by John's kana
 * rules with their arrows (`markKanaGuess`) — its lists loaded first, as for
 * any kana puzzle (`preparePuzzle`). What a dodger's givens are is in
 * `dodgeSeed.ts`, which carries no word list.
 */
/** The words a dodger may end on: the level's answers, the commonest for easy, as the hidden word is drawn. */
export function dodgePool(kind: PuzzleKind, size: number, level: PuzzleLevel): readonly string[] {
  const easy = level === "easy";
  if (kind === "gomojiKana") {
    const words = kanaWordsOf(size);
    return easy ? words.easy : words.answers;
  }
  return answersFor(size, easy, languageOf(kind));
}

const letterMarker: DodgeMarker = (guess, word) => markGuess(guess, word).map((mark) => mark[0]).join("");
const letterGreens: GreenCounter = (pattern) => [...pattern].filter((char) => char === "h").length;

/** A kana colouring as a string: the mark's first letter, then "s" for a wrong size and "m" for a wrong mark, a "." between places. */
const kanaMarker: DodgeMarker = (guess, word) =>
  markKanaGuess([...guess], [...word])
    .map((each) => `${each.mark[0]}${each.wrongSize ? "s" : ""}${each.wrongMark ? "m" : ""}`)
    .join(".");
/** Plain greens only: a green with an arrow is not yet the kana. */
const kanaGreens: GreenCounter = (pattern) => pattern.split(".").filter((place) => place === "h").length;

export function dodgeMarkerOf(kind: PuzzleKind): { mark: DodgeMarker; greens: GreenCounter } {
  return kind === "gomojiKana" ? { mark: kanaMarker, greens: kanaGreens } : { mark: letterMarker, greens: letterGreens };
}

export type DodgeRead = {
  /** The word every row is coloured against: any word still standing would colour them alike (`dodgeWord`). */
  word: string;
  /** How many words are still standing. */
  standing: number;
  /** Whether the last guess pinned it down. */
  found: boolean;
};

/** Where a dodger stands after these guesses: replayed from the list, the same in every browser and on the server. */
export function readDodge(kind: PuzzleKind, size: number, level: PuzzleLevel, seed: number, guesses: readonly string[]): DodgeRead {
  const { mark, greens } = dodgeMarkerOf(kind);
  const { left } = replayDodge(dodgePool(kind, size, level), guesses, seed, mark, greens);
  return { word: dodgeWord(left), standing: left.length, found: dodgeFound(guesses, left) };
}

/**
 * HOW MANY GUESSES A DODGER GIVES: every row of its board at easy and medium,
 * one fewer at hard — the level's word list is the rest of its difficulty. A
 * word that dodges takes more guesses to pin down than a word that sits still:
 * a greedy solver needs up to seven for four letters and eight for three kana,
 * where a hidden word is found in six (`dodge.test.ts` measures it in every
 * language at every length). Never a free grey word, even in kana: nothing is
 * hidden for a word to be grey against.
 */
export function dodgeGuesses(kind: PuzzleKind, size: number, level: PuzzleLevel): number {
  const grid = kind === "gomojiKana" ? "gomojiKana" : "gomoji";
  const board = gomojiLayout(grid, size, "easy", 0).guesses;
  return level === "hard" ? board - 1 : board;
}

/** How widely the generator looks for each guess of its way to pin a dodger down: kana are slower to colour, so fewer. */
export function dodgeSample(kind: PuzzleKind): number {
  return kind === "gomojiKana" ? 30 : 60;
}

/**
 * THE WORD A GOMOJI'S ROWS ARE COLOURED AGAINST, whichever way it is played:
 * an ordinary Gomoji's hidden word, read from its givens, or the word a
 * dodger stands for after these guesses (`readDodge`). The one question every
 * page that draws, scores or names a finished word asks, so none of them has
 * to know a dodger from a word that sits still. Null for givens that are
 * neither, or a kana dodger whose list has not been loaded (`preparePuzzle`).
 */
export function wordOfPlay(kind: PuzzleKind, size: number, level: PuzzleLevel, givens: string, guesses: readonly string[]): string | null {
  const seed = decodeDodgeGivens(givens);
  if (seed !== null) {
    try {
      return readDodge(kind, size, level, seed, guesses).word || null;
    } catch {
      return null;
    }
  }
  if (kind === "gomojiKana") return decodeKanaGivens(givens, size)?.word ?? null;
  return decodeHidden(givens, size, languageOf(kind));
}

/** How many guesses a Gomoji played this way gives: a dodger's (`dodgeGuesses`), or the level's (`guessesFor`), a kana word's free grey word taken off. */
export function guessesOfPlay(kind: PuzzleKind, size: number, level: PuzzleLevel, givens: string): number {
  if (isDodgeGivens(givens)) return dodgeGuesses(kind, size, level);
  if (kind === "gomojiKana") return guessesFor("gomojiKana", size, level, decodeKanaGivens(givens, size)?.grey == null ? 0 : 1);
  return guessesFor("gomoji", size, level, 0);
}
