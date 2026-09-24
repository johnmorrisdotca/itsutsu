import { boxOf } from "./boxes";

/**
 * WHICH CELLS MUST HOLD EVERY NUMBER ONCE: the one thing that differs between
 * Number Place and the variants built on it.
 *
 * Classic Number Place asks it of every row, column and box. Diagonal adds the
 * two long diagonals. Jigsaw keeps the rows and columns and trades the boxes
 * for irregular regions. The solver, the generator and the check read a
 * layout rather than knowing which puzzle they are in, so a variant is a new
 * list of groups and never a new solver.
 *
 * `region` is what the grid draws heavier rules between: the boxes, or the
 * jigsaw's regions. `diagonal` says the diagonals are groups too, so the grid
 * can shade them.
 */
export type Layout = {
  size: number;
  /** Every group of cells that holds 1..size once each. */
  groups: number[][];
  /** For each cell, the groups it is in. */
  groupsOf: number[][];
  /** For each cell, the region it is drawn in: a box, or a jigsaw region. */
  region: number[];
  /** What a region is called when a check says which group repeats: a box, or a jigsaw's region. */
  regionWord: "box" | "region";
  diagonal: boolean;
};

function build(size: number, region: number[], regionWord: Layout["regionWord"], diagonal: boolean): Layout {
  const groups: number[][] = [];
  const add = (cells: number[]) => groups.push(cells);
  for (let r = 0; r < size; r += 1) add(Array.from({ length: size }, (_, c) => r * size + c));
  for (let c = 0; c < size; c += 1) add(Array.from({ length: size }, (_, r) => r * size + c));
  for (let g = 0; g < size; g += 1) add(region.flatMap((value, index) => (value === g ? [index] : [])));
  if (diagonal) {
    add(Array.from({ length: size }, (_, i) => i * size + i));
    add(Array.from({ length: size }, (_, i) => i * size + (size - 1 - i)));
  }
  const groupsOf: number[][] = Array.from({ length: size * size }, () => []);
  groups.forEach((cells, g) => cells.forEach((index) => groupsOf[index]!.push(g)));
  return { size, groups, groupsOf, region, regionWord, diagonal };
}

const CLASSIC = new Map<string, Layout>();

/** Rows, columns and boxes; with `diagonal`, the two long diagonals as well. */
export function boxedLayout(size: number, diagonal = false): Layout {
  const key = `${size}:${diagonal}`;
  const known = CLASSIC.get(key);
  if (known !== undefined) return known;
  const layout = build(size, Array.from({ length: size * size }, (_, index) => boxOf(size, index)), "box", diagonal);
  CLASSIC.set(key, layout);
  return layout;
}

/** Rows, columns and the given regions, numbered 0..size-1, each `size` cells. */
export function regionLayout(size: number, region: readonly number[]): Layout {
  return build(size, [...region], "region", false);
}

/**
 * Whether `region` divides a size×size grid into `size` regions of `size`
 * cells each, every one of them joined edge to edge. O(cells): the server's
 * check of a jigsaw asks it of whatever regions it was sent.
 */
export function regionsAreSound(size: number, region: readonly number[]): boolean {
  if (region.length !== size * size) return false;
  const counts = new Array<number>(size).fill(0);
  for (const value of region) {
    if (!Number.isInteger(value) || value < 0 || value >= size) return false;
    counts[value]! += 1;
  }
  if (counts.some((count) => count !== size)) return false;
  const seen = new Array<boolean>(size * size).fill(false);
  for (let g = 0; g < size; g += 1) {
    const start = region.indexOf(g);
    const stack = [start];
    seen[start] = true;
    let reached = 0;
    while (stack.length > 0) {
      const index = stack.pop()!;
      reached += 1;
      for (const next of neighbours(size, index)) {
        if (!seen[next] && region[next] === g) {
          seen[next] = true;
          stack.push(next);
        }
      }
    }
    if (reached !== size) return false;
  }
  return true;
}

/** The cells sharing an edge with `index`. */
export function neighbours(size: number, index: number): number[] {
  const row = Math.floor(index / size);
  const col = index % size;
  const out: number[] = [];
  if (row > 0) out.push(index - size);
  if (row < size - 1) out.push(index + size);
  if (col > 0) out.push(index - 1);
  if (col < size - 1) out.push(index + 1);
  return out;
}
