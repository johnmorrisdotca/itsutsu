import type { BridgeCounts, BridgesBoard, Island, Span } from "./bridges.types";

/**
 * Bridges as strings, one character a cell, row-major.
 *
 * THE GIVENS are the islands: `1` to `8` for an island wanting that many
 * bridges, `.` for water.
 *
 * AN ANSWER, and a run kept half way (`puzzleProgress.ts`), is the whole
 * drawing: every island's digit where it stands, and on every water cell what
 * crosses it — `-` one bridge across, `=` two across, `|` one down, `H` two
 * down, `.` nothing. One character a cell is also why two bridges can never
 * cross: a cell holds one of them. The check (`check.ts`) reads this without
 * the solver, and the scrubber's log (`stepLog.ts`) writes it cell by cell.
 */

export const WATER = ".";
export const ACROSS_ONE = "-";
export const ACROSS_TWO = "=";
export const DOWN_ONE = "|";
export const DOWN_TWO = "H";

/** The most bridges an island can want: two on each of its four sides. */
export const MOST_BRIDGES = 8;

/** The character a water cell holds, for a span's direction and count. */
export function bridgeChar(across: boolean, count: number): string {
  if (count === 0) return WATER;
  if (across) return count === 1 ? ACROSS_ONE : ACROSS_TWO;
  return count === 1 ? DOWN_ONE : DOWN_TWO;
}

/** The islands a code of givens holds, by cell, or null when it is not a grid of this size. */
export function decodeIslands(givens: string, size: number): Island[] | null {
  if (typeof givens !== "string" || givens.length !== size * size) return null;
  const islands: Island[] = [];
  for (let cell = 0; cell < givens.length; cell += 1) {
    const char = givens[cell]!;
    if (char === WATER) continue;
    const count = Number(char);
    if (!Number.isInteger(count) || count < 1 || count > MOST_BRIDGES) return null;
    islands.push({ cell, row: Math.floor(cell / size), col: cell % size, count });
  }
  return islands;
}

export function encodeIslands(size: number, islands: readonly Island[]): string {
  const cells = new Array<string>(size * size).fill(WATER);
  for (const island of islands) cells[island.cell] = String(island.count);
  return cells.join("");
}

/**
 * The board a puzzle's givens make: its islands, every span between two of
 * them in line with only water between, and which spans cross. Null for
 * givens that do not read, or that have no island at all.
 */
export function boardOf(givens: string, size: number): BridgesBoard | null {
  const islands = decodeIslands(givens, size);
  if (islands === null || islands.length === 0) return null;
  const islandAt = new Array<number>(size * size).fill(-1);
  islands.forEach((island, at) => (islandAt[island.cell] = at));
  const spans: Span[] = [];
  for (const [at, island] of islands.entries()) {
    // Right, then down: each span found once, from its top or left island.
    for (const across of [true, false]) {
      const cells: number[] = [];
      let row = island.row;
      let col = island.col;
      for (;;) {
        if (across) col += 1;
        else row += 1;
        if (row >= size || col >= size) break;
        const cell = row * size + col;
        const other = islandAt[cell]!;
        if (other === -1) {
          cells.push(cell);
          continue;
        }
        // Side by side is no span: there is no water to draw a bridge on.
        if (cells.length > 0) spans.push({ a: at, b: other, across, cells });
        break;
      }
    }
  }
  const spansOf: number[][] = islands.map(() => []);
  spans.forEach((span, at) => {
    spansOf[span.a]!.push(at);
    spansOf[span.b]!.push(at);
  });
  const acrossAt = new Map<number, number>();
  spans.forEach((span, at) => {
    if (span.across) for (const cell of span.cells) acrossAt.set(cell, at);
  });
  const crossing: number[][] = spans.map(() => []);
  spans.forEach((span, at) => {
    if (span.across) return;
    for (const cell of span.cells) {
      const other = acrossAt.get(cell);
      if (other === undefined) continue;
      crossing[at]!.push(other);
      crossing[other]!.push(at);
    }
  });
  return { size, islands, islandAt, spans, spansOf, crossing };
}

/** The drawing of a board with these many bridges on each span: an answer, or a run kept half way. */
export function encodeBridges(board: BridgesBoard, counts: BridgeCounts): string {
  const cells = new Array<string>(board.size * board.size).fill(WATER);
  for (const island of board.islands) cells[island.cell] = String(island.count);
  board.spans.forEach((span, at) => {
    const count = counts[at] ?? 0;
    if (count === 0) return;
    for (const cell of span.cells) cells[cell] = bridgeChar(span.across, count);
  });
  return cells.join("");
}

/**
 * How many bridges a drawing puts on each span, or null for a drawing that is
 * not one of this board's: the wrong length, an island moved, a stray
 * character, or a bridge that does not run the whole of one span.
 */
export function decodeBridges(board: BridgesBoard, code: string): number[] | null {
  const { size } = board;
  if (typeof code !== "string" || code.length !== size * size) return null;
  for (const island of board.islands) if (code[island.cell] !== String(island.count)) return null;
  const counts = board.spans.map((span) => {
    const first = code[span.cells[0]!]!;
    const count = first === bridgeChar(span.across, 1) ? 1 : first === bridgeChar(span.across, 2) ? 2 : 0;
    return span.cells.every((cell) => code[cell] === (count === 0 ? code[cell] : first)) ? count : -1;
  });
  if (counts.includes(-1)) return null;
  // Every character accounted for: the drawing the counts make must be the drawing handed in.
  return encodeBridges(board, counts) === code ? counts : null;
}

/** How many bridges an island has drawn to it. */
export function bridgesAt(board: BridgesBoard, counts: BridgeCounts, island: number): number {
  return board.spansOf[island]!.reduce((total, span) => total + (counts[span] ?? 0), 0);
}

/** The span joining two islands, or null when they are not in line with only water between. */
export function spanBetween(board: BridgesBoard, a: number, b: number): number | null {
  return board.spansOf[a]!.find((span) => (board.spans[span]!.a === b || board.spans[span]!.b === b)) ?? null;
}

/**
 * The span leaving an island one way, or null when there is none that way: how
 * a drag reads, from the island it started on and the way the finger went.
 */
export function spanToward(board: BridgesBoard, island: number, rows: -1 | 0 | 1, cols: -1 | 0 | 1): number | null {
  for (const span of board.spansOf[island]!) {
    const { a, b, across } = board.spans[span]!;
    if (across !== (rows === 0)) continue;
    const forward = rows + cols > 0;
    if ((forward && a === island) || (!forward && b === island)) return span;
  }
  return null;
}

/** The other end of a span from one of its islands. */
export function otherEnd(board: BridgesBoard, span: number, island: number): number {
  const { a, b } = board.spans[span]!;
  return a === island ? b : a;
}

/** The spans drawn across this one: a bridge may not be laid where one of them stands. */
export function crossedBy(board: BridgesBoard, counts: BridgeCounts, span: number): number[] {
  return board.crossing[span]!.filter((other) => (counts[other] ?? 0) > 0);
}
