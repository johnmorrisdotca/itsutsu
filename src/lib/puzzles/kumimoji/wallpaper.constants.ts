/**
 * HOW MANY CROSSWORDS ONE WALLPAPER HOLDS: the member's newest two dozen.
 *
 * A crossword needs more room than a board position does — its letters have
 * to stay letters. Two dozen lays out six by four on the landscape picture
 * (cells of 240 px) and three by eight on the portrait one (about 296 px), so a
 * Classic hand's crossword, seven or eight squares across, is drawn with tiles
 * about 22 px wide and letters about 12 px high: still read, not texture.
 * Forty-eight would halve that. The game wallpaper's `MOSAIC_MOST_TILES` is
 * 120 because a stone needs no letter.
 *
 * It is also the `take` of the one query the press makes, so the site never
 * reads more rows than the picture can show.
 */
export const KUMIMOJI_WALLPAPER_MOST = 24;

/** Empty squares drawn round a crossword's tiles in its cell, so it sits on the table rather than filling it to the rim. */
export const WALLPAPER_TABLE_MARGIN = 1;

/**
 * A tile's colours as the game draws them (`kumimoji.constants.ts`, `KumimojiTileFace`):
 * a white tile with an ink letter and a rim a shade darker, and the wild in the
 * brand's charcoal and ivory, fixed in both themes as the game fixes them.
 */
export const WALLPAPER_TILE_ART = {
  tile: "#ffffff",
  rim: "#4b4a44",
  letter: "#22231f",
  wild: "#22231f",
  wildLetter: "#fffef9",
  shadow: "rgba(0,0,0,0.35)",
  /** The table's ruling, over the wood, faint as the game's is. */
  rulingOpacity: 0.35,
  /** A tile's letter, as a share of its side (`tileLetterPx`). */
  letterShare: 0.56,
  /** The kana's other forms in its corner, as a share of the letter. */
  formsShare: 0.34,
  /** The least side, in pixels, a tile needs before its corner forms are drawn. */
  formsFrom: 22,
  /** The least side, in pixels, a blank wild needs before its five stones are drawn. */
  stonesFrom: 14,
} as const;

/** The words on the press, the window and the picture. */
export const KUMIMOJI_WALLPAPER_COPY = {
  openLabel: "Wallpaper of your crosswords",
  heading: "Crossword wallpaper",
  kanji: "壁紙",
  loading: "Fetching your finished crosswords…",
  failed: "Your crosswords could not be fetched just now. Close this and try again.",
  empty: "You have not finished a crossword yet. Every one you finish is kept, and this picture lays them all out together.",
  emptyLink: "Build your first →",
  /** The picture's name after the logo. */
  name: (game: string, count: number) => `${game} · ${count === 1 ? "one crossword" : `${count} crosswords`}`,
  /** Said when the member has more than the picture holds: it shows the newest. */
  newest: (count: number) => `your newest ${count}`,
  tiles: (count: number) => `${count} ${count === 1 ? "tile" : "tiles"}`,
  alt: (count: number) => `Your ${count === 1 ? "finished crossword" : `${count} finished crosswords`}, laid out as one picture`,
} as const;
