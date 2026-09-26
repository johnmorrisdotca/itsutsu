import { KUMIMOJI_GRID_MOST } from "./tiles.constants";

/**
 * A KUMIMOJI GRID: letter tiles on a table with no edges. Each tile stands on
 * a square named by its row and column, which may be any whole numbers,
 * negative too — the table grows whichever way the player builds. Pure, like
 * every rule here: nothing is changed in place.
 *
 * As a string, for an answer and a kept game, the grid is drawn from its own
 * top-left tile: its rows in order, joined by "/", each row written as runs of
 * empty squares (a number) and tiles (lower-case letters), with nothing after
 * its last tile — `cat/2o/2w` is CAT across and COW down from its C. Only
 * where the tiles stand beside one another is written, never where on the
 * table they were, so one grid has one spelling however far it was dragged.
 */
export type Tiles = ReadonlyMap<string, string>;

/** A square's name, "row,col". */
export function squareAt(row: number, col: number): string {
  return `${row},${col}`;
}

/** A square's row and column, from its name. */
export function placeOf(square: string): { row: number; col: number } {
  const [row, col] = square.split(",").map(Number);
  return { row: row!, col: col! };
}

/** The rows and columns the tiles stand within, or null for no tiles. */
export type Bounds = { top: number; left: number; bottom: number; right: number };

export function boundsOf(tiles: Tiles): Bounds | null {
  let bounds: Bounds | null = null;
  for (const square of tiles.keys()) {
    const { row, col } = placeOf(square);
    bounds =
      bounds === null
        ? { top: row, left: col, bottom: row, right: col }
        : { top: Math.min(bounds.top, row), left: Math.min(bounds.left, col), bottom: Math.max(bounds.bottom, row), right: Math.max(bounds.right, col) };
  }
  return bounds;
}

export function encodeGrid(tiles: Tiles): string {
  const bounds = boundsOf(tiles);
  if (bounds === null) return "";
  const rows: string[] = [];
  for (let row = bounds.top; row <= bounds.bottom; row += 1) {
    let line = "";
    let gap = 0;
    for (let col = bounds.left; col <= bounds.right; col += 1) {
      const letter = tiles.get(squareAt(row, col));
      if (letter === undefined) {
        gap += 1;
        continue;
      }
      line += `${gap > 0 ? gap : ""}${letter}`;
      gap = 0;
    }
    rows.push(line);
  }
  return rows.join("/");
}

/**
 * A grid read back, its first row at row 0, or null for anything that is not
 * one: a stray character, a capital, a grid wider or taller than any grid of
 * fifty tiles can be. An empty string is no tiles.
 */
export function decodeGrid(code: string): Map<string, string> | null {
  if (typeof code !== "string") return null;
  const tiles = new Map<string, string>();
  if (code === "") return tiles;
  const rows = code.split("/");
  if (rows.length > KUMIMOJI_GRID_MOST) return null;
  for (const [row, line] of rows.entries()) {
    if (!/^(\d*[a-z])*$/.test(line)) return null;
    let col = 0;
    for (const [, gap, letter] of line.matchAll(/(\d*)([a-z])/g)) {
      col += gap === "" ? 0 : Number(gap);
      if (col >= KUMIMOJI_GRID_MOST) return null;
      tiles.set(squareAt(row, col), letter!);
      col += 1;
    }
  }
  return tiles;
}

/** How many of each letter. */
export function lettersOf(letters: Iterable<string>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const letter of letters) if (letter !== "") counts.set(letter, (counts.get(letter) ?? 0) + 1);
  return counts;
}

/** Whether two tallies hold the same letters, as many of each. */
export function sameLetters(a: Map<string, number>, b: Map<string, number>): boolean {
  if (a.size !== b.size) return false;
  for (const [letter, count] of a) if (b.get(letter) !== count) return false;
  return true;
}

/** A run of two or more tiles across or down: the word it spells and the squares it stands on. */
export type Run = { word: string; squares: string[]; across: boolean };

/** Every run of two or more tiles, across then down. A tile with nothing beside it in a line is no run. */
export function runsOf(tiles: Tiles): Run[] {
  const runs: Run[] = [];
  for (const across of [true, false]) {
    for (const [square] of tiles) {
      const { row, col } = placeOf(square);
      // Only from a run's first tile: nothing before it in this line.
      const before = across ? squareAt(row, col - 1) : squareAt(row - 1, col);
      if (tiles.has(before)) continue;
      const squares: string[] = [];
      for (let step = 0; ; step += 1) {
        const at = across ? squareAt(row, col + step) : squareAt(row + step, col);
        if (!tiles.has(at)) break;
        squares.push(at);
      }
      if (squares.length >= 2) runs.push({ word: squares.map((at) => tiles.get(at)).join(""), squares, across });
    }
  }
  return runs;
}

/** The tiles in groups that touch across or down, largest first. */
export function groupsOf(tiles: Tiles): string[][] {
  const seen = new Set<string>();
  const groups: string[][] = [];
  for (const start of tiles.keys()) {
    if (seen.has(start)) continue;
    const group: string[] = [];
    const queue = [start];
    seen.add(start);
    while (queue.length > 0) {
      const at = queue.pop()!;
      group.push(at);
      const { row, col } = placeOf(at);
      for (const near of [squareAt(row - 1, col), squareAt(row + 1, col), squareAt(row, col - 1), squareAt(row, col + 1)]) {
        if (tiles.has(near) && !seen.has(near)) {
          seen.add(near);
          queue.push(near);
        }
      }
    }
    groups.push(group);
  }
  return groups.sort((a, b) => b.length - a.length);
}

/**
 * WHAT IS WRONG WITH A GRID, tile by tile, so the table can mark it: the tiles
 * in a run that is not a word, the tiles not joined to the main grid, and
 * whether the whole is sound — two tiles or more, all joined, every run a word.
 */
export type GridVerdict = {
  sound: boolean;
  tiles: number;
  /** Tiles standing in a run the list does not know. */
  misspelt: ReadonlySet<string>;
  /** Tiles in a group apart from the largest. */
  apart: ReadonlySet<string>;
  /** The runs that are not words, as spelled, for the line under the table. */
  notWords: readonly string[];
};

export function judgeGrid(tiles: Tiles, isWord: (word: string) => boolean): GridVerdict {
  const misspelt = new Set<string>();
  const notWords: string[] = [];
  for (const run of runsOf(tiles)) {
    if (isWord(run.word)) continue;
    notWords.push(run.word);
    for (const at of run.squares) misspelt.add(at);
  }
  const groups = groupsOf(tiles);
  const apart = new Set(groups.slice(1).flat());
  return { sound: tiles.size >= 2 && groups.length === 1 && notWords.length === 0, tiles: tiles.size, misspelt, apart, notWords };
}
