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
 * How many tiles set the smallest a tile gets. Past it a picture stops being a
 * game and becomes texture, so a longer game is thinned by `spread` or cut to
 * its `ending` — though a shape that has room for whole rows or columns more
 * at that same size takes them (see `mosaicPlan`), so a long game fills its
 * picture rather than stopping short of the edge.
 */
export const MOSAIC_MOST_TILES = 120;

/**
 * The two shapes a picture is made in. John, 2026-09-25: "we should have a
 * mobile vertical view and a horizontal desktop view... two shapes... a 1080P
 * shape and a vertical iPhone popular format shape." Fixed sizes rather than
 * the reader's own screen, so a picture made on one device is the same picture
 * on every other, and one shared looks as it did to whoever made it.
 */
export const MOSAIC_SHAPES = {
  landscape: { width: 1920, height: 1080, label: "Landscape", note: "1920×1080, a desktop or TV" },
  portrait: { width: 1170, height: 2532, label: "Portrait", note: "1170×2532, an iPhone" },
} as const;

export type MosaicShape = keyof typeof MOSAIC_SHAPES;

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
  /** The title bar across the top: a band a shade lighter than the ground, a wood rule under it. */
  bar: "#2c231a",
  barBrand: "#e2ba7a",
  barTitle: "#f4efe4",
  barLine: "#c9b89c",
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
  pickLabel: "More positions than the picture holds. Show",
  picks: {
    spread: "the whole game, skipping evenly",
    ending: "the ending, counted back from the last move",
  },
  failed: "The picture could not be drawn in this browser.",
  shapeLabel: "Shape",
  /** The start of the title bar across the top of every picture. */
  brand: "ITSUTSU GAME VIEWER",
  site: "itsutsu.com",
  /** The bar's note when the grid holds fewer positions than the game has: "120 of 211 positions". */
  shownOf: (shown: number, total: number) => `${shown} of ${total} positions`,
} as const;

/** The words on a live board's picture of its positions so far — see `VisualMoves`. */
export const VISUAL_MOVES_COPY = {
  summary: "Every position so far",
  kanji: "局面",
  soFar: "In play",
} as const;
