/**
 * Mahjong Solitaire's screen: the tiles' colours and sizes, and the words it
 * says. One constants module for the Mahjong components.
 */

/**
 * THE TILES' INKS, fixed in both themes: a tile is a light object on the table
 * by night as by day, so nothing on it reads the page's colours.
 */
export const MAHJONG_INK = {
  ink: "#22231f",
  soft: "#6f6a62",
  red: "#b2302f",
  green: "#2f6b3a",
  blue: "#1f4e8c",
  ochre: "#9d6c1f",
  flower: "#b0457a",
  season: "#c2711c",
} as const;

/**
 * A TILE, in the board's own units: its face 30 by 40 (the proportions of a
 * real tile), a layout's half-tile 15 across and 20 down, and each layer
 * raised `depth` up and to the right, its thickness showing below and to the
 * left as the sides of a real stack do.
 */
export const MAHJONG_TILE = {
  faceWidth: 30,
  faceHeight: 40,
  halfX: 15,
  halfY: 20,
  depth: 5,
  face: "#fffdf6",
  rim: "#b9ad96",
  side: "#d9c59b",
  sideEdge: "#a8926a",
  chosen: "#dbe8d3",
  chosenRing: "#52664b",
  hinted: "#9d6c1f",
  /** Find's colour, its own beside the chosen green and the hint's ochre: a solid ring on a match that could be taken now, a dashed one on a held match. */
  found: "#1c6e8c",
  foundWash: "rgba(28, 110, 140, 0.16)",
  blockedWash: "rgba(34, 35, 31, 0.26)",
  shadow: "#2a1d0e",
} as const;

/**
 * THE LAYOUTS TOO WIDE FOR A PHONE'S TILES TO BE TAPPED WHOLE are looked at through the zoom Bridges and Tsunagi use
 * (`TsunagiViewport`): from the Turtle's fifteen tiles across up, and the mega layouts (the Wall's twenty, the Palace's
 * twenty-six) as far as `MAHJONG_MOST_ZOOM_MEGA` times, since a tile of the whole Palace fitted to 390 pixels is thirteen
 * across and three times that is still only 39.
 */
export const MAHJONG_ZOOM_FROM = 15;
export const MAHJONG_MEGA_FROM = 20;
export const MAHJONG_MOST_ZOOM = 3;
export const MAHJONG_MOST_ZOOM_MEGA = 4;

/** How far a layout of this width may be zoomed in. */
export function mahjongMostZoom(size: number): number {
  return size >= MAHJONG_MEGA_FROM ? MAHJONG_MOST_ZOOM_MEGA : MAHJONG_MOST_ZOOM;
}

/** How long two taps on one tile may be apart and still be a double-tap, in milliseconds. */
export const MAHJONG_DOUBLE_TAP_MS = 350;

/** How far a press must move before it is a drag rather than a tap, in pixels. */
export const MAHJONG_DRAG_FROM_PX = 6;

/** Where the game at the table is kept in this browser (`keptInBrowser`). */
export const MAHJONG_TABLE_STORAGE_KEY = "itsutsu:mahjong-table";

/** Where the reader's choice of lighting the free tiles is kept, in this browser. */
export const MAHJONG_FREE_STORAGE_KEY = "itsutsu:mahjong-free";

/** Where the reader's choice of Find is kept, in this browser. */
export const MAHJONG_FIND_STORAGE_KEY = "itsutsu:mahjong-find";

/** How long a computer takes over its turn at the table, so a watcher sees each pair go, in milliseconds. */
export const MAHJONG_COMPUTER_PAUSE_MS = 700;

export const MAHJONG_COPY = {
  howTo: "Tap a free tile, then its match — or drag one onto the other. Double-tap takes a tile with its free match.",
  chosen: "Now its match: another free tile the same.",
  blocked: "That tile is not free: something lies on it, or it is held on both sides.",
  noMatch: "Those two do not match.",
  stuck: "No free pair is left. Shuffle the tiles, or Undo.",
  hopeless: "No shuffle can free these: Undo to go back.",
  shuffled: "Shuffled: the tiles left are laid again where they lay.",
  freeOn: "Free tiles lit",
  freeOff: "Classic look",
  freeBlurb: {
    on: "Blocked tiles are dimmed, so the free ones stand out.",
    off: "Every tile looks alike, as on a real table: find the free ones yourself.",
  },
  findOn: "Find",
  findOff: "No find",
  findBlurb: {
    on: "Point at or choose a tile and its matches light up: a solid ring can be taken with it now, a dashed one is held.",
    off: "Matches are not shown: look for them yourself.",
  },
  noFreeMatch: "No free tile matches that one: here is another pair.",
  bonusGroup: "Any flower, any season",
  bonusSame: "Identical",
  bonusBlurb: {
    group: "The usual rule: any flower takes any flower and any season any season.",
    same: "Flowers and seasons come in identical pairs, and match only their twin.",
  },
  tableLead: "Two to four take turns on one layout, a pair a turn; dragons and winds score most.",
} as const;
