import type {
  Appearance,
  BoardMarkKind,
  BoardThemeTokens,
  GridStyle,
  StoneSetTokens,
} from "./board.types";

/**
 * Board surfaces. Each is a real material rather than a colour swatch: kaya
 * and shinkaya are the two woods a go board is actually cut from, washi is
 * paper, sumi is ink, matcha is powdered tea. The grid, star points and
 * coordinates are tuned per surface so the contrast holds on all of them.
 */
export const BOARD_THEMES = {
  kaya: {
    label: "Kaya",
    kanji: "榧",
    surface:
      "radial-gradient(120% 90% at 20% 0%, #f0cf95 0%, #e2ba7a 45%, #d3a662 100%)",
    frame: "#8a5a24",
    line: "#5b3d1c",
    star: "#5b3d1c",
    coordinate: "#7c5a30",
    winning: "#d92d20",
    dark: false,
  },
  shinkaya: {
    label: "Shin-kaya",
    kanji: "新榧",
    surface:
      "radial-gradient(120% 90% at 25% 0%, #a9743f 0%, #8d5c30 50%, #714825 100%)",
    frame: "#40260f",
    line: "#2e1b0c",
    star: "#2e1b0c",
    coordinate: "#e8d3b6",
    winning: "#ffb020",
    dark: true,
  },
  washi: {
    label: "Washi",
    kanji: "和紙",
    surface:
      "radial-gradient(130% 100% at 15% 0%, #fbf7ee 0%, #f2ebdc 55%, #e7dcc6 100%)",
    frame: "#c8bda4",
    line: "#6b6152",
    star: "#6b6152",
    coordinate: "#8b8172",
    winning: "#c2410c",
    dark: false,
  },
  sumi: {
    label: "Sumi",
    kanji: "墨",
    surface:
      "radial-gradient(130% 100% at 20% 0%, #2c2f36 0%, #1e2127 55%, #14161b 100%)",
    frame: "#0b0d10",
    line: "#6f7681",
    star: "#8b93a0",
    coordinate: "#9aa2af",
    winning: "#f97316",
    dark: true,
  },
  matcha: {
    label: "Matcha",
    kanji: "抹茶",
    surface:
      "radial-gradient(130% 100% at 20% 0%, #9cb87a 0%, #82a05f 55%, #6a884a 100%)",
    frame: "#3f5228",
    line: "#33421f",
    star: "#33421f",
    coordinate: "#e9f0dc",
    winning: "#b91c1c",
    dark: true,
  },
} as const satisfies Record<string, BoardThemeTokens>;

/**
 * Stone colours. `classic` is the slate and clam of a real set; the rest keep
 * the same light/dark contrast so the board stays readable, and so the engine
 * terms "black" and "white" still describe what a player sees.
 */
export const STONE_SETS = {
  classic: {
    label: "Slate & shell",
    kanji: "那智黒",
    black: "radial-gradient(circle at 35% 30%, #6b6b6b 0%, #1a1a1a 45%, #000 100%)",
    white: "radial-gradient(circle at 35% 30%, #ffffff 0%, #ececec 45%, #bfbfbf 100%)",
    blackInk: "#ffffff",
    whiteInk: "#1a1a1a",
  },
  jade: {
    label: "Jade & bone",
    kanji: "翡翠",
    black: "radial-gradient(circle at 35% 30%, #3f7d63 0%, #14452f 45%, #06251a 100%)",
    white: "radial-gradient(circle at 35% 30%, #fffdf5 0%, #f2ead6 45%, #d8ccae 100%)",
    blackInk: "#eafff4",
    whiteInk: "#1f3a2c",
  },
  sakura: {
    label: "Plum & blossom",
    kanji: "桜",
    black: "radial-gradient(circle at 35% 30%, #a03a6b 0%, #5d1435 45%, #33071c 100%)",
    white: "radial-gradient(circle at 35% 30%, #fff5f8 0%, #ffe1ea 45%, #f3bfd0 100%)",
    blackInk: "#ffe9f2",
    whiteInk: "#5d1435",
  },
  indigo: {
    label: "Indigo & rice",
    kanji: "藍",
    black: "radial-gradient(circle at 35% 30%, #3b5f9e 0%, #14275a 45%, #081436 100%)",
    white: "radial-gradient(circle at 35% 30%, #fdfdfb 0%, #eef0e8 45%, #cfd3c4 100%)",
    blackInk: "#e6edff",
    whiteInk: "#14275a",
  },
  neon: {
    label: "Neon",
    kanji: "電光",
    black: "radial-gradient(circle at 35% 30%, #4b2fd0 0%, #2a1080 45%, #14063f 100%)",
    white: "radial-gradient(circle at 35% 30%, #b6fff4 0%, #5eead4 45%, #22c9b0 100%)",
    blackInk: "#c9b8ff",
    whiteInk: "#06302a",
  },
} as const satisfies Record<string, StoneSetTokens>;

/** How each grid style is named in the set-up. */
export const GRID_STYLES: Record<GridStyle, { label: string; kanji: string; hint: string }> = {
  auto: { label: "As the game is played", kanji: "本式", hint: "Five-in-a-row games on the lines; Othello and the drop games in the squares." },
  lines: { label: "On the lines", kanji: "碁盤", hint: "Stones on the crossings, as on a go board." },
  cells: { label: "In the squares", kanji: "升目", hint: "Stones inside the squares, as on a chess or Othello board." },
};

export const DEFAULT_APPEARANCE: Appearance = {
  boardTheme: "kaya",
  stoneSet: "classic",
  showCoordinates: true,
  showMoveNumbers: false,
  grid: "auto",
  // Not "do not turn it round": nobody has said, so the seat decides.
  flipped: null,
};

/** SVG stroke widths in board units (one intersection spacing = 1). */
export const LINE_WIDTH = 0.045;
export const EDGE_LINE_WIDTH = 0.08;
export const STAR_RADIUS = 0.11;

/** Width of the coordinate-label gutter along the top and left edges. */
export const LABEL_GUTTER = "1.5rem";

/** Obstacles are drawn as a sealed intersection rather than a stone. */
export const OBSTACLE_RADIUS = 0.3;

/**
 * How each overlay mark is drawn. Marks are advice, so they read as annotation
 * on top of the board rather than as anything that has been played.
 */
export const MARK_STYLE: Record<
  BoardMarkKind,
  { colour: string; shape: "ring" | "cross" | "dot" }
> = {
  forced: { colour: "#f97316", shape: "ring" },
  building: { colour: "#eab308", shape: "dot" },
  hint: { colour: "#0ea5e9", shape: "dot" },
  help: { colour: "#a855f7", shape: "ring" },
  fatal: { colour: "#dc2626", shape: "cross" },
  forbidden: { colour: "#b91c1c", shape: "cross" },
  selected: { colour: "#0ea5e9", shape: "ring" },
  target: { colour: "#0ea5e9", shape: "dot" },
};
