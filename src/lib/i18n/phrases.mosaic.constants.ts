/**
 * mosaic.*: the picture of a whole game, and the wallpaper of a board: its dialog, its two shapes, its choices and what the picture itself says (`src/lib/record/mosaic.constants.ts`).
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_MOSAIC = {
  "mosaic.heading": "Game wallpaper",
  "mosaic.openLabel": "Every position",
  "mosaic.blurb": "Every position of this game, in order, on one image the size of your screen. Made in your browser; nothing is sent anywhere.",
  "mosaic.make": "Make the picture",
  "mosaic.making": "Drawing…",
  "mosaic.download": "Download",
  "mosaic.fullScreen": "View full screen",
  "mosaic.again": "Make it again",
  "mosaic.pickLegend": "More positions than the picture holds. Show ({count} positions, {tiles} tiles):",
  "mosaic.pickOpening": "the opening, counted from the first move",
  "mosaic.pickSpread": "the whole game, skipping evenly",
  "mosaic.pickEnding": "the ending, counted back from the last move",
  "mosaic.failed": "The picture could not be drawn in this browser.",
  "mosaic.shapeLabel": "Shape",
  "mosaic.landscape": "Landscape",
  "mosaic.landscapeNote": "1920×1080, a desktop or TV",
  "mosaic.portrait": "Portrait",
  "mosaic.portraitNote": "1170×2532, an iPhone",
  "mosaic.shownOf": "{shown} of {total} positions",
  "mosaic.vs": "{black} vs {white}",
  "mosaic.altGame": "Every position of this game, {count}",
  "mosaic.altSoFar": "Every position of this game so far, {count}",
  "mosaic.close": "Close",
  "mosaic.inPlay": "In play",
  "mosaic.wallpaperDrawing": "Drawing the board…",
  "mosaic.wallpaperFailed": "The board could not be drawn in this browser.",
  "mosaic.wallpaperAlt": "The finished board of {name}, as a wallpaper",
} as const;
