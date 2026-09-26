import type { Mark } from "./code";

/**
 * The More or Less solver: counting, the reasoning a person does, and how
 * deep a guess goes. In the browser and in tests; never on a server.
 *
 * A Latin square with marks: every row and column holds each number once,
 * and each mark says which of two neighbouring cells is bigger. Candidates
 * are bitmasks, bit `v` for value `v`, and a mark prunes both ends — the
 * smaller side can hold nothing at or above the bigger side's largest
 * candidate, and the other way round.
 */

export type Grid = number[];

const ALL = (size: number) => (1 << (size + 1)) - 2;

function bitCount(mask: number): number {
  let count = 0;
  for (let m = mask; m !== 0; m &= m - 1) count += 1;
  return count;
}

function lowestBit(mask: number): number {
  return 31 - Math.clz32(mask & -mask);
}

function highestBit(mask: number): number {
  return 31 - Math.clz32(mask);
}

/** Bits strictly below `value`, and strictly above it. */
const below = (value: number) => (1 << value) - 1;
const above = (value: number, size: number) => ALL(size) & ~((1 << (value + 1)) - 1);

/**
 * How many answers the grid has, up to `limit`.
 *
 * Reasoning at every node (`applySingles`), then a branch on the cell with
 * the fewest candidates. Plain backtracking with the marks checked after
 * each assignment took twelve seconds to prove a hard 7×7 unique — a Latin
 * square with few givens has a great many near-answers, and only the marks'
 * pruning, applied as candidates are narrowed rather than after a value is
 * placed, cuts them off early.
 */
export function countSolutions(grid: Grid, size: number, marks: readonly Mark[], limit = 2, first?: (answer: Grid) => void): number {
  let found = 0;
  const step = (at: Grid): void => {
    if (found >= limit) return;
    const singles = applySingles(at, size, marks);
    if (singles.contradiction) return;
    if (singles.solved) {
      if (found === 0) first?.(singles.grid);
      found += 1;
      return;
    }
    let best = -1;
    let bestCount = size + 1;
    singles.candidates.forEach((mask, index) => {
      if (singles.grid[index] !== 0) return;
      const count = bitCount(mask);
      if (count < bestCount) {
        best = index;
        bestCount = count;
      }
    });
    for (let mask = singles.candidates[best]; mask !== 0; mask &= mask - 1) {
      const next = [...singles.grid];
      next[best] = lowestBit(mask);
      step(next);
      if (found >= limit) return;
    }
  };
  step(grid);
  return found;
}

/** The one answer the marks allow, or null when they allow none or more than one: see `numberPlace/solve.ts`'s `solutionOf`. */
export function solutionOf(grid: Grid, size: number, marks: readonly Mark[]): Grid | null {
  let answer: Grid | null = null;
  return countSolutions(grid, size, marks, 2, (first) => (answer = [...first])) === 1 ? answer : null;
}

export type SinglesResult = { grid: Grid; solved: boolean; contradiction: boolean; candidates: number[] };

/**
 * What a person can see without trying anything: the marks narrowing both
 * ends, a cell with one candidate, a value with one place in its row or
 * column. Runs to a fixpoint. Returns a new grid; the input is left alone.
 */
export function applySingles(grid: Grid, size: number, marks: readonly Mark[]): SinglesResult {
  const work = [...grid];
  const candidates = work.map((value, index) => {
    if (value !== 0) return 1 << value;
    let mask = ALL(size);
    const row = Math.floor(index / size);
    const col = index % size;
    work.forEach((other, at) => {
      if (other !== 0 && (Math.floor(at / size) === row || at % size === col)) mask &= ~(1 << other);
    });
    return mask;
  });
  const set = (index: number, value: number): void => {
    work[index] = value;
    candidates[index] = 1 << value;
    const row = Math.floor(index / size);
    const col = index % size;
    for (let at = 0; at < work.length; at += 1) {
      if (at !== index && (Math.floor(at / size) === row || at % size === col)) candidates[at] &= ~(1 << value);
    }
  };
  let changed = true;
  while (changed) {
    changed = false;
    for (const mark of marks) {
      const lessMask = candidates[mark.less] & below(highestBit(candidates[mark.more]));
      const moreMask = candidates[mark.more] & above(lowestBit(candidates[mark.less]), size);
      if (lessMask !== candidates[mark.less]) {
        candidates[mark.less] = lessMask;
        changed = true;
      }
      if (moreMask !== candidates[mark.more]) {
        candidates[mark.more] = moreMask;
        changed = true;
      }
    }
    for (let index = 0; index < work.length; index += 1) {
      if (candidates[index] === 0) return { grid: work, solved: false, contradiction: true, candidates };
      if (work[index] === 0 && bitCount(candidates[index]) === 1) {
        set(index, lowestBit(candidates[index]));
        changed = true;
      }
    }
    for (let unit = 0; unit < size; unit += 1) {
      for (let value = 1; value <= size; value += 1) {
        const bit = 1 << value;
        for (const kind of ["row", "col"] as const) {
          let place = -1;
          let places = 0;
          for (let k = 0; k < size; k += 1) {
            const index = kind === "row" ? unit * size + k : k * size + unit;
            if ((candidates[index] & bit) !== 0) {
              place = index;
              places += 1;
            }
          }
          if (places === 0) return { grid: work, solved: false, contradiction: true, candidates };
          if (places === 1 && work[place] === 0) {
            set(place, value);
            changed = true;
          }
        }
      }
    }
  }
  return { grid: work, solved: work.every((value) => value !== 0), contradiction: false, candidates };
}

/**
 * How many guesses, each followed by every single it lets loose, a solver
 * needs: 0 when reasoning finishes it, `Infinity` when there is no answer —
 * or when it needs more than `limit`, which is all a caller asking "is this
 * within the level" needs to know, and what keeps a hard 7×7 from being
 * searched to the bottom for an answer nobody asked for.
 */
export function guessDepth(grid: Grid, size: number, marks: readonly Mark[], limit = Infinity): number {
  const singles = applySingles(grid, size, marks);
  if (singles.contradiction) return Infinity;
  if (singles.solved) return 0;
  if (limit <= 0) return Infinity;
  let best = -1;
  let bestCount = size + 1;
  singles.candidates.forEach((mask, index) => {
    if (singles.grid[index] !== 0) return;
    const count = bitCount(mask);
    if (count < bestCount) {
      best = index;
      bestCount = count;
    }
  });
  let deepest = Infinity;
  for (let mask = singles.candidates[best]; mask !== 0; mask &= mask - 1) {
    const next = [...singles.grid];
    next[best] = lowestBit(mask);
    const depth = guessDepth(next, size, marks, limit - 1);
    if (depth < deepest) deepest = depth;
  }
  return deepest === Infinity ? Infinity : deepest + 1;
}
