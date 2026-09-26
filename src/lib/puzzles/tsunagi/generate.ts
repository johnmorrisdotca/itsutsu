import { CELL_EMPTY, decodeLayout, encodeAnswer, encodeLayout, type LinkLayout, neighbourTable, PAIR_LETTERS } from "./code.ts";
import { countSolutions } from "./solve.ts";
import type { Random } from "../random.ts";

/**
 * MAKING TSUNAGI LEVELS: the way John described it on 2026-09-26 — fill
 * the grid with lines that never cross, keep each line's two ends as its
 * stones, rub the lines out, and keep only the layouts the solver proves have
 * exactly one answer.
 *
 * Only `scripts/tsunagi-levels.ts` calls this, on a desk. The levels it
 * makes are curated into the size files (`levels/size<n>.data.ts`) and those
 * are what the site plays; nothing a reader does ever runs it.
 *
 * Every line it draws is at least three cells long (two stones side by side
 * are a line with nothing to think about) and never runs beside itself, so
 * each answer reads as clean lines and the solver's "exactly one" is rarely
 * spoiled by a line that could shortcut through its own bend.
 */

/** One candidate: its layout and answer codes, and what the solver said about it. */
export type LinkCandidate = {
  layout: string;
  answer: string;
  pairs: number;
  /** Positions the solver looked at to prove the answer is the only one. */
  nodes: number;
  /** Positions where it had to try more than one way: how much guessing the level asks for. */
  branches: number;
  /** Turns in the answer's lines, over all of them: how much the lines wind. */
  turns: number;
  /** The layout in its one spelling over all eight turns and mirrors, so two levels are never the same board. */
  key: string;
};

const SHORTEST_LINE = 3;

/** Grid lines that fill every cell, as lists of cells; null when this attempt painted itself into a corner. */
export function randomFilling(size: number, random: Random, longest: number): number[][] | null {
  const total = size * size;
  const around = neighbourTable(size);
  const owner = new Int16Array(total).fill(-1);
  const paths: number[][] = [];
  const emptyAround = (at: number) => around[at]!.filter((next) => owner[next] === -1).length;
  // Whether `cell` can follow `tip` on line `id` without the line touching itself.
  const fits = (id: number, tip: number, cell: number) => owner[cell] === -1 && around[cell]!.every((next) => next === tip || owner[next] !== id);

  for (;;) {
    const empty: number[] = [];
    for (let at = 0; at < total; at += 1) if (owner[at] === -1) empty.push(at);
    if (empty.length === 0) break;
    // Start where the grid is tightest, so no cell is left stranded.
    const tightest = Math.min(...empty.map(emptyAround));
    const starts = empty.filter((at) => emptyAround(at) === tightest);
    const start = starts[Math.floor(random() * starts.length)]!;
    const id = paths.length;
    const path = [start];
    owner[start] = id;
    const want = SHORTEST_LINE + Math.floor(random() * (longest - SHORTEST_LINE + 1));
    while (path.length < want) {
      const tip = path[path.length - 1]!;
      const ways = around[tip]!.filter((next) => fits(id, tip, next));
      if (ways.length === 0) break;
      // Mostly the tightest way on (Warnsdorff's rule), sometimes any: winding lines that still fill.
      let pick: number;
      if (random() < 0.7) {
        const least = Math.min(...ways.map(emptyAround));
        const tight = ways.filter((next) => emptyAround(next) === least);
        pick = tight[Math.floor(random() * tight.length)]!;
      } else pick = ways[Math.floor(random() * ways.length)]!;
      owner[pick] = id;
      path.push(pick);
    }
    if (path.length >= SHORTEST_LINE) {
      paths.push(path);
      continue;
    }
    // Too short to be a line: hand its cells to a neighbouring line's end, or give up on this attempt.
    for (const cell of path) owner[cell] = -1;
    if (!absorb(path, paths, owner, around)) return null;
  }
  return paths;
}

/** Joins a short run of cells onto the end of a line beside it, keeping every line clear of itself. */
function absorb(run: number[], paths: number[][], owner: Int16Array, around: number[][]): boolean {
  const orders = run.length === 1 ? [run] : [run, [...run].reverse()];
  for (const order of orders) {
    for (let id = 0; id < paths.length; id += 1) {
      for (const atEnd of [true, false]) {
        const line = atEnd ? paths[id]! : [...paths[id]!].reverse();
        const grown = [...line];
        const inLine = new Set(line);
        let ok = true;
        for (const cell of order) {
          const last = grown[grown.length - 1]!;
          if (!around[last]!.includes(cell) || around[cell]!.some((next) => next !== last && inLine.has(next))) {
            ok = false;
            break;
          }
          grown.push(cell);
          inLine.add(cell);
        }
        if (ok) {
          paths[id] = grown;
          for (const cell of order) owner[cell] = id;
          return true;
        }
      }
    }
  }
  return false;
}

/** The layout and answer the lines leave: their ends as stones, lettered in reading order. */
export function layoutOf(size: number, paths: readonly number[][]): { layout: string; answer: string } {
  const total = size * size;
  const byFirst = [...paths].map((path) => (path[0]! < path[path.length - 1]! ? path : [...path].reverse())).sort((a, b) => a[0]! - b[0]!);
  const cells = new Array<number>(total).fill(CELL_EMPTY);
  const owners = new Array<number>(total).fill(CELL_EMPTY);
  byFirst.forEach((path, pair) => {
    cells[path[0]!] = pair;
    cells[path[path.length - 1]!] = pair;
    for (const cell of path) owners[cell] = pair;
  });
  // Relabel in reading order of first stone, which `byFirst`'s order already is.
  return { layout: encodeLayout(cells), answer: encodeAnswer(owners) };
}

/** A layout code turned or mirrored: `turn` quarter turns, then a mirror across the vertical when `mirror`. */
export function transformed(code: string, size: number, turn: number, mirror: boolean): string {
  const out = new Array<string>(size * size);
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      let r = row;
      let c = col;
      for (let each = 0; each < turn; each += 1) [r, c] = [c, size - 1 - r];
      if (mirror) c = size - 1 - c;
      out[r * size + c] = code[row * size + col]!;
    }
  }
  return out.join("");
}

/** A code's letters renamed in reading order of first appearance: the one spelling of a layout or answer. */
export function relettered(code: string): string {
  const names = new Map<string, string>();
  return [...code]
    .map((char) => {
      if (!PAIR_LETTERS.includes(char)) return char;
      if (!names.has(char)) names.set(char, PAIR_LETTERS[names.size]!);
      return names.get(char)!;
    })
    .join("");
}

/** The least spelling of a layout over its eight turns and mirrors: equal keys are the same board. */
export function symmetryKey(code: string, size: number): string {
  let least: string | null = null;
  for (let turn = 0; turn < 4; turn += 1) {
    for (const mirror of [false, true]) {
      const each = relettered(transformed(code, size, turn, mirror));
      if (least === null || each < least) least = each;
    }
  }
  return least!;
}

/** How many times an answer's lines turn a corner, over all of them. */
export function turnsIn(answer: string, layout: LinkLayout): number {
  const { size } = layout;
  const around = neighbourTable(size);
  let turns = 0;
  for (let at = 0; at < answer.length; at += 1) {
    if (layout.cells[at] !== CELL_EMPTY) continue;
    const same = around[at]!.filter((next) => answer[next] === answer[at]);
    if (same.length === 2 && Math.abs(same[0]! - same[1]!) !== 2 && Math.abs(same[0]! - same[1]!) !== 2 * size) turns += 1;
  }
  return turns;
}

/**
 * One candidate level, or null: a filling, its layout, and the solver's
 * proof that the layout has exactly one answer — the filling's own. A layout
 * the solver cannot settle inside `budget` positions is dropped rather than
 * trusted.
 */
export function candidate(size: number, random: Random, longest: number, budget: number): LinkCandidate | null {
  const paths = randomFilling(size, random, longest);
  if (paths === null) return null;
  const { layout, answer } = layoutOf(size, paths);
  const decoded = decodeLayout(layout, size);
  if (decoded === null) return null;
  const solved = countSolutions(decoded, 2, budget);
  if (solved.gaveUp || solved.count !== 1) return null;
  if (encodeAnswer(solved.solution!) !== answer) return null;
  return {
    layout,
    answer,
    pairs: decoded.ends.length,
    nodes: solved.nodes,
    branches: solved.branches,
    turns: turnsIn(answer, decoded),
    key: symmetryKey(layout, size),
  };
}
