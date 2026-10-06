import { PHRASES } from "../i18n/i18n.constants";

/**
 * How a move mosaic chooses its positions when a game has more than fit — see
 * `pickFrames` in mosaic.ts.
 */
export const MOSAIC_PICKS = {
  every: "every",
  opening: "opening",
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
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1170, height: 2532 },
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
  barTitle: "#f4efe4",
  barLine: "#c9b89c",
  /** The margin round each tile, as a share of its side. */
  gap: 0.04,
  /** The smallest tile, in pixels, that carries its move number. */
  labelFrom: 60,
} as const;

/**
 * The words of a mosaic in English: the dialog's and the picture's, read
 * straight from the phrase catalogue, and the two names that are the same in
 * every language. A reader's own language is `mosaicWords` (`mosaicWords.ts`);
 * this is for the places that have no speaker, and for the tests.
 * Relative imports only: the browser specs import this file.
 */
export const MOSAIC_COPY = {
  heading: PHRASES["mosaic.heading"],
  openLabel: PHRASES["mosaic.openLabel"],
  kanji: "棋譜絵",
  blurb: PHRASES["mosaic.blurb"],
  make: PHRASES["mosaic.make"],
  making: PHRASES["mosaic.making"],
  download: PHRASES["mosaic.download"],
  fullScreen: PHRASES["mosaic.fullScreen"],
  again: PHRASES["mosaic.again"],
  failed: PHRASES["mosaic.failed"],
  shapeLabel: PHRASES["mosaic.shapeLabel"],
  brand: "Itsutsu",
  site: "itsutsu.com",
  /** The bar's note when the grid holds fewer positions than the game has: "120 of 211 positions". */
  shownOf: (shown: number, total: number) =>
    PHRASES["mosaic.shownOf"].replace("{shown}", String(shown)).replace("{total}", String(total)),
} as const;

/** What the live board's picture of its positions so far is called, beside its kanji. */
export const VISUAL_MOVES_COPY = {
  kanji: "局面",
} as const;

/** The kanji beside a finished board's wallpaper — every game that is not a board game (`BoardWallpaper`). */
export const BOARD_WALLPAPER_COPY = {
  kanji: "壁紙",
} as const;
