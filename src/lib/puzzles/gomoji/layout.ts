import type { PuzzleLevel } from "../puzzles.types";
import type { WordCount } from "./words.types";
import { YOTSUGO_MORE_GUESSES } from "./yotsugo";

/**
 * HOW BIG A GOMOJI BOARD IS, HOW MANY GUESSES IT GIVES, AND WHERE PLAY SITS
 * ON IT — the one rule the solve screens, the server's checks, the scoring,
 * the replay and a finished puzzle's page all read, so none can disagree.
 *
 * THE ROWS, THE SAME AT EVERY LENGTH. John, 2026-09-28, looking at the set-up
 * board at four, five and six letters: "The balance for these games is off.
 * Why is the five letter ones 9 rows and four and six letter one 8 rows… make
 * sure that the easiest ones to the hardest go from most rows to the least."
 * So one word has EASY 8, MEDIUM 7 and HARD 6 rows at every length, in every
 * language (`LEVEL_ROWS`). Before, four letters at hard had five: a short word
 * was thought easier to find. John, the same day: "yes short words aren't
 * really easier to find" — a short word reveals fewer letters a guess, and
 * many four-letter words differ from each other by one letter, so it needs its
 * guesses as much as any.
 *
 * A KANA WORD'S FREE GREY WORD (`free`) is one of those rows, on top, on easy
 * and medium: it is played for the player, so kana easy is the grey word and
 * seven guesses, medium the grey word and six, hard six with no grey word.
 * The rows still step 8, 7, 6, and the board is as tall as every other.
 *
 * SEVERAL WORDS (`MORE_ROWS`) keep their extra guesses on the same steps: a
 * Futago's two words a row more at every level (9, 8, 7), a Yotsugo's four
 * three more (11, 10, 9).
 *
 * THE BOARD (`gomojiBoard`) is as tall as its easiest level's rows at every
 * level — eight for one word, nine for a Futago, eleven for each of a
 * Yotsugo's boards — so choosing a level or a length never changes its
 * height, and fewer rows sit in the middle, a spare row over to the top. One
 * word's board is at least eight wide and the word centred on whole squares,
 * so an odd word is on a board a square wider than it is tall: nine across and
 * eight down for five letters. A board of two words (a Futago's, each of a
 * Yotsugo's two) is exactly their width, the two side by side with no wood to
 * either side, so their squares are as big as the phone allows (John,
 * 2026-09-28, of the two boards a Futago used to draw side by side: "So
 * small. It's hard to see").
 */
export const LEAST_SPAN = 8;

/** One word's rows at each level, the same at every length and in every language. */
export const LEVEL_ROWS: Readonly<Record<PuzzleLevel, number>> = { easy: 8, medium: 7, hard: 6, "extra-hard": 6 };

/** The rows more than one word's that several words give at every level: a guess more for each word past the first, three for a Yotsugo's four. */
export const MORE_ROWS: Readonly<Record<WordCount, number>> = { 1: 0, 2: 1, 4: YOTSUGO_MORE_GUESSES };

/** How many words a board of several holds side by side: a Futago's two on one board, a Yotsugo's four on two. */
export const WORDS_A_BOARD = 2;

/** The rows a level draws for this many words: its guesses and, for kana, the free grey word among them. */
export function levelRows(level: PuzzleLevel, boards: WordCount = 1): number {
  return LEVEL_ROWS[level] + MORE_ROWS[boards];
}

/** Where a Gomoji's rows sit on its board, and how big the board is. */
export type GomojiBoard = {
  /** The board's width, in squares. */
  cols: number;
  /** The board's height, in squares: its easiest level's rows, or more for a run kept under a count larger than today's. */
  rows: number;
  /** The first row of play, from the board's top. */
  top: number;
  /** The first column of play, from the board's left. */
  left: number;
};

/**
 * The board `drawn` rows of play stand on: `across` squares of play wide (one
 * word, or two side by side), as tall as `tall` or the rows drawn if more.
 * One word's board is at least `LEAST_SPAN` wide, the word centred on whole
 * squares; two words' board is exactly their width.
 */
export function gomojiBoard(size: number, boards: WordCount, drawn: number): GomojiBoard {
  const across = boards === 1 ? size : WORDS_A_BOARD * size;
  const rows = Math.max(levelRows("easy", boards), drawn);
  const least = boards === 1 ? Math.max(across, LEAST_SPAN) : across;
  const cols = (least - across) % 2 === 0 ? least : least + 1;
  return { cols, rows, top: Math.ceil((rows - drawn) / 2), left: (cols - across) / 2 };
}

export type GomojiLayout = GomojiBoard & {
  /** How many guesses the player has. */
  guesses: number;
  /** Rows given before the first guess: the kana version's free grey word. */
  free: number;
};

/** A puzzle's layout: its guesses at this level, and the board they and the free grey word stand on. */
export function gomojiLayout(kind: "gomoji" | "gomojiKana", size: number, level: PuzzleLevel, free: number, boards: WordCount = 1): GomojiLayout {
  const guesses = guessesFor(kind, size, level, free, boards);
  return { ...gomojiBoard(size, boards, free + guesses), guesses, free };
}

/** The guesses a puzzle of this kind, size and level allows, for one word, a Futago's two or a Yotsugo's four: the level's rows, less the free grey word where there is one. */
export function guessesFor(_kind: "gomoji" | "gomojiKana", _size: number, level: PuzzleLevel, free: number, boards: WordCount = 1): number {
  return levelRows(level, boards) - free;
}

/**
 * THE COUNTS BEFORE 2026-09-28, frozen, for what was kept under them. A run
 * left half way or a solve handed in under the old counts may hold more
 * guesses than today's count at its level — a five-letter easy had nine, and
 * a Futago of six letters at easy ten — so the server still takes up to the
 * larger of the two (`guessesEverAllowed`), and a run kept under the old count
 * opens with at least one guess left (`rowsResumed`). Nothing new is made
 * with these.
 */
export function formerGuessesFor(kind: "gomoji" | "gomojiKana", size: number, level: PuzzleLevel, free: number, boards: WordCount = 1): number {
  const room = (across: number, rows: number) => {
    const span = Math.max(across, rows);
    return (span - across) % 2 === 0 ? span : span + 1;
  };
  if (boards === 4) {
    const base = baseGuesses(kind, size) + YOTSUGO_MORE_GUESSES;
    return level === "easy" ? base + 2 : level === "medium" ? base + 1 : base;
  }
  const more = boards - 1;
  const base = baseGuesses(kind, size) + more;
  const easy = room(size, Math.max(LEAST_SPAN, base + free + 2 * more)) - free;
  return level === "easy" ? easy : level === "medium" ? Math.min(base + 1, easy) : base;
}

/** The most guesses a puzzle of this level may hold: today's count, or the count it had before 2026-09-28 if that was more. */
export function guessesEverAllowed(kind: "gomoji" | "gomojiKana", size: number, level: PuzzleLevel, free: number, boards: WordCount = 1): number {
  return Math.max(guessesFor(kind, size, level, free, boards), formerGuessesFor(kind, size, level, free, boards));
}

/**
 * The guesses a solve screen gives a run it resumed: today's count, or, for a
 * run kept under the old count that has already used as many, one more — never
 * more than it was first promised. So a run kept before the change opens, and
 * can be played on.
 */
export function rowsResumed(kind: "gomoji" | "gomojiKana", size: number, level: PuzzleLevel, free: number, boards: WordCount, guessed: number): number {
  const today = guessesFor(kind, size, level, free, boards);
  return guessed < today ? today : Math.min(guessed + 1, guessesEverAllowed(kind, size, level, free, boards));
}

/** The most guesses any Gomoji can have — a Yotsugo's eleven at easy, today and before — what a kept run's guesses are checked against before its level is known. */
export const MOST_GUESSES = 11;

/** The most guesses hard gave before 2026-09-28: six, the published game's own count. */
const PUBLISHED_MOST = 6;

/**
 * The published game's count, which hard kept before 2026-09-28: a guess more
 * than the word has letters for English, up to six, and six for kana. Read now
 * only for what was kept under it (`formerGuessesFor`, `checkOutOfGuesses`).
 */
export function baseGuesses(kind: "gomoji" | "gomojiKana", size: number): number {
  return kind === "gomoji" ? Math.min(size + 1, PUBLISHED_MOST) : PUBLISHED_MOST;
}

/** The longest word any Gomoji hides, in letters or kana: seven, for Pop Gomoji's longest. */
export const LONGEST_WORD = 7;
