/** The notations famous games are kept in. */
export const FAMOUS_NOTATIONS = {
  /** Othello squares, columns a–h and rows 1–8 counted from the top: "f5". */
  othello: "othello",
  /** SGF points, column then row, each a letter from the top-left: "pd"; "--" is a pass. */
  sgf: "sgf",
} as const;

/**
 * Where the records came from, the credit each game is shown with, and the
 * words in the source's own terms that allow it — quoted, so the reason a game
 * may be shown is in the code beside it. `openBecause` is required: a source
 * whose terms do not grant use has no place here, however freely it can be
 * downloaded (see `famousGames.data.ts` for the one that was taken out).
 */
export const FAMOUS_SOURCES = {
  brouwer: {
    /** What the credit says, as a phrase: the reader's own language. */
    nameKey: "chrome.famous.sourceName",
    url: "https://homepages.cwi.nl/~aeb/go/games/",
    openBecause: "I do not claim any rights on this collection. The games here are in the public domain.",
  },
} as const;

/** The gallery's kanji, drawn beside its title for a reader of English. Its words are `chrome.famous.*`. */
export const FAMOUS_KANJI = "名局";
