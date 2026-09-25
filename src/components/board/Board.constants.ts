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
 * THE FELT A REVERSI BOARD IS COVERED IN. John, 2026-09-25: "All Reversi
 * boards: Introduce a beautiful colour patch row, where you can choose from all
 * the known variant colours of green, blue, red". A Reversi board is not wood:
 * it is a flat of cloth ruled in black, green on the classic set and the
 * tournament table, and blue, red and black on the others. Drawn only for a
 * flipping game in the squares (`wearsFelt`); `wood` in `Appearance.felt` puts
 * such a game back on the reader's own board surface.
 *
 * Every one is dark and ruled in black. A board in the squares prints its
 * letters and numbers outside the frame, on the page, so their ink is a mid
 * tone of the cloth that reads on paper, not the pale ink a wood board's
 * inside labels would need.
 */
export const FELTS = {
  green: {
    label: "Green",
    kanji: "緑",
    surface: "radial-gradient(130% 100% at 20% 0%, #2f9a5a 0%, #1f7f45 55%, #16663a 100%)",
    frame: "#0c3d22",
    playSquare: "rgba(0, 0, 0, 0.18)",
    line: "#0b2a18",
    star: "#0b2a18",
    coordinate: "#2f6b45",
    winning: "#ffd23f",
    dark: true,
  },
  blue: {
    label: "Blue",
    kanji: "青",
    surface: "radial-gradient(130% 100% at 20% 0%, #3a7fc4 0%, #2865a6 55%, #1d4f86 100%)",
    frame: "#0f2c4d",
    playSquare: "rgba(0, 0, 0, 0.18)",
    line: "#0c2139",
    star: "#0c2139",
    coordinate: "#2d5a8a",
    winning: "#ffd23f",
    dark: true,
  },
  red: {
    label: "Red",
    kanji: "赤",
    surface: "radial-gradient(130% 100% at 20% 0%, #c0473f 0%, #a3342e 55%, #862722 100%)",
    frame: "#4a1210",
    playSquare: "rgba(0, 0, 0, 0.18)",
    line: "#360c0a",
    star: "#360c0a",
    coordinate: "#8a3a33",
    winning: "#ffd23f",
    dark: true,
  },
  black: {
    label: "Black",
    kanji: "黒",
    surface: "radial-gradient(130% 100% at 20% 0%, #3a3d42 0%, #2a2c30 55%, #1d1f22 100%)",
    frame: "#0b0c0e",
    playSquare: "rgba(255, 255, 255, 0.10)",
    line: "#6d737c",
    star: "#8a909a",
    coordinate: "#565b63",
    winning: "#ffb020",
    dark: true,
  },
} as const satisfies Record<string, BoardThemeTokens>;

/** The felts in the order the patches show them, and `wood` last: the reader's own board. */
export const FELT_LIST = ["green", "blue", "red", "black", "wood"] as const;

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
  auto: { label: "Traditional view", kanji: "伝統", hint: "Each game drawn the way it is played: gomoku and go on the lines, tic-tac-toe and Reversi in the squares." },
  lines: { label: "Itsutsu view", kanji: "碁盤", hint: "Every game on the crossings, as on a go board — the house style, tic-tac-toe included." },
  cells: { label: "Squares view", kanji: "升目", hint: "Every game inside the squares, as on a chessboard — gomoku included." },
};

export const DEFAULT_APPEARANCE: Appearance = {
  boardTheme: "kaya",
  stoneSet: "classic",
  showCoordinates: true,
  showMoveNumbers: false,
  grid: "auto",
  // A Reversi board is green felt until the reader chooses otherwise.
  felt: "green",
  // Not "do not turn it round": nobody has said, so the seat decides.
  flipped: null,
};

/**
 * The size every board's coordinates are drawn at, and the ceiling the lattice
 * boards cap it with.
 *
 * 0.65rem is the size the square boards' strips have always used, and John
 * asked for the lattice boards to match it so the labels stay subtle. The
 * ceiling is for the one board where that size does not fit: Hex at 19 puts
 * its rows 8.8px apart on a phone-sized board, and a 0.65rem label is 10.4px
 * tall. `COORDINATE_FIT` is the share of a row a label may take, under one so
 * two rows have air between them rather than merely not overlapping.
 */
export const COORDINATE_REM = 0.65;
export const COORDINATE_FIT = 0.88;

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

/** The board the rim is measured from: a 19×19 go board, drawn on its lines. */
const GO_SIDE = 19;

/**
 * How much surface a 19×19 go board shows outside its outermost line, as a
 * fraction of the board's width — the proportion every other board is matched
 * to rather than a value anybody chose.
 *
 * The line's CENTRE is half a cell in from the edge and the line is
 * `EDGE_LINE_WIDTH` cells thick, so half that thickness stands in the margin
 * and only the rest of it is bare.
 */
export const GO_BOARD_RIM = (0.5 - EDGE_LINE_WIDTH / 2) / GO_SIDE;

/**
 * THE LATTICE FITTED TO THE BOX BY THE SHAPE THAT IS ACTUALLY PLAYED ON.
 *
 * A square grid sheared into the lattice comes out `HEX_LATTICE.width` wide,
 * and for the connection game that whole width IS the board — a rhombus, every
 * cell of it in play. A HEXAGON is not: it is the middle two thirds of that
 * rhombus, with the four corners of the square array sealed off and hidden.
 * Fitting the rhombus to the box therefore left a hexagon filling two thirds
 * of the width and four sevenths of the height, floating in its own frame —
 * John, 2026-09-21, looking at the thirteen board: "Why is there such a border
 * around 13x13? If that's the largest, it shoud fill the page".
 *
 * So the fit is given the shape's own span rather than the array's. `from` and
 * `to` are where that shape starts and ends across the sheared grid, in units
 * of the unsheared grid's width, and everything else follows: the scale is
 * what makes that span the box's width, and the offsets put it there and
 * centre what is left over.
 *
 * Percentages in `translate` are of the element's own box, which is the square
 * both the lines and the stones fill — so one string moves both, and they
 * cannot come apart.
 */
/** Where a shape sits on the sheared grid: across it in units of the unsheared width, and down it in rows of the array. */
export type LatticeSpan = {
  from: number;
  to: number;
  /** The first and last row the shape occupies, as fractions of the array's rows: 0 and 1 for a shape using all of them. */
  rowFrom: number;
  rowTo: number;
};

/** A fit, in numbers: how much the lattice is scaled, and where its origin lands in the box. All fractions of the box. */
export type LatticeFit = {
  scale: number;
  left: number;
  top: number;
  transform: string;
};

export function latticeFit(span: LatticeSpan, rim = 0): LatticeFit {
  const room = 1 - 2 * rim;
  const wide = span.to - span.from;
  const tall = HEX_LATTICE.height * (span.rowTo - span.rowFrom);
  /*
   * WHICHEVER WAY ROUND THE SHAPE IS. The rhombus and the hexagon are wider
   * than they are tall; the hexagram is not — Chinese Checkers' star is 0.76
   * wide against 0.87 tall, and a width fit would scale it until it stood a
   * tenth of a board proud of its own box, top and bottom, and be clipped
   * there. The binding side is the bigger share of the box, which is what
   * `max` says.
   */
  const scale = room / Math.max(wide, tall);
  /*
   * The shape centred in what the rim leaves, on both axes. Identical to a
   * width fit for a shape the width binds — there is nothing left over to
   * share — and it is what centres a shape the height binds.
   */
  const left = rim + (room - wide * scale) / 2 - span.from * scale;
  const top = rim + (room - tall * scale) / 2 - span.rowFrom * HEX_LATTICE.height * scale;
  return {
    scale,
    left,
    top,
    transform: `translate(${(left * 100).toFixed(4)}%, ${(top * 100).toFixed(4)}%) scale(${scale}) ${HEX_LATTICE.slant}`,
  };
}

/** Where the lattice's top edge lands, as a fraction of the square box it is drawn in, once fitted to that box's width and centred. */
const LATTICE_TOP = (1 - HEX_LATTICE.height / HEX_LATTICE.width) / 2;

/**
 * WHERE HEX'S BOARD SITS: the rhombus AND the ring of border tiles round it.
 *
 * John, 2026-09-22, on the black and white edges that were drawn as bands
 * along the rhombus: "I have a better idea than drawing those lines. You
 * would actually just fill out an entire row of hexagons, dark or light and
 * that would simulate the same thing and actually eliminate those issues."
 * So the border is one more row of tiles above and below (dark) and one more
 * column either side (light), in the same tiles as the board, and the fit
 * has to make room for them: the span is the array plus one cell each way.
 *
 * Computed from the size rather than quoted, since the extra cell is a
 * different fraction of every board. Across: a cell at column c of row r has
 * its left edge at (c + 0.25 + 0.5r)/N — see `HEXAGON_SPAN` — so the ring's
 * leftmost is column −1 of row −1 and its rightmost the far edge of column N
 * of row N. Down: rows −1 to N+1.
 */
export function rhombusSpan(size: number): LatticeSpan {
  return {
    from: (-1 + 0.25 - 0.5) / size,
    to: (size + 1 + 0.25 + 0.5 * size) / size,
    rowFrom: -1 / size,
    rowTo: (size + 1) / size,
  };
}

/** Hex's board fitted to its box, ring and all, with the same rim as every other board. */
export function rhombusFit(size: number): LatticeFit {
  return latticeFit(rhombusSpan(size), GO_BOARD_RIM);
}

/**
 * Where a hexagon sits across the sheared grid, in units of the unsheared
 * grid's width — and it is the same two numbers at every radius.
 *
 * A hexagon of radius R fills a (2R+1) array. Its leftmost cells are the row
 * through the centre, whose left edge lands at (0.5R + 0.25) cells, and its
 * rightmost are the same row's right edge at (2.5R + 1.25); divided by the
 * 2R + 1 cells of the array those are exactly a quarter and a quarter past
 * one, whatever R is. So one constant covers every board the game is played
 * on, and a fifth board would need no arithmetic here.
 */
export const HEXAGON_SPAN = { from: 0.25, to: 1.25 } as const;

/**
 * A HEXAGON KEEPS THE SAME RIM AS A BOARD DRAWN IN THE SQUARES, because that
 * is what it is: a cell of a honeycomb is filled edge to edge, unlike a board
 * on the lines, whose stones sit on crossings and leave their own half-cell of
 * air at the edge (`playingAreaInset` answers zero for exactly that reason).
 * Without it the widest row's two points touch the wood.
 */
const HEXAGON_RIM = GO_BOARD_RIM;

/** The same lattice, fitted to the hexagon rather than to the array holding it. */
/**
 * The hexagon fitted with its ring of border tiles, which carry its
 * coordinates (see `LatticeBorder`). The ring is one cell beyond the shape
 * on every side, and one cell is a different share of every board, so this
 * is a function of the size where `HEXAGON_SPAN` alone was two constants.
 */
export function hexagonFit(size: number): LatticeFit {
  const ring = 1 / size;
  return latticeFit(
    { from: HEXAGON_SPAN.from - ring, to: HEXAGON_SPAN.to + ring, rowFrom: -ring, rowTo: 1 + ring },
    HEXAGON_RIM,
  );
}

/** The eleven board's, for the tests that pin the fit's numbers. */
export const HEXAGON_TRANSFORM = hexagonFit(11).transform;

/**
 * WHERE THE HEXAGRAM SITS ACROSS THE SHEARED GRID — Chinese Checkers' star,
 * computed from the radius rather than quoted, because unlike the hexagon's
 * these two numbers MOVE with the board.
 *
 * A star of radius R fills a (4R+1) array, and its two extremes are in
 * different rows — which is the whole difficulty of this shape. The leftmost
 * cell is the left point's tip, column 0 of row 3R; the rightmost is the right
 * point's tip, the last column of row R. Taken at each cell's own middle, as
 * `HEXAGON_SPAN` explains, that is (1.5R + 0.25) cells in and (0.5R + 0.25)
 * cells past the array's right edge.
 *
 * For the 121-hole board it comes to 0.368 and 1.132: a shape 0.76 wide in a
 * grid 1.5 wide, which is why it was drawn at half size in an empty board
 * before anything was fitted to it.
 */
export function starSpan(size: number): { from: number; to: number } {
  const radius = (size - 1) / 4;
  return { from: (1.5 * radius + 0.25) / size, to: 1 + (0.5 * radius + 0.25) / size };
}

/**
 * The star fitted to its own span. It is a FUNCTION and not a constant, since
 * the span depends on the board — and a board of another size is exactly what
 * a constant here would quietly draw wrong.
 *
 * It keeps the same rim as the hexagon and the go board: the points of a star
 * are single cells, and a point touching the wood reads as a shape that has
 * been cut off rather than one that ends.
 */
export function starFit(size: number): LatticeFit {
  const { from, to } = starSpan(size);
  // With its ring of border tiles, one cell beyond the star on every side, for the coordinates.
  const ring = 1 / size;
  return latticeFit({ from: from - ring, to: to + ring, rowFrom: -ring, rowTo: 1 + ring }, GO_BOARD_RIM);
}

export function starTransform(size: number): string {
  return starFit(size).transform;
}



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

/** The wooden frame round a board: a box-shadow outside the box, so the grid reserves this much beside and below it. */
export const BOARD_FRAME = "0.4rem";

/**
 * How far a coordinate strip stands off the board.
 *
 * The frame is a box-shadow SPREAD, so it is drawn OUTSIDE the board's box and
 * the strips sit in the space it spreads into. A strip padded by its own few
 * pixels therefore had none of them left: the labels came right up against the
 * wood, and on the thirteen board they touched it. John, 2026-09-22: "All
 * boards with the A/1 numbers on the side need 1 or 2 pixels of
 * margin/padding between the numbers as they can be touching."
 *
 * So the gap has to clear the frame FIRST and then leave the space. Written as
 * the frame's own width plus the gap, rather than as one number somebody has
 * added up, because the two move for different reasons.
 *
 * One pixel, not two: at two the letters along the top read as floating away
 * from the board. John, 2026-09-22: "regarding the top labels, they are too
 * far away and can come down a pixel or two."
 */
export const COORDINATE_GAP = `calc(${BOARD_FRAME} + 1px)`;

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

/** Which shape is cut out of the sheared array — the one word the fit, the tiles and the strips all read. */
export type LatticeShape = "rhombus" | "hexagon" | "star";

/** The fit a board on the lattice takes, by its shape and size. */
export function latticeFitFor(shape: LatticeShape, size: number): LatticeFit {
  if (shape === "hexagon") return hexagonFit(size);
  if (shape === "star") return starFit(size);
  return rhombusFit(size);
}
