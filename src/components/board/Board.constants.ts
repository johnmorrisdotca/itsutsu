import type {
  Appearance,
  BoardMarkKind,
  BoardThemeTokens,
  GridStyle,
  GuideColours,
  SquareGuide,
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
    playSquare: "rgba(74, 44, 14, 0.45)",
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
    // Lighter, like sumi: this wood is dark enough that a darker square
    // swallowed the black pieces standing on it (measured at 1.16).
    // Strong enough to hold at the LIGHT corner of the gradient too,
    // where a paler fill closed up to 1.62 and only mid-board looked fine.
    playSquare: "rgba(226, 214, 188, 0.62)",
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
    playSquare: "rgba(110, 104, 90, 0.52)",
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
    // Lighter, not darker: on ink there is no darker left to move into.
    playSquare: "rgba(150, 158, 172, 0.40)",
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
    playSquare: "rgba(35, 55, 20, 0.50)",
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

/**
 * The three views, in John's words. The traditional view draws each game the
 * way that game is drawn — the default, and what an account that never chose
 * gets. The Itsutsu view puts every game on the crossings of a go board, the
 * house style; the squares view is its mirror. `auto` is the stored key for
 * the first, kept so a choice already saved still reads.
 */
export const GRID_STYLES: Record<GridStyle, { label: string; kanji: string; hint: string }> = {
  auto: { label: "Traditional view", kanji: "伝統", hint: "Each game drawn the way it is played: gomoku and go on the lines, tic-tac-toe and Othello in the squares." },
  lines: { label: "Itsutsu view", kanji: "碁盤", hint: "Every game on the crossings, as on a go board — the house style, tic-tac-toe included." },
  cells: { label: "Squares view", kanji: "升目", hint: "Every game inside the squares, as on a chessboard — gomoku included." },
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

/**
 * The hexagon lattice, as a transform of the square grid every board here
 * is laid out on: each row slid half a cell along and the rows packed to
 * √3⁄2 of a cell, so every point has six neighbours at one distance — two
 * beside it on its row, two on its slanted column, and two along the
 * board's other diagonal. Hex's rhombus and Chinese Checkers' star both
 * stand on it, and the engine's `NEIGHBOURS` in rules/hex.ts are exactly
 * these six.
 *
 * Drawn as a lattice of LINES with the stones on the crossings, the way a
 * wooden Hex board is ruled and a go board is: three families of parallel
 * lines at 0°, 60° and 120°. Not honeycomb cells — John's decision when the
 * row was filed. The rows and the slanted columns are the ordinary rules a
 * board on the lines already gets, sheared; the third family is the one
 * BoardLines adds for the rhombus.
 *
 * `slant` takes the grid to the lattice and `unslant` is its exact inverse,
 * for what must stay round inside a cell. A grid comes out `width` times as
 * wide as it was drawn and `height` as tall.
 */
export const HEX_LATTICE = {
  slant: "skewX(30deg) scaleY(0.8660254)",
  unslant: "scaleY(1.1547005) skewX(-30deg)",
  /** Half a cell of shear per row of the grid. */
  width: 1.5,
  /** The rows packed to √3⁄2: cos 30°. */
  height: Math.sqrt(3) / 2,
} as const;

/** Where the lattice's top edge lands, as a fraction of the square box it is drawn in, once fitted to that box's width and centred. */
const LATTICE_TOP = (1 - HEX_LATTICE.height / HEX_LATTICE.width) / 2;

/**
 * The whole square box turned into the lattice: fitted to the box's width
 * and centred in its height. The lines and the stones are two boxes kept
 * exactly over each other, so both take this one string and nothing else.
 */
export const LATTICE_TRANSFORM = `translateY(${(LATTICE_TOP * 100).toFixed(4)}%) scale(${1 / HEX_LATTICE.width}) ${HEX_LATTICE.slant}`;

/**
 * The rhombus the lattice makes of a square box, cut a little wider than
 * itself so a stone on an edge is not shaved: the paper of the connection
 * game, since a rhombus is the board there rather than a square with one
 * drawn on it.
 */
export const RHOMBUS_CLIP = (() => {
  const top = LATTICE_TOP * 100;
  const bottom = 100 - top;
  const right = 100 / HEX_LATTICE.width;
  const shear = right / 2;
  return `polygon(-2% ${(top - 2.7).toFixed(2)}%, ${(right + 2).toFixed(2)}% ${(top - 2.7).toFixed(2)}%, 102% ${(bottom + 2.7).toFixed(2)}%, ${(shear - 2).toFixed(2)}% ${(bottom + 2.7).toFixed(2)}%)`;
})();

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

/**
 * THE TURN GUIDE — see turnGuide.ts.
 *
 * How few legal moves a turn has before the board marks them and dims the
 * rest. John's own number: "when there's only 1 possible move, or two". Named,
 * so that nobody has to find a 2 in a component to change it.
 */
export const FEW_LEGAL_MOVES = 2;

export const SQUARE_GUIDES = {
  choice: "choice",
  unavailable: "unavailable",
  veiled: "veiled",
} as const satisfies Record<SquareGuide, SquareGuide>;

/**
 * The guide's dashed outline and its veil, per kind of board. A deep blue
 * outline on the light woods and paper, a pale gold one on ink, dark wood and
 * tea — each well away from the surface it sits on and from both stone
 * colours. The veil pales a light board and darkens a dark one, so what is not
 * on offer recedes into its own surface rather than into a grey.
 */
export const GUIDE_COLOURS: Record<"light" | "dark", GuideColours> = {
  light: { mark: "#1e3a8a", veil: "rgba(250, 245, 235, 0.55)" },
  dark: { mark: "#fde68a", veil: "rgba(0, 0, 0, 0.45)" },
};

/** The guide in words: the rule on screen, and the choices by name for a screen reader. */
export const TURN_GUIDE_COPY = {
  capture: "You must capture.",
  mostCaptured: "You must take the most pieces.",
  onlyMoves: (count: number, listed: string) => `${count === 1 ? "Only one move" : `Only ${count} moves`}: ${listed}.`,
  piecesThatMayMove: (count: number, listed: string) =>
    `${count === 1 ? "The piece that may move" : "The pieces that may move"}: ${listed}.`,
};

/**
 * THE BOARD-SIZE MARK — a little board at the density its number means, drawn
 * by `BoardSizeMark` and nowhere else.
 *
 * Two repeating gradients rather than a picture or an SVG: no file to fetch,
 * no element per line, and the line count follows the number it is drawn from,
 * so a board size nobody has thought of yet draws itself correctly.
 */
export const BOARD_SIZE_MARK_CLASS =
  "relative inline-flex shrink-0 items-center justify-center rounded-md border border-rule-strong bg-ivory";

export const BOARD_SIZE_LATTICE =
  "linear-gradient(to right, var(--rule-strong) 1px, transparent 1px)," +
  "linear-gradient(to bottom, var(--rule-strong) 1px, transparent 1px)";

/**
 * The number, set in the middle of the lattice.
 *
 * ON A PLATE, because the number sits on the lines. A 19×19 at 48px has a
 * line every two and a half pixels, which runs straight through the strokes
 * of a digit and turns "19" into texture. The plate is the board's own ivory,
 * nearly opaque, so it reads as a patch of board left clear for the number
 * rather than a label stuck on — in both themes, since `--ivory` and `--ink`
 * swap together. The lattice still shows round it, which is what keeps a 3
 * looking coarser than a 19.
 *
 * Mono and `tabular-nums`, the way the site sets the figures it prints
 * (`Figures`, the move numbers on a stone): a 13 and a 19 take the same width,
 * so a row of them does not shimmer.
 */
export const BOARD_SIZE_NUMERAL_CLASS =
  "rounded-[0.18em] bg-ivory/90 px-[0.12em] py-[0.04em] font-mono font-semibold leading-none text-ink tabular-nums";

/**
 * The numeral's size as a share of the mark's side, for a number of up to two
 * digits: a two-digit plate comes to about two-thirds of the mark, which leaves
 * a ring of lattice round it and keeps the digits past 22px at 48px.
 *
 * 0.42 was tried first and looked at: legible, but small in a 70px board —
 * a label on the picture rather than the number being the picture.
 */
export const BOARD_SIZE_NUMERAL_SCALE = 0.46;

/** The size in words, for a mark with nothing beside it saying so. */
export const boardSizeWords = (size: number) => `${size} by ${size} board`;
