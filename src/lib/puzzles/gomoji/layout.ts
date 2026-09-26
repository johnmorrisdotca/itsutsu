import type { PuzzleLevel } from "../puzzles.types";

/**
 * HOW BIG A GOMOJI BOARD IS, HOW MANY GUESSES IT GIVES, AND WHERE PLAY SITS
 * ON IT — the one rule the solve screens, the server's checks, the scoring,
 * the replay and a finished puzzle's page all read, so none can disagree.
 *
 * John, 2026-09-25: "EASY can have full height. for 5x5, we can even allow an
 * extra row... I don't understand why for 5x5 our board is less squares, even
 * for EASY mode. should be the same board as 4x4 perhaps. but like I said,
 * easy should get one more guess at least", and before it, "rather than
 * starting at the top, if we're trying to restrict a row, start one row
 * lower".
 *
 *  - THE BOARD is square, at least `LEAST_SPAN` tall, and as wide as the word
 *    with the spare columns split evenly either side (`boardSpan`): 8×8 for
 *    four or six letters or four kana, 9×9 for three or five, which centre
 *    only on an odd board.
 *  - THE GUESSES: hard keeps the published count (a letter more than the word
 *    for English, never more than six; six for kana); medium one more; easy
 *    every row of the board.
 *  - THE PLAY sits in the middle of the board's height, a spare row over to the
 *    top, so play starts lower rather than against the edge.
 *
 * A kana word on easy or medium opens with a free grey word, which takes a row
 * and is not a guess (`free`).
 */
export const LEAST_SPAN = 8;

/** The smallest square at least `rows` tall and as wide as the word, the word centred on whole squares. */
export function boardSpan(size: number, rows: number): number {
  const span = Math.max(size, rows);
  return (span - size) % 2 === 0 ? span : span + 1;
}

/** The most guesses hard ever gives: Wordle's six, the published game's own count. */
const PUBLISHED_MOST = 6;

/**
 * The published game's count: a guess more than the word has letters for
 * English, up to six, and six for kana.
 *
 * Six letters stop at six. John, 2026-09-26, asking for them: "hopefully
 * still challenging and still winnable". A sixth letter tells more with every
 * guess, so a word of six is found no later than one of five: a greedy solver
 * finds the six-letter answers about as often within six guesses and within
 * seven as it finds the five-letter ones (`solvable.test.ts`). Seven for hard
 * would have made six letters the easiest size, and left easy and medium both
 * at eight on the 8×8 board.
 */
export function baseGuesses(kind: "gomoji" | "gomojiKana", size: number): number {
  return kind === "gomoji" ? Math.min(size + 1, PUBLISHED_MOST) : PUBLISHED_MOST;
}

/**
 * Where `drawn` rows of a `size`-wide word sit on their board: every Gomoji
 * board is at least `LEAST_SPAN` and no published count reaches it, so the
 * board follows from the rows drawn alone and the grid needs no level.
 */
export function playPlace(size: number, drawn: number): { span: number; top: number; left: number } {
  const span = boardSpan(size, Math.max(LEAST_SPAN, drawn));
  return { span, top: Math.ceil((span - drawn) / 2), left: (span - size) / 2 };
}

export type GomojiLayout = {
  /** The board's side, in squares. */
  span: number;
  /** How many guesses the player has. */
  guesses: number;
  /** Rows given before the first guess: the kana version's free grey word. */
  free: number;
  /** The first row of play, from the board's top. */
  top: number;
  /** The first column of play, from the board's left. */
  left: number;
};

/**
 * FUTAGO, TWO WORDS AT ONCE (`futago.ts`), is laid out by the same rule with
 * one more guess at every level, as Dordle gives seven where Wordle gives six:
 * every guess has to serve two words. Easy still gets every row of its board,
 * and its board is two squares taller than one word's, so easy stays a guess
 * or two ahead of medium: a Futago of five letters is 7, 8 and 9, of four 6, 7
 * and 8, and of six 7, 8 and 10 on a board of ten.
 */
export function gomojiLayout(kind: "gomoji" | "gomojiKana", size: number, level: PuzzleLevel, free: number, boards = 1): GomojiLayout {
  const more = boards - 1;
  const base = baseGuesses(kind, size) + more;
  const room = boardSpan(size, Math.max(LEAST_SPAN, base + free + 2 * more)) - free;
  const guesses = level === "easy" ? room : level === "medium" ? Math.min(base + 1, room) : base;
  return { ...playPlace(size, free + guesses), guesses, free };
}

/** The guesses a puzzle of this kind, size and level allows, with or without its free word, for one word or a Futago's two. */
export function guessesFor(kind: "gomoji" | "gomojiKana", size: number, level: PuzzleLevel, free: number, boards = 1): number {
  return gomojiLayout(kind, size, level, free, boards).guesses;
}

/** The most guesses any Gomoji can have — a Futago of six letters at easy — what a kept run's guesses are checked against before its level is known. */
export const MOST_GUESSES = 10;

/** The longest word any Gomoji hides, in letters or kana: seven, for Pop Gomoji's longest. */
export const LONGEST_WORD = 7;
