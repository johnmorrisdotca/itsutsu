/** The notations famous games are kept in. */
export const FAMOUS_NOTATIONS = {
  /** Othello squares, columns a–h and rows 1–8 counted from the top: "f5". */
  othello: "othello",
  /** SGF points, column then row, each a letter from the top-left: "pd"; "--" is a pass. */
  sgf: "sgf",
} as const;

/**
 * Where the records came from, and the credit each one is shown with. The moves
 * are facts; the collections are other people's work, so every game says whose.
 * See the research report that chose them for each source's terms.
 */
export const FAMOUS_SOURCES = {
  wthor: {
    name: "WTHOR database, Fédération Française d'Othello",
    url: "https://www.ffothello.org/informatique/la-base-wthor/",
  },
  brouwer: {
    name: "Andries Brouwer's database of Go games, CWI (public domain)",
    url: "https://homepages.cwi.nl/~aeb/go/games/",
  },
} as const;

/** The words on the gallery. */
export const FAMOUS_COPY = {
  title: "Famous games",
  kanji: "名局",
  blurb:
    "Championship and historic games, replayed move by move through this site's own rules. Each one can be made into a picture of every position — drawn in your browser.",
  source: "Record:",
} as const;
