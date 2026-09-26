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
};

/** The segment after the cells that makes a board wrap. */
export const LINK_WRAP = "wrap";

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
  // After the cells: the walls, then `wrap`, each at most once and in that order.
  let wallList: string | null = null;
  let wrap = false;
  for (const [at, segment] of tail.entries()) {
    if (segment === LINK_WRAP && at === tail.length - 1) wrap = true;
    else if (at === 0 && segment !== LINK_WRAP) wallList = segment;
    else return null;
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
  // A waypoint names a pair the board has.
  if ([...marked.values()].some((pair) => pair >= seen.length)) return null;
  const walls = wallList === null ? new Set<string>() : readWalls(wallList, size);
  if (walls === null) return null;
  // A bridge away from the edge, beside no other bridge, and with no wall on any of its four sides.
  for (let at = 0; at < cells.length; at += 1) {
    if (cells[at] !== CELL_BRIDGE) continue;
    const row = Math.floor(at / size);
    const col = at % size;
    if (row === 0 || col === 0 || row === size - 1 || col === size - 1) return null;
    for (const beside of neighboursOf(size, at)) if (cells[beside] === CELL_BRIDGE || walls.has(edgeKey(at, beside))) return null;
  }
  return { size, cells, ends: seen.map((stones) => [stones[0]!, stones[1]!]), walls, waypoints: marked, wrap };
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

/** A layout's code, from its cells, walls, waypoints and whether it wraps: the inverse of `decodeLayout`. */
export function encodeLayout(cells: readonly number[], walls: Iterable<string> = [], more: { waypoints?: ReadonlyMap<number, number>; wrap?: boolean } = {}): string {
  const grid = cells
    .map((cell, at) => {
      const waypoint = more.waypoints?.get(at);
      if (waypoint !== undefined) return PAIR_LETTERS[waypoint]!.toLowerCase();
      return cell === CELL_EMPTY ? LINK_EMPTY : cell === CELL_BLOCKED ? LINK_BLOCKED : cell === CELL_BRIDGE ? LINK_BRIDGE : PAIR_LETTERS[cell]!;
    })
    .join("");
  return grid + encodeWalls(walls) + (more.wrap === true ? `${LINK_WALLS}${LINK_WRAP}` : "");
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
 * right edge is +1, though the cells' numbers differ by size - 1.
 */
export function stepBetween(size: number, a: number, b: number, wrap: boolean): number {
  for (const by of [1, -1, size, -size]) {
    const plain = a + by;
    const same = Math.abs(by) === size || Math.floor(plain / size) === Math.floor(a / size);
    if (plain === b && same && plain >= 0 && plain < size * size) return by;
    if (wrap && wrappedStep(size, a, by) === b) return by;
  }
  return 0;
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

/** Every cell's neighbours, worked out once for a size. */
export function neighbourTable(size: number): number[][] {
  return Array.from({ length: size * size }, (_, at) => neighboursOf(size, at));
}
