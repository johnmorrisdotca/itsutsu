import { puzzleHash } from "../puzzleCode";
import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { seededRandom, shuffled } from "../random";
import { kanaBase } from "../gomojiKana/kanaMarks";
import { languageOf } from "./code";
import { hiddenWordsOf } from "./futago";

/**
 * GOMOJI'S HEAD START (先手, the name and kanji a game's head start has on
 * this site). John, 2026-09-26: "add another game option for easy mode: start
 * seed chars (pick name), when selected a random N chars based on word size,
 * will already be eliminated for you on the keyboard. Like a free word guess
 * without taking up size on the board."
 *
 * Chosen on the set-up screen, at easy only, off unless chosen. With it on the
 * keyboard opens with as many keys grey as the word has letters (or kana) —
 * five for a five-letter word — each exactly as a guess would have greyed it:
 * not in the word. None is ever a letter of the word, and no row is used.
 *
 * WHICH KEYS. The help is only real if the letters are ones a player would
 * have tried, so they come from the top of the language's own ranking
 * (`HEAD_START_RANKS`): the letters not in the word, in that order, the first
 * twice as many as are needed, and from those the ones needed, drawn by a
 * shuffle. The draw is seeded from the puzzle's givens (`puzzleHash`), which
 * the seed alone decides, so the same number is the same head start in every
 * browser, a paused run opens with it again, and a finished solve replays it
 * from what the site kept of it — which is the givens and not the seed. Twice
 * as many, rather than exactly the top ones, so an ungreyed common letter says
 * nothing: E left white is as likely a coin toss as a letter of the word.
 */

/**
 * The keys each language ranks first, as they are spread across its easy
 * words: how many of the four- and five-letter easy answers hold each letter
 * (each letter once a word), most first, ties alphabetical. For kana, the
 * base kana (`kanaBase`: ぱ counts for は) across the three-, four- and
 * five-kana easy answers. Read from the lists on 2026-09-26 and written down
 * rather than counted at run time, so a list refreshed next month can never
 * change the head start of a puzzle already played; a key missing here comes
 * after every one that is, in its keyboard's order.
 */
export const HEAD_START_RANKS = {
  en: "eartoilsnduchpmgbwfykvzjqx",
  fr: "eriaotunlscpmdbgvfhxjyqzk",
  de: "earntilshuogdmbkfcwzpüväöjxqy",
  ja: "うんしいよかくきつゆこたとりせけちさてはふひるやおそほえすにあみなもめらまねのろわへれむぬ",
} as const;

/** Every key a kana puzzle's keyboard has, for the few the ranking has not met (を, ー). */
const KANA_KEYS = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんー";

/** Every key of the Latin keyboards, for any letter the rankings leave out. */
const LATIN_KEYS = { en: "abcdefghijklmnopqrstuvwxyz", fr: "abcdefghijklmnopqrstuvwxyz", de: "abcdefghijklmnopqrstuvwxyzäöü" } as const;

/** The pool the keys are drawn from: this many times as many as are greyed. */
const POOL_TIMES = 2;

/** A word puzzle offers Head start, and only at easy. */
export function offersHeadStart(kind: PuzzleKind, level: PuzzleLevel): boolean {
  return (kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort") && level === "easy";
}

/**
 * The keys a puzzle's head start greys: `count` of the ranking's keys not in
 * `excluded`, drawn from the first `POOL_TIMES × count` of them by a shuffle
 * seeded from `givens`. Fewer only when fewer keys are left, never one that
 * is excluded.
 */
export function drawHeadStart(ranking: string, keys: string, excluded: ReadonlySet<string>, count: number, givens: string): string[] {
  const order = [...new Set([...ranking, ...keys])].filter((key) => !excluded.has(key));
  const pool = order.slice(0, POOL_TIMES * count);
  return shuffled(pool, seededRandom(parseInt(puzzleHash(givens), 16))).slice(0, count);
}

/**
 * The keys greyed before the first guess of this puzzle, lower-case letters
 * or base kana, as many as the word is long; none for givens that do not read
 * as this kind's. For kana, the free grey word's kana are left out as well as
 * the word's: they are grey already, and a head start spent on them would be
 * no help.
 */
export function headStartKeys(kind: PuzzleKind, size: number, givens: string): string[] {
  // One word or a Futago's two (`futago.ts`): a key greyed is in neither.
  const hidden = hiddenWordsOf(kind, size, givens);
  if (hidden === null) return [];
  if (kind === "gomojiKana") {
    const excluded = new Set([...hidden.words.join(""), ...(hidden.grey ?? "")].map(kanaBase));
    return drawHeadStart(HEAD_START_RANKS.ja, KANA_KEYS, excluded, size, givens);
  }
  const lang = languageOf(kind);
  return drawHeadStart(HEAD_START_RANKS[lang], LATIN_KEYS[lang], new Set(hidden.words.join("")), size, givens);
}

/*
 * WHERE IT IS KEPT. A word puzzle offers neither Check nor Hint (`helps:
 * false`): its colours already say what they would. Head start is the one
 * help it has, so it is kept where every other puzzle keeps its Hint, and
 * nowhere else: a kept run's `hintsAllowed` says it was chosen, and a
 * finished solve's `hintsUsed` holds one for it — the help it was, priced as a
 * Hint is (`POINTS_A_HELP`). No word run or solve kept before it ever had
 * either, so for a word puzzle the two can only mean this.
 */

/** The hints a word solve with a head start is kept with: one help, taken before the first guess. */
export const HEAD_START_HINTS = 1;

/** Whether a kept word run or solve had its head start, from the hint columns it is kept in. */
export function hadHeadStart(kind: PuzzleKind, level: string, hintsKept: boolean | number | null | undefined): boolean {
  return offersHeadStart(kind, level as PuzzleLevel) && (hintsKept === true || (typeof hintsKept === "number" && hintsKept > 0));
}

/** The help a kept solve took, in words — "1 hint", "3 hints", or "Head start" for a word puzzle's — or null for none. */
export function hintsWords(kind: PuzzleKind, level: string, hintsUsed: number | null): string | null {
  if (!hintsUsed) return null;
  if (hadHeadStart(kind, level, hintsUsed)) return "Head start";
  return `${hintsUsed} ${hintsUsed === 1 ? "hint" : "hints"}`;
}
