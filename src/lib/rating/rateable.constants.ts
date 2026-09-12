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
export const RATING_REFUSED_WORD = "Will not count";

export const RATING_REFUSAL_DISPLAY: Record<
  RatingRefusal,
  { playing: string; filed: string; kanji: string; sentence: string; short: string }
> = {
  [RATING_REFUSALS.unnamed]: {
    playing: "This game will not count",
    filed: "This game did not count",
    kanji: "無名",
    sentence:
      "A seat here has no name on it, so there is nobody for the result to belong to. A name on both seats is what makes a game count.",
    short: `${RATING_REFUSED_WORD} — a seat has no name`,
  },
  [RATING_REFUSALS.onePlayer]: {
    playing: "This game will not count",
    filed: "This game did not count",
    kanji: "一人二役",
    sentence:
      "Both seats are the same player. A rating says how two people compare, and there is only one person here — so the game is filed and replayed like any other, but no rating moves.",
    short: `${RATING_REFUSED_WORD} — one player`,
  },
  [RATING_REFUSALS.keptRecord]: {
    playing: "This game will not count",
    filed: "This game did not count",
    kanji: "記録",
    sentence:
      "One of these names belongs to a record kept from before this site, which nobody plays under here. The game is filed, but the ladder is left alone.",
    short: `${RATING_REFUSED_WORD} — a kept record`,
  },
  [RATING_REFUSALS.hotSeat]: {
    playing: "This game will not count",
    filed: "This game did not count",
    kanji: "同卓",
    sentence:
      "Both seats were played from one screen, so there is no way to tell the two of you apart from a login. A rating is an exchange between two separate players, and hot-seat play cannot give the site one — however the two names read.",
    short: `${RATING_REFUSED_WORD} — one screen`,
  },
};
