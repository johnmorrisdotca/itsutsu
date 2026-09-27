/**
 * TSUNAGI, WRITTEN DOWN: a level's layout and a finished grid, as the
 * strings every puzzle travels as (`puzzleCode.ts` is the spelling of the
 * number grids; this is the spelling of this one).
 *
 * A LAYOUT is row-major, one character a cell: `.` for an empty cell, a
 * capital letter for a stone — each letter exactly twice, the two ends of one
 * line — `#` for a blocked cell no line may enter, and `+` for a BRIDGE: a cell
 * two different lines cross, one straight across and one straight down, neither
 * turning on it (John, 2026-09-26; Flow Free's bridges). The letters are named
 * in the order their first stone is met reading left to right, top to bottom,
 * so one layout has one spelling.
 *
 * WALLS come after the cells, behind a `|`: the edges between two neighbouring
 * cells no line may cross, each as its two cells `a-b` (a before b), in order,
 * comma-separated — `A..A|1-2,5-9`. A layout with no walls has no `|`, so every
 * layout written before walls existed is still the same string, and the same
 * board (solves are kept by it).
 *
 * A bridge sits away from the edge, never beside another bridge, and no wall
 * touches it: it always has its four ways across.
 *
 * A WAYPOINT is a pair's letter in lower case on an empty cell: a ring of that
 * colour its line must pass through (John, 2026-09-26). WRAP comes last, as the
 * segment `wrap` after the walls (or after the cells where there are none): the
 * left and right edges join, and so do the top and bottom, so a line leaving
 * one side comes back in on the other, as the wrapping gomoku does.
 *
 * A HEXAGON (`hex`, first of the words after the walls) is Hexversi's
 * honeycomb: an odd square of side 2R + 1 with every row slid half a cell
 * along, so each cell has six neighbours — the four around it and the two
 * diagonals along the slant, up-right and down-left (`rules/hexagon.ts`). The
 * cells outside the hexagon of radius R are `#`, off the board, and a
 * hexagon has no walls, bridges or wrap.
 *
 * `sparse` says the board has few, long lines — at most `sparseMost` — and is
 * refused on a board with more; `strokes<N>` (last of all) gives the player N
 * strokes to solve it in, every lift that changed the board spending one.
 *
 * AN ANSWER is the grid of cells with every open cell carrying the letter of
 * the line through it, `#` where the layout has one, and `+` on a bridge: the
 * two lines over it are the ones either side of it.
 *
 * Imports carry their `.ts` so the level script (`scripts/tsunagi-levels.ts`)
 * can run this under plain node.
 */

export const LINK_EMPTY = ".";
export const LINK_BLOCKED = "#";
export const LINK_BRIDGE = "+";
/** Where the walls start, after the cells. */
export const LINK_WALLS = "|";

/** The letters a pair may be named by, in order: sixteen, more than any level uses. */
export const PAIR_LETTERS = "ABCDEFGHIJKLMNOP";

/** A cell in a decoded layout: an empty cell, a blocked one, or a stone of pair `n` (0 for A). */
export const CELL_EMPTY = -1;
export const CELL_BLOCKED = -2;
export const CELL_BRIDGE = -3;

export type LinkLayout = {
  size: number;
  /** One per cell: `CELL_EMPTY` (a waypoint too), `CELL_BLOCKED`, `CELL_BRIDGE`, or the pair a stone belongs to. */
  cells: number[];
  /** Each pair's two stones, as cell indexes, the first met in reading order first. */
  ends: [number, number][];
  /** The edges no line may cross, each as `edgeKey(a, b)`. Empty for a board with none. */
  walls: ReadonlySet<string>;
  /** Empty cells only one pair's line may use, and must: the waypoint's cell to its pair. */
  waypoints: ReadonlyMap<number, number>;
  /** Whether the edges join: left to right and top to bottom. */
  wrap: boolean;
  /** Whether the board is a hexagon of hexagons: six neighbours a cell, the square's corners off the board. */
  hex: boolean;
  /** Whether the board is sparse: few, long lines, at most `sparseMost` of them. */
  sparse: boolean;
  /** How many strokes the player has to solve it in, or null for no limit. */
  strokes: number | null;
  /** Explosions: every `every` strokes a drawn line is broken — cut back by half, or, with `blast`, wiped with a neighbour cut too. Null for none. */
  explosions: { every: number; blast: boolean } | null;
};

/**
 * The words that may follow the cells (and walls), each at most once and in
 * this order, so one board has one spelling: `wrap`, then an explosion —
 * `boom<N>` (a line cut back every N strokes) or `blast<N>` (a line wiped and
 * its neighbour cut).
 */
const TAIL_ORDER = ["hex", "sparse", "wrap", "explosion", "strokes"] as const;

/** Which of the tail's words a segment is, and what it says; null for none of them (the walls list). */
export function tailWord(segment: string): { word: (typeof TAIL_ORDER)[number]; every?: number; blast?: boolean } | null {
  if (segment === LINK_WRAP) return { word: "wrap" };
  if (segment === LINK_HEX) return { word: "hex" };
  if (segment === LINK_SPARSE) return { word: "sparse" };
  const limit = /^strokes([1-9][0-9]?)$/.exec(segment);
  if (limit !== null) return { word: "strokes", every: Number(limit[1]) };
  const boom = /^(boom|blast)([1-9][0-9]?)$/.exec(segment);
  if (boom !== null) return { word: "explosion", every: Number(boom[2]), blast: boom[1] === "blast" };
  return null;
}

/** The segment after the cells that makes a board wrap. */
export const LINK_WRAP = "wrap";

/** The segment after the cells that makes a board a hexagon of hexagons. */
export const LINK_HEX = "hex";

/** The segment after the cells that says a board has few, long lines. */
export const LINK_SPARSE = "sparse";

/** The most lines a sparse board of this side has: two thirds of the side — six on a 9×9, where nine is usual. */
export function sparseMost(size: number): number {
  return Math.floor((2 * size) / 3);
}

/** The hexagon's radius on a board of this side: R, for a side of 2R + 1. */
export function hexRadius(size: number): number {
  return Math.floor(size / 2);
}

/** Whether a cell of the square is inside the hexagon: at most R lattice steps from the middle. */
export function inHex(size: number, at: number): boolean {
  const radius = hexRadius(size);
  const x = (at % size) - radius;
  const z = Math.floor(at / size) - radius;
  return Math.max(Math.abs(x), Math.abs(z), Math.abs(x + z)) <= radius;
}

/** An edge between two neighbouring cells, the same whichever way round they are named. */
export function edgeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/**
 * A layout read from its code, or null for a string that is not one: the
 * wrong length, a stray character, a letter used other than twice, or letters
 * not named in reading order. Null rather than a best guess — see AGENTS.md
 * "Nothing Answers What It Cannot Answer".
 */
export function decodeLayout(code: string, size: number): LinkLayout | null {
  if (typeof code !== "string") return null;
  const [grid, ...tail] = code.split(LINK_WALLS);
  if (grid === undefined || grid.length !== size * size) return null;
  // After the cells: the walls, then the tail's words (`TAIL_ORDER`), each at most once and in that order.
  let wallList: string | null = null;
  let wrap = false;
  let explosions: LinkLayout["explosions"] = null;
  let hex = false;
  let sparse = false;
  let strokes: number | null = null;
  let rank = -1;
  for (const [at, segment] of tail.entries()) {
    const word = tailWord(segment);
    if (word === null) {
      if (at !== 0) return null;
      wallList = segment;
      continue;
    }
    const place = TAIL_ORDER.indexOf(word.word);
    if (place <= rank) return null;
    rank = place;
    if (word.word === "wrap") wrap = true;
    else if (word.word === "hex") hex = true;
    else if (word.word === "sparse") sparse = true;
    else if (word.word === "strokes") strokes = word.every!;
    else explosions = { every: word.every!, blast: word.blast! };
  }
  const cells: number[] = [];
  const seen: number[][] = [];
  const marked = new Map<number, number>();
  let next = 0;
  for (let at = 0; at < grid.length; at += 1) {
    const char = grid[at]!;
    if (char === LINK_EMPTY) cells.push(CELL_EMPTY);
    else if (char === LINK_BLOCKED) cells.push(CELL_BLOCKED);
    else if (char === LINK_BRIDGE) cells.push(CELL_BRIDGE);
    else if (PAIR_LETTERS.toLowerCase().includes(char)) {
      // A waypoint: an empty cell kept for the pair its letter names.
      cells.push(CELL_EMPTY);
      marked.set(at, PAIR_LETTERS.toLowerCase().indexOf(char));
    } else {
      const pair = PAIR_LETTERS.indexOf(char);
      if (pair === -1) return null;
      if (seen[pair] === undefined) {
        // A new letter must be the next one: A, then B, then C, in reading order.
        if (pair !== next) return null;
        next += 1;
        seen[pair] = [];
      }
      seen[pair]!.push(at);
      cells.push(pair);
    }
  }
  if (seen.length === 0 || seen.some((stones) => stones.length !== 2)) return null;
  // Sparse is a claim about the board, and a board with more lines than that is not one.
  if (sparse && seen.length > sparseMost(size)) return null;
  // A limit of fewer strokes than lines could never be met.
  if (strokes !== null && strokes < seen.length) return null;
  // A waypoint names a pair the board has.
  if ([...marked.values()].some((pair) => pair >= seen.length)) return null;
  const walls = wallList === null ? new Set<string>() : readWalls(wallList, size);
  if (walls === null) return null;
  // A hexagon: an odd side, `#` exactly outside it, and none of the square's twists.
  if (hex) {
    if (size % 2 === 0 || size < 5 || wrap || walls.size > 0 || cells.includes(CELL_BRIDGE)) return null;
    for (let at = 0; at < cells.length; at += 1) if (!inHex(size, at) && cells[at] !== CELL_BLOCKED) return null;
  }
  // A bridge away from the edge, beside no other bridge, and with no wall on any of its four sides.
  for (let at = 0; at < cells.length; at += 1) {
    if (cells[at] !== CELL_BRIDGE) continue;
    const row = Math.floor(at / size);
    const col = at % size;
    if (row === 0 || col === 0 || row === size - 1 || col === size - 1) return null;
    for (const beside of neighboursOf(size, at)) if (cells[beside] === CELL_BRIDGE || walls.has(edgeKey(at, beside))) return null;
  }
  return { size, cells, ends: seen.map((stones) => [stones[0]!, stones[1]!]), walls, waypoints: marked, wrap, hex, sparse, strokes, explosions };
}

/** The walls after a layout's `|`, or null for a list that is not one: an edge that is not two neighbouring cells, out of order, or twice. */
function readWalls(list: string, size: number): Set<string> | null {
  const walls = new Set<string>();
  if (list === "") return null;
  let last = "";
  for (const each of list.split(",")) {
    const match = /^(\d+)-(\d+)$/.exec(each);
    if (match === null) return null;
    const a = Number(match[1]);
    const b = Number(match[2]);
    if (a >= b || b >= size * size || !neighboursOf(size, a).includes(b)) return null;
    const key = edgeKey(a, b);
    if (walls.has(key) || (last !== "" && compareEdges(last, key) >= 0)) return null;
    walls.add(key);
    last = key;
  }
  return walls;
}

/** Edges in the one order a layout writes them: by their first cell, then their second. */
export function compareEdges(x: string, y: string): number {
  const [xa, xb] = x.split("-").map(Number) as [number, number];
  const [ya, yb] = y.split("-").map(Number) as [number, number];
  return xa - ya || xb - yb;
}

/** The walls as a layout writes them, after the cells: nothing where there are none. */
export function encodeWalls(walls: Iterable<string>): string {
  const list = [...walls].sort(compareEdges);
  return list.length === 0 ? "" : `${LINK_WALLS}${list.join(",")}`;
}

/** What a pair past `PAIR_LETTERS` is written as: a character no layout reads. */
const NO_LETTER = "?";

/** A layout's code, from its cells, walls, waypoints and whether it wraps: the inverse of `decodeLayout`. */
export function encodeLayout(cells: readonly number[], walls: Iterable<string> = [], more: { waypoints?: ReadonlyMap<number, number>; wrap?: boolean; hex?: boolean; sparse?: boolean; strokes?: number | null; explosions?: LinkLayout["explosions"] } = {}): string {
  // A pair past the last letter has no spelling: it is written `?`, which no layout reads, so a filling of too many lines is refused rather than thrown on.
  const grid = cells
    .map((cell, at) => {
      const waypoint = more.waypoints?.get(at);
      if (waypoint !== undefined) return PAIR_LETTERS[waypoint]?.toLowerCase() ?? NO_LETTER;
      return cell === CELL_EMPTY ? LINK_EMPTY : cell === CELL_BLOCKED ? LINK_BLOCKED : cell === CELL_BRIDGE ? LINK_BRIDGE : (PAIR_LETTERS[cell] ?? NO_LETTER);
    })
    .join("");
  const boom = more.explosions == null ? "" : `${LINK_WALLS}${more.explosions.blast ? "blast" : "boom"}${more.explosions.every}`;
  const words = [more.hex === true ? LINK_HEX : "", more.sparse === true ? LINK_SPARSE : "", more.wrap === true ? LINK_WRAP : ""].filter(Boolean).map((word) => `${LINK_WALLS}${word}`).join("");
  const limit = more.strokes == null ? "" : `${LINK_WALLS}strokes${more.strokes}`;
  return grid + encodeWalls(walls) + words + boom + limit;
}

/** A finished grid's code: the letter of the line through each cell, `#` where blocked, `+` on a bridge. */
export function encodeAnswer(owners: readonly number[]): string {
  return owners.map((owner) => (owner === CELL_BLOCKED ? LINK_BLOCKED : owner === CELL_BRIDGE ? LINK_BRIDGE : owner < 0 ? LINK_EMPTY : PAIR_LETTERS[owner]!)).join("");
}

/** A layout's cells without its walls or wrap: the part of the code one character a cell. */
export function layoutCells(code: string): string {
  const bar = code.indexOf(LINK_WALLS);
  return bar === -1 ? code : code.slice(0, bar);
}

/** The cell beside `at` one step `by` (-1, +1, -size, +size) on a board that wraps: off one edge and in at the other. */
export function wrappedStep(size: number, at: number, by: number): number {
  const row = Math.floor(at / size);
  const col = at % size;
  if (by === 1) return row * size + ((col + 1) % size);
  if (by === -1) return row * size + ((col + size - 1) % size);
  if (by === size) return ((row + 1) % size) * size + col;
  return ((row + size - 1) % size) * size + col;
}

/**
 * The way from `a` to its neighbour `b` as a step (-1, +1, -size, +size),
 * counting a step across a wrapped edge as the step it is — right off the
 * right edge is +1, though the cells' numbers differ by size - 1. On a
 * hexagon, the two slanting steps too: up-right (1 - size) and down-left
 * (size - 1). Zero for cells that are not neighbours.
 */
export function stepBetween(size: number, a: number, b: number, wrap: boolean, hex = false): number {
  if (hex) return hexNeighboursOf(size, a).includes(b) ? b - a : 0;
  for (const by of [1, -1, size, -size]) {
    const plain = a + by;
    const same = Math.abs(by) === size || Math.floor(plain / size) === Math.floor(a / size);
    if (plain === b && same && plain >= 0 && plain < size * size) return by;
    if (wrap && wrappedStep(size, a, by) === b) return by;
  }
  return 0;
}

/** A layout's step from `a` to its neighbour `b` (`stepBetween` on its own kind of board), or 0. */
export function layoutStep(layout: LinkLayout, a: number, b: number): number {
  return stepBetween(layout.size, a, b, layout.wrap, layout.hex);
}

/** Whether a line may step from cell `a` to its neighbour `b`: no wall between them. */
export function edgeOpen(layout: LinkLayout, a: number, b: number): boolean {
  return !layout.walls.has(edgeKey(a, b));
}

/**
 * Each cell's neighbours a line may step to on this board: the four around it,
 * less any across a wall. A bridge is a neighbour like any cell; what a line
 * does on one (go straight over) is the caller's to know.
 */
export function layoutNeighbours(layout: LinkLayout): number[][] {
  const { size } = layout;
  // On a board that wraps, every cell has four neighbours, the edges' ones across the join.
  if (layout.hex) return hexNeighbourTable(size);
  const table = layout.wrap ? Array.from({ length: size * size }, (_, at) => [...new Set([-size, 1, size, -1].map((by) => wrappedStep(size, at, by)))].filter((next) => next !== at)) : neighbourTable(size);
  return layout.walls.size === 0 ? table : table.map((around, at) => around.filter((next) => edgeOpen(layout, at, next)));
}

/** The four neighbours of a cell on a square grid, as indexes; fewer at an edge. */
export function neighboursOf(size: number, at: number): number[] {
  const row = Math.floor(at / size);
  const col = at % size;
  const out: number[] = [];
  if (row > 0) out.push(at - size);
  if (col < size - 1) out.push(at + 1);
  if (row < size - 1) out.push(at + size);
  if (col > 0) out.push(at - 1);
  return out;
}

/** The six neighbours of a cell on the hexagon lattice, as indexes; fewer at an edge of the square (the hexagon's own edge is its `#` cells). */
export function hexNeighboursOf(size: number, at: number): number[] {
  const row = Math.floor(at / size);
  const col = at % size;
  const out: number[] = [];
  if (row > 0) out.push(at - size);
  if (row > 0 && col < size - 1) out.push(at - size + 1);
  if (col < size - 1) out.push(at + 1);
  if (row < size - 1) out.push(at + size);
  if (row < size - 1 && col > 0) out.push(at + size - 1);
  if (col > 0) out.push(at - 1);
  return out;
}

/** Every cell's six neighbours on the hexagon lattice, worked out once for a size. */
export function hexNeighbourTable(size: number): number[][] {
  return Array.from({ length: size * size }, (_, at) => hexNeighboursOf(size, at));
}

/** Every cell's neighbours, worked out once for a size. */
export function neighbourTable(size: number): number[][] {
  return Array.from({ length: size * size }, (_, at) => neighboursOf(size, at));
}
