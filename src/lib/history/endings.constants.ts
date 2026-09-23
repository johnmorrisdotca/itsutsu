/** Which of a player's finished games an end-positions mosaic shows. */
export const ENDINGS_OUTCOMES = {
  won: "won",
  lost: "lost",
  all: "all",
} as const;

export type EndingsOutcome = (typeof ENDINGS_OUTCOMES)[keyof typeof ENDINGS_OUTCOMES];

export const ENDINGS_OUTCOME_LIST = [ENDINGS_OUTCOMES.won, ENDINGS_OUTCOMES.lost, ENDINGS_OUTCOMES.all] as const;

/**
 * The most games one ask brings back: the newest, a picture's worth. The same
 * number as the tiles a move mosaic holds, so one ask is never more than one
 * picture — and the read stays one small query however long somebody has
 * played here.
 */
export const ENDINGS_MOST = 120;

/** The words on the panel. */
export const ENDINGS_COPY = {
  heading: "Every game, as it ended",
  kanji: "終局絵",
  blurb:
    "The last position of each game of one kind, side by side on one picture the size of your screen. Drawn in your browser, newest game first.",
  gameLabel: "Game",
  outcomeLabel: "Which games",
  outcomes: { won: "Won", lost: "Lost", all: "All finished" },
  make: "Make the picture",
  making: "Drawing…",
  download: "Download",
  none: "No finished games of that kind to draw.",
  otherSizes: (count: number) => `${count} ${count === 1 ? "game" : "games"} on other board sizes left out.`,
  failed: "The picture could not be made.",
} as const;
