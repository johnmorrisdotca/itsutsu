import type { PhraseKey } from "@/lib/i18n/i18n.constants";

/**
 * Why a game does not move anybody's rating.
 *
 * These are the rules `recordResult` has always applied, and until now it
 * applied them without telling anyone: it took the two names, decided there
 * was no rating to be had, and returned. The game was filed, the stones were
 * kept, and the ladder simply did not move — with nothing on the board, the
 * record or the ladder saying why. Somebody playing themselves from two
 * devices watches an evening's game vanish from their figures with no way to
 * find out it was never going to be in them.
 *
 * So each refusal is a named thing with a sentence to say. The sentence lives
 * here, with no imports, because the panel that shows it is a client
 * component while the rule that decides it reads the legacy-player table —
 * server-side data, and not worth shipping to a browser to word a notice.
 */
export const RATING_REFUSALS = {
  unnamed: "unnamed",
  onePlayer: "one-player",
  keptRecord: "kept-record",
  /**
   * Two seats, one screen, one token. Deliberately not folded into
   * `onePlayer`: a hot-seat game can hold two real, different names, and
   * calling that "one player" would be a claim the page cannot back up. It
   * is also not "friendly" — nobody chose unrated, the site simply has no way
   * to tell the two of you apart from a login. See `gameRatingRefusal` in
   * `rateable.ts`, which is the only place this reason is produced.
   */
  hotSeat: "hot-seat",
  /**
   * A HANDICAP ON EITHER COLOUR. A game with one was rated like any other, so
   * both players' ratings moved over a game one of them had agreed to play on
   * harder rules. John, asked whether it should: "Fine don't".
   *
   * Not "friendly" either, for the reason hot seat is not: nobody chose it, and
   * no choice can undo it while the handicap stands. Produced by
   * `handicapRefusal`, which asks the engine's own `hasHandicap` — so a
   * head-start handicap is refused by the same check the day it joins that
   * function, without anybody finding this one.
   */
  handicap: "handicap",
  /**
   * A HEAD START FOR EITHER COLOUR — free turns at the start, or the game's own
   * traditional head start. A handicap by another name, refused by the same
   * check (`hasHandicap`), and named separately only so the page says which of
   * the two the players agreed to.
   */
  headStart: "head-start",
} as const;

export type RatingRefusal = (typeof RATING_REFUSALS)[keyof typeof RATING_REFUSALS];

/**
 * Two headings, because the same fact is said at two moments. On a board still
 * being played it is a warning — stop now, or play on knowing. On a filed game
 * it is an answer to a question already asked: I played this, so where is it?
 * The sentence under them is the same either way, and is written to be true in
 * both tenses.
 */
/**
 * THE SAME FACT IN ONE WORD, for the places that print "Rated" or "Friendly".
 *
 * A panel showed a refusal in full and then, in its folded summary line and in
 * the settings statement underneath, said "Rated" and "Counts towards
 * ratings" — both read straight off the row's `rated` column, three lines under
 * a notice saying the game would not count. Twelve production rows displayed
 * exactly that contradiction on one screen.
 *
 * So the third answer gets a word of its own. "Rated" and "Friendly" are what
 * the two ANSWERS to "should this count" look like; this is what it looks like
 * when the site cannot honour either — and a chip cannot carry a reason, so it
 * carries the verdict and leaves the reason to the sentence above it.
 */
export const RATING_REFUSED_WORD: PhraseKey = "rating.refusedWord";

type RefusalCopy = { playing: PhraseKey; filed: PhraseKey; kanji: string; sentence: PhraseKey; short: PhraseKey };

export const RATING_REFUSAL_DISPLAY: Record<RatingRefusal, RefusalCopy> = {
  [RATING_REFUSALS.unnamed]: {
    playing: "rating.willNotCount",
    filed: "rating.didNotCount",
    kanji: "無名",
    sentence: "rating.refusalUnnamed",
    short: "rating.refusalUnnamedShort",
  },
  [RATING_REFUSALS.onePlayer]: {
    playing: "rating.willNotCount",
    filed: "rating.didNotCount",
    kanji: "一人二役",
    sentence: "rating.refusalOnePlayer",
    short: "rating.refusalOnePlayerShort",
  },
  [RATING_REFUSALS.keptRecord]: {
    playing: "rating.willNotCount",
    filed: "rating.didNotCount",
    kanji: "記録",
    sentence: "rating.refusalKeptRecord",
    short: "rating.refusalKeptRecordShort",
  },
  [RATING_REFUSALS.hotSeat]: {
    playing: "rating.willNotCount",
    filed: "rating.didNotCount",
    kanji: "同卓",
    sentence: "rating.refusalHotSeat",
    short: "rating.refusalHotSeatShort",
  },
  [RATING_REFUSALS.handicap]: {
    playing: "rating.willNotCount",
    filed: "rating.didNotCount",
    kanji: "手合割",
    sentence: "rating.refusalHandicap",
    short: "rating.refusalHandicapShort",
  },
  [RATING_REFUSALS.headStart]: {
    playing: "rating.willNotCount",
    filed: "rating.didNotCount",
    kanji: "ハンデ戦",
    sentence: "rating.refusalHeadStart",
    short: "rating.refusalHeadStartShort",
  },
};
