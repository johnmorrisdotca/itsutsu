import { boxOf } from "./boxes";

/**
 * The Number Place solver: counting, singles, and how deep a guess goes.
 *
 * Three questions, one small engine, all in the browser (a page imports
 * `generate.ts`, which imports this) and in tests. The server never calls
 * any of it: the one thing the server checks is a finished grid, in
 * `puzzleCheck.ts`, which is O(cells) and needs no search.
 *
 *  - `countSolutions` says whether a puzzle has exactly one answer, which is
 *    the whole difference between a puzzle and a guessing game. It stops at
 *    two, so "many" costs no more than "two".
 *  - `applySingles` fills what pure reasoning fills: a cell with one
 *    candidate, or a value with one place left in its row, column or box.
 *  - `guessDepth` is the level: 0 when singles finish it, 1 when one guess
 *    and singles do, more when more. A level is what the solver needed, not
 *    how many givens were printed — twenty-four givens can be an easy grid.
 */

/** A grid as cells, row-major; 0 is empty, 1..size is a value. */
export type Grid = number[];

type Units = { row: number[]; col: number[]; box: number[] };

const UNITS = new Map<number, Units>();

/** The row, column and box index of every cell, once per size. */
function unitsOf(size: number): Units {
  const known = UNITS.get(size);
  if (known !== undefined) return known;
  const units: Units = { row: [], col: [], box: [] };
  for (let index = 0; index < size * size; index += 1) {
    units.row.push(Math.floor(index / size));
    units.col.push(index % size);
    units.box.push(boxOf(size, index));
  }
  UNITS.set(size, units);
  return units;
}

const ALL = (size: number) => (1 << (size + 1)) - 2; // bits 1..size set

/** The bitmask of values each row, column and box still lacks. */
function used(grid: Grid, size: number): { row: number[]; col: number[]; box: number[] } {
  const units = unitsOf(size);
  const row = new Array<number>(size).fill(0);
  const col = new Array<number>(size).fill(0);
  const box = new Array<number>(size).fill(0);
  grid.forEach((value, index) => {
    if (value === 0) return;
    const bit = 1 << value;
    row[units.row[index]] |= bit;
    col[units.col[index]] |= bit;
    box[units.box[index]] |= bit;
  });
  return { row, col, box };
}

function candidatesAt(grid: Grid, size: number, index: number, taken: ReturnType<typeof used>): number {
  const units = unitsOf(size);
  return ALL(size) & ~(taken.row[units.row[index]] | taken.col[units.col[index]] | taken.box[units.box[index]]);
}

function bitCount(mask: number): number {
  let count = 0;
  for (let m = mask; m !== 0; m &= m - 1) count += 1;
  return count;
}

function lowestBit(mask: number): number {
  return 31 - Math.clz32(mask & -mask);
}

/**
 * How many solutions the grid has, up to `limit`. Most-constrained cell
 * first, so a grid with one answer is confirmed in a few hundred steps.
 */
export function countSolutions(grid: Grid, size: number, limit = 2): number {
  const units = unitsOf(size);
  const work = [...grid];
  const taken = used(work, size);
  let found = 0;

  const step = (): void => {
    if (found >= limit) return;
    let best = -1;
    let bestMask = 0;
    let bestCount = size + 1;
    for (let index = 0; index < work.length; index += 1) {
      if (work[index] !== 0) continue;
      const mask = candidatesAt(work, size, index, taken);
      const count = bitCount(mask);
      if (count === 0) return;
      if (count < bestCount) {
        best = index;
        bestMask = mask;
        bestCount = count;
        if (count === 1) break;
      }
    }
    if (best === -1) {
      found += 1;
      return;
    }
    for (let mask = bestMask; mask !== 0; mask &= mask - 1) {
      const value = lowestBit(mask);
      const bit = 1 << value;
      work[best] = value;
      taken.row[units.row[best]] |= bit;
      taken.col[units.col[best]] |= bit;
      taken.box[units.box[best]] |= bit;
      step();
      taken.row[units.row[best]] &= ~bit;
      taken.col[units.col[best]] &= ~bit;
      taken.box[units.box[best]] &= ~bit;
      work[best] = 0;
      if (found >= limit) return;
    }
  };
  step();
  return found;
}

export type SinglesResult = { grid: Grid; solved: boolean; contradiction: boolean };

/**
 * Fill every cell that reasoning fills, until nothing more can be: naked
 * singles (one candidate in a cell) and hidden singles (one cell for a value
 * in a unit). Returns a new grid; the input is left as it was.
 */
export function applySingles(grid: Grid, size: number): SinglesResult {
  const units = unitsOf(size);
  const work = [...grid];
  let changed = true;
  while (changed) {
    changed = false;
    const taken = used(work, size);
    // Naked singles.
    for (let index = 0; index < work.length; index += 1) {
      if (work[index] !== 0) continue;
      const mask = candidatesAt(work, size, index, taken);
      if (mask === 0) return { grid: work, solved: false, contradiction: true };
      if (bitCount(mask) === 1) {
        const value = lowestBit(mask);
        work[index] = value;
        const bit = 1 << value;
        taken.row[units.row[index]] |= bit;
        taken.col[units.col[index]] |= bit;
        taken.box[units.box[index]] |= bit;
        changed = true;
      }
    }
    // Hidden singles, per unit kind.
    for (const kind of ["row", "col", "box"] as const) {
      for (let unit = 0; unit < size; unit += 1) {
        for (let value = 1; value <= size; value += 1) {
          const bit = 1 << value;
          if ((taken[kind][unit] & bit) !== 0) continue;
          let place = -1;
          let places = 0;
          for (let index = 0; index < work.length; index += 1) {
            if (units[kind][index] !== unit || work[index] !== 0) continue;
            if ((candidatesAt(work, size, index, taken) & bit) !== 0) {
              place = index;
              places += 1;
              if (places > 1) break;
            }
          }
          if (places === 0) return { grid: work, solved: false, contradiction: true };
          if (places === 1) {
            work[place] = value;
            taken.row[units.row[place]] |= bit;
            taken.col[units.col[place]] |= bit;
            taken.box[units.box[place]] |= bit;
            changed = true;
          }
        }
      }
    }
  }
  return { grid: work, solved: work.every((value) => value !== 0), contradiction: false };
}

/**
 * How many guesses, each followed by every single it lets loose, a solver
 * needs to finish the grid: 0 when singles do it all, `Infinity` when the grid
 * has no answer. Meant for a grid already known to have exactly one.
 */
export function guessDepth(grid: Grid, size: number): number {
  const singles = applySingles(grid, size);
  if (singles.contradiction) return Infinity;
  if (singles.solved) return 0;
  const work = singles.grid;
  const taken = used(work, size);
  let best = -1;
  let bestMask = 0;
  let bestCount = size + 1;
  for (let index = 0; index < work.length; index += 1) {
    if (work[index] !== 0) continue;
    const mask = candidatesAt(work, size, index, taken);
    const count = bitCount(mask);
    if (count < bestCount) {
      best = index;
      bestMask = mask;
      bestCount = count;
    }
  }
  let deepest = Infinity;
  for (let mask = bestMask; mask !== 0; mask &= mask - 1) {
    const next = [...work];
    next[best] = lowestBit(mask);
    const depth = guessDepth(next, size);
    if (depth < deepest) deepest = depth;
  }
  return deepest === Infinity ? Infinity : deepest + 1;
}
