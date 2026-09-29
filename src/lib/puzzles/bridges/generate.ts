import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { seededRandom, type Random } from "../random";
import type { Island } from "./bridges.types";
import { boardOf, encodeBridges, encodeIslands } from "./code";
import { levelOf, solutionOf } from "./solve";

/**
 * Making a Bridges puzzle, in the browser, from a seed.
 *
 * An answer first: islands grown one from another across the grid, each new
 * one at the far end of a straight run of water from an island already there,
 * with one or two bridges along the run; then a few more bridges between
 * islands that happen to be in line. Each island's number is the bridges that
 * answer gives it. The solver then asks whether those numbers have that answer
 * and no other, and how a person would get there (`levelOf`); a layout that is
 * not a puzzle at the level asked is dropped and the next one grown from the
 * same stream, so one seed always makes one puzzle.
 *
 * Measured 2026-09-28 over a thousand layouts a size: a layout takes about a
 * tenth of a millisecond to grow and judge at 7×7 and a quarter at 13×13; about
 * one in two is a puzzle at 7×7 and one in ten at 13×13; and about one in
 * ninety needs a trial (hard) at 7×7, one in fifty-five at 13×13. So a hard
 * 13×13 is a few dozen layouts, milliseconds, and `MOST_LAYOUTS` is far past
 * what any seed needs.
 *
 * No two islands are ever side by side, as in every printed puzzle: a bridge
 * needs water to stand on, and the drawing (`code.ts`) has nowhere to put one.
 */

/** How much of the grid is island, by side: about a fifth, as printed puzzles run. */
const ISLAND_SHARE = 0.2;

/** How many layouts to grow before settling for the nearest level, so a seed can never run on. */
const MOST_LAYOUTS = 3000;

export function generateBridges(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const random = seededRandom(seed);
  let fallback: { givens: string; solution: string } | null = null;
  for (let attempt = 0; attempt < MOST_LAYOUTS; attempt += 1) {
    const islands = growLayout(size, random);
    if (islands === null) continue;
    const givens = encodeIslands(size, islands);
    const board = boardOf(givens, size)!;
    const found = levelOf(board);
    if (found === null) continue;
    const made = { givens, solution: encodeBridges(board, solutionOf(board)!) };
    if (found === level) return { kind: "bridges", size, level, seed, ...made };
    // Nearest first: a hard asked for and a medium found is kept in case no hard comes.
    if (fallback === null || (level === "hard" && found === "medium")) fallback = made;
  }
  if (fallback === null) throw new Error(`No ${size}×${size} Bridges puzzle came from seed ${seed}.`);
  return { kind: "bridges", size, level, seed, ...fallback };
}

/** The four ways a bridge can run from an island: right, down, left, up. */
const STEPS = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
] as const;

/**
 * An answer's islands, grown from one: each new island at the end of a
 * straight run of water from one already placed, never beside another island
 * and never across a bridge. Null when the grid would not take enough of them.
 */
export function growLayout(size: number, random: Random): Island[] | null {
  const want = Math.max(4, Math.round(size * size * ISLAND_SHARE));
  // 0 water, 1 island, 2 a bridge across, 3 a bridge down.
  const ground = new Uint8Array(size * size);
  const counts = new Map<number, number>();
  const cellOf = (row: number, col: number) => row * size + col;
  const inside = (row: number, col: number) => row >= 0 && col >= 0 && row < size && col < size;
  const besideIsland = (row: number, col: number, from: number) =>
    STEPS.some(([dr, dc]) => inside(row + dr, col + dc) && cellOf(row + dr, col + dc) !== from && ground[cellOf(row + dr, col + dc)] === 1);
  const add = (cell: number) => {
    ground[cell] = 1;
    counts.set(cell, 0);
  };
  const lay = (from: number, to: number, cells: readonly number[], across: boolean) => {
    const bridges = random() < 0.45 ? 2 : 1;
    for (const cell of cells) ground[cell] = across ? 2 : 3;
    counts.set(from, counts.get(from)! + bridges);
    counts.set(to, counts.get(to)! + bridges);
  };

  add(cellOf(Math.floor(random() * size), Math.floor(random() * size)));
  let tries = 0;
  while (counts.size < want && tries < want * 60) {
    tries += 1;
    const placed = [...counts.keys()];
    const from = placed[Math.floor(random() * placed.length)]!;
    const [dr, dc] = STEPS[Math.floor(random() * 4)]!;
    const row = Math.floor(from / size);
    const col = from % size;
    // Every cell this run could stop on: water, not beside another island, with only water behind it.
    const stops: { cell: number; path: number[] }[] = [];
    const path: number[] = [];
    for (let step = 1; ; step += 1) {
      const r = row + dr * step;
      const c = col + dc * step;
      if (!inside(r, c) || ground[cellOf(r, c)] !== 0) break;
      if (step >= 2 && !besideIsland(r, c, path.at(-1) ?? from)) stops.push({ cell: cellOf(r, c), path: [...path] });
      path.push(cellOf(r, c));
    }
    if (stops.length === 0) continue;
    // A short run more often than a long one, as a printed puzzle has.
    const stop = stops[Math.floor(random() * random() * stops.length)]!;
    add(stop.cell);
    lay(from, stop.cell, stop.path, dr === 0);
  }
  if (counts.size < want * 0.8) return null;
  // A few more bridges between islands already in line, so the answer has loops and not only branches.
  for (const from of [...counts.keys()]) {
    for (const [dr, dc] of STEPS.slice(0, 2)) {
      const row = Math.floor(from / size);
      const col = from % size;
      const path: number[] = [];
      for (let step = 1; ; step += 1) {
        const r = row + dr * step;
        const c = col + dc * step;
        if (!inside(r, c)) break;
        const cell = cellOf(r, c);
        if (ground[cell] === 1) {
          if (path.length > 0 && random() < 0.3) lay(from, cell, path, dr === 0);
          break;
        }
        if (ground[cell] !== 0) break;
        path.push(cell);
      }
    }
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([cell, count]) => ({ cell, row: Math.floor(cell / size), col: cell % size, count }));
}
