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
  blockedWash: "rgba(34, 35, 31, 0.26)",
  shadow: "#2a1d0e",
} as const;

/** How long two taps on one tile may be apart and still be a double-tap, in milliseconds. */
export const MAHJONG_DOUBLE_TAP_MS = 350;

/** How far a press must move before it is a drag rather than a tap, in pixels. */
export const MAHJONG_DRAG_FROM_PX = 6;

/** Where the game at the table is kept in this browser (`keptInBrowser`). */
export const MAHJONG_TABLE_STORAGE_KEY = "itsutsu:mahjong-table";

/** Where the reader's choice of lighting the free tiles is kept, in this browser. */
export const MAHJONG_FREE_STORAGE_KEY = "itsutsu:mahjong-free";

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
  bonusGroup: "Any flower, any season",
  bonusSame: "Identical",
  bonusBlurb: {
    group: "The usual rule: any flower takes any flower and any season any season.",
    same: "Flowers and seasons come in identical pairs, and match only their twin.",
  },
  tableLead: "Two to four take turns on one layout, a pair a turn; dragons and winds score most.",
} as const;
