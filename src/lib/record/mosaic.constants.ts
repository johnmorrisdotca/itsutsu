/**
 * How a move mosaic chooses its positions when a game has more than fit — see
 * `pickFrames` in mosaic.ts.
 */
export const MOSAIC_PICKS = {
  every: "every",
  spread: "spread",
  ending: "ending",
} as const;

export type MosaicPick = (typeof MOSAIC_PICKS)[keyof typeof MOSAIC_PICKS];

/**
 * The most tiles one picture holds. At a 4K screen that is tiles of about 190
 * pixels, where a 15-point board is still readable; past it a picture stops
 * being a game and becomes texture. A longer game is thinned by `spread` or
 * cut to its `ending`.
 */
export const MOSAIC_MOST_TILES = 120;

/**
 * The biggest picture the browser is asked to make, in pixels on its longer
 * side. A phone's screen times its pixel ratio is already about this; a
 * bigger canvas costs memory for no picture anybody can see.
 */
export const MOSAIC_LONGEST_SIDE = 3840;

/** The picture's colours: the site's wood and ink, on a dark ground so the boards read as tiles. */
export const MOSAIC_ART = {
  ground: "#1c1712",
  wood: "#e2ba7a",
  line: "#5b3d1c",
  black: "#1a1a1a",
  white: "#f4f2ec",
  whiteEdge: "#9a9a9a",
  hot: "#d9a400",
  crown: "#c8a042",
  label: "#5b3d1c",
  /** The margin round each tile, as a share of its side. */
  gap: 0.04,
  /** The smallest tile, in pixels, that carries its move number. */
  labelFrom: 60,
} as const;

/** The words on the panel that makes one. */
export const MOSAIC_COPY = {
  heading: "The game as one picture",
  /** The quiet button beside a move list that opens the picture in a window. */
  openLabel: "Every position",
  kanji: "棋譜絵",
  blurb: "Every position of this game, in order, on one image the size of your screen. Made in your browser; nothing is sent anywhere.",
  make: "Make the picture",
  making: "Drawing…",
  download: "Download",
  again: "Make it again",
  pickLabel: "This game is too long for a tile a move. Show",
  picks: {
    spread: "the whole game, skipping evenly",
    ending: "the ending, counted back from the last move",
  },
  failed: "The picture could not be drawn in this browser.",
  fill: "Fill the space after the last move with the game's details",
  site: "itsutsu.com",
} as const;

/** The words on a live board's picture of its positions so far — see `VisualMoves`. */
export const VISUAL_MOVES_COPY = {
  summary: "Every position so far",
  kanji: "局面",
  soFar: "In play",
} as const;
