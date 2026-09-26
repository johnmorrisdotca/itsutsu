import type { Layout } from "./layout";

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
 *    candidate, or a value with one place left in a group.
 *  - `guessDepth` is the level: 0 when singles finish it, 1 when one guess
 *    and singles do, more when more. A level is what the solver needed, not
 *    how many givens were printed — twenty-four givens can be an easy grid.
 *
 * It reads a `Layout` — the groups that must each hold every number once —
 * so classic Number Place, Diagonal and Jigsaw are one solver with three
 * lists of groups (see `layout.ts`).
 */

/** A grid as cells, row-major; 0 is empty, 1..size is a value. */
export type Grid = number[];

const ALL = (size: number) => (1 << (size + 1)) - 2; // bits 1..size set

/** The bitmask of values each group already holds. */
function used(grid: Grid, layout: Layout): number[] {
  const taken = new Array<number>(layout.groups.length).fill(0);
  grid.forEach((value, index) => {
    if (value === 0) return;
    for (const group of layout.groupsOf[index]!) taken[group]! |= 1 << value;
  });
  return taken;
}

function candidatesAt(layout: Layout, index: number, taken: number[], work: Grid): number {
  let blocked = 0;
  for (const group of layout.groupsOf[index]!) blocked |= taken[group]!;
  const open = ALL(layout.size) & ~blocked;
  return layout.cages === undefined ? open : open & cageAllows(layout, index, work, open);
}

/**
 * The values a cell may take and still leave its cage able to reach its sum:
 * whatever is left of the sum after this cell, made of the cage's other empty
 * cells with numbers not yet in it. Checked by bounds — the smallest and
 * largest those cells could add to — which is exact for the cell that fills
 * the cage and a sound pruning before it.
 */
function cageAllows(layout: Layout, index: number, work: Grid, open: number): number {
  const cage = layout.cages![layout.cageOf![index]!]!;
  let placed = 0;
  let inCage = 0;
  let empties = 0;
  for (const cell of cage.cells) {
    const value = work[cell]!;
    if (value === 0) empties += 1;
    else {
      placed += value;
      inCage |= 1 << value;
    }
  }
  const others = empties - 1;
  let allowed = 0;
  for (let left = open; left !== 0; left &= left - 1) {
    const value = lowestBit(left);
    const rest = cage.sum - placed - value;
    if (others === 0 ? rest === 0 : reachable(rest, others, ALL(layout.size) & ~inCage & ~(1 << value), layout.size)) allowed |= 1 << value;
  }
  return allowed;
}

/** Whether `count` different values from `from` can add to `sum`, by the smallest and largest they could. */
function reachable(sum: number, count: number, from: number, size: number): boolean {
  let low = 0;
  let taken = 0;
  for (let value = 1; value <= size && taken < count; value += 1) {
    if ((from & (1 << value)) !== 0) {
      low += value;
      taken += 1;
    }
  }
  if (taken < count) return false;
  let high = 0;
  taken = 0;
  for (let value = size; value >= 1 && taken < count; value -= 1) {
    if ((from & (1 << value)) !== 0) {
      high += value;
      taken += 1;
    }
  }
  return low <= sum && sum <= high;
}

function place(layout: Layout, taken: number[], index: number, value: number): void {
  for (const group of layout.groupsOf[index]!) taken[group]! |= 1 << value;
}

function lift(layout: Layout, taken: number[], index: number, value: number): void {
  for (const group of layout.groupsOf[index]!) taken[group]! &= ~(1 << value);
}

function bitCount(mask: number): number {
  let count = 0;
  for (let m = mask; m !== 0; m &= m - 1) count += 1;
  return count;
}

function lowestBit(mask: number): number {
  return 31 - Math.clz32(mask & -mask);
}

/** The empty cell with fewest candidates, or -1 when none is empty. A cell with none gives mask 0. */
function mostConstrained(work: Grid, layout: Layout, taken: number[]): { index: number; mask: number } {
  let best = -1;
  let bestMask = 0;
  let bestCount = layout.size + 1;
  for (let index = 0; index < work.length; index += 1) {
    if (work[index] !== 0) continue;
    const mask = candidatesAt(layout, index, taken, work);
    const count = bitCount(mask);
    if (count < bestCount) {
      best = index;
      bestMask = mask;
      bestCount = count;
      if (count <= 1) break;
    }
  }
  return { index: best, mask: bestMask };
}

/**
 * How many solutions the grid has, up to `limit`. Most-constrained cell
 * first, so a grid with one answer is confirmed in a few hundred steps.
 */
export function countSolutions(grid: Grid, layout: Layout, limit = 2): number {
  return countSolutionsWithin(grid, layout, limit, Infinity)!;
}

/**
 * The same count, giving up after `budget` steps — null then, never a number,
 * because "I stopped looking" is not "there are none". A Killer's generator
 * asks this of layouts that are sometimes slow to settle, and draws another
 * rather than keeping a browser waiting.
 */
export function countSolutionsWithin(grid: Grid, layout: Layout, limit: number, budget: number, first?: (answer: Grid) => void): number | null {
  const work = [...grid];
  const taken = used(work, layout);
  let found = 0;
  let steps = 0;

  const step = (): void => {
    if (found >= limit || steps > budget) return;
    steps += 1;
    const { index, mask } = mostConstrained(work, layout, taken);
    if (index === -1) {
      if (found === 0) first?.([...work]);
      found += 1;
      return;
    }
    for (let left = mask; left !== 0; left &= left - 1) {
      const value = lowestBit(left);
      work[index] = value;
      place(layout, taken, index, value);
      step();
      lift(layout, taken, index, value);
      work[index] = 0;
      if (found >= limit || steps > budget) return;
    }
  };
  step();
  return steps > budget && found < limit ? null : found;
}

/**
 * THE ANSWER, WORKED OUT FROM THE GIVENS: a finished puzzle kept before its
 * grid was, drawn solved rather than as dealt. Every puzzle made here has
 * exactly one answer, so the search stops at two and hands back the first
 * only when there was no second. Null when there is none, or more than one,
 * or the search ran past `budget`: a grid this cannot vouch for is never drawn
 * as though it were the one that was solved.
 */
export function solutionOf(grid: Grid, layout: Layout, budget = 2_000_000): Grid | null {
  let answer: Grid | null = null;
  const found = countSolutionsWithin(grid, layout, 2, budget, (first) => (answer = first));
  return found === 1 ? answer : null;
}

export type SinglesResult = { grid: Grid; solved: boolean; contradiction: boolean };

/**
 * Fill every cell that reasoning fills, until nothing more can be: naked
 * singles (one candidate in a cell) and hidden singles (one cell for a value
 * in a group). Returns a new grid; the input is left as it was.
 */
export function applySingles(grid: Grid, layout: Layout): SinglesResult {
  const work = [...grid];
  let changed = true;
  while (changed) {
    changed = false;
    const taken = used(work, layout);
    // Naked singles.
    for (let index = 0; index < work.length; index += 1) {
      if (work[index] !== 0) continue;
      const mask = candidatesAt(layout, index, taken, work);
      if (mask === 0) return { grid: work, solved: false, contradiction: true };
      if (bitCount(mask) === 1) {
        const value = lowestBit(mask);
        work[index] = value;
        place(layout, taken, index, value);
        changed = true;
      }
    }
    // Hidden singles, group by group.
    for (let group = 0; group < layout.groups.length; group += 1) {
      for (let value = 1; value <= layout.size; value += 1) {
        const bit = 1 << value;
        if ((taken[group]! & bit) !== 0) continue;
        let at = -1;
        let places = 0;
        for (const index of layout.groups[group]!) {
          if (work[index] !== 0) continue;
          if ((candidatesAt(layout, index, taken, work) & bit) !== 0) {
            at = index;
            places += 1;
            if (places > 1) break;
          }
        }
        if (places === 0) return { grid: work, solved: false, contradiction: true };
        if (places === 1) {
          work[at] = value;
          place(layout, taken, at, value);
          changed = true;
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
export function guessDepth(grid: Grid, layout: Layout): number {
  const singles = applySingles(grid, layout);
  if (singles.contradiction) return Infinity;
  if (singles.solved) return 0;
  const work = singles.grid;
  const { index, mask } = mostConstrained(work, layout, used(work, layout));
  let deepest = Infinity;
  for (let left = mask; left !== 0; left &= left - 1) {
    const next = [...work];
    next[index] = lowestBit(left);
    const depth = guessDepth(next, layout);
    if (depth < deepest) deepest = depth;
  }
  return deepest === Infinity ? Infinity : deepest + 1;
}

/**
 * A full grid for this layout, drawn at random, or null when the search runs
 * past `budget` steps — which for a jigsaw means these regions are a poor
 * layout to fill, and the caller draws others.
 */
export function fillLayout(layout: Layout, random: () => number, budget = 200_000): Grid | null {
  const work: Grid = new Array<number>(layout.size * layout.size).fill(0);
  const taken = used(work, layout);
  let steps = 0;
  const step = (): boolean => {
    steps += 1;
    if (steps > budget) return false;
    const { index, mask } = mostConstrained(work, layout, taken);
    if (index === -1) return true;
    const values: number[] = [];
    for (let left = mask; left !== 0; left &= left - 1) values.push(lowestBit(left));
    for (let i = values.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [values[i], values[j]] = [values[j]!, values[i]!];
    }
    for (const value of values) {
      work[index] = value;
      place(layout, taken, index, value);
      if (step()) return true;
      lift(layout, taken, index, value);
      work[index] = 0;
      if (steps > budget) return false;
    }
    return false;
  };
  return step() ? work : null;
}
