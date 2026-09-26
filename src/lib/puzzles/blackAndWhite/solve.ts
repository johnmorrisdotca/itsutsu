import { BLACK, EMPTY, linesOf, WHITE } from "./code";

/**
 * The Black and White solver: counting, the reasoning a person does, and how
 * deep a guess goes. In the browser and in tests; never on a server.
 *
 * A line (a row or a column) must hold as many black stones as white, never
 * three alike in a row, and be unlike every other line of its direction. It
 * reasons at one of two strengths, as Towers does:
 *
 * - `glance`, what a person sees, and what the levels are measured by: two
 *   alike side by side close both ends with the other colour; a gap between
 *   two alike takes the other colour; a line with its half of one colour fills
 *   with the other. And once a line is down to `FEW_LEFT` open cells, every
 *   way of filling them is tried in the head, which is also where "this would
 *   copy a finished line" is seen.
 * - `lines`, used to COUNT answers and never to grade them: every line is
 *   narrowed to the whole fillings that fit it — at twelve a side there are a
 *   few hundred, listed once — minus any a finished line of its direction
 *   already is.
 *
 * A line's filling is a bitmask: bit `k` set for a black stone at its `k`th
 * cell.
 */

export type Grid = number[];

export type Reasoning = "glance" | "lines";

/** How few open cells a line must have before a person tries every way of filling them. */
const FEW_LEFT = 3;

/** Every filling of a line that keeps the line's own rules: half black, no three alike. Made once per size. */
const FILLINGS = new Map<number, number[]>();

function fillingsFor(size: number): number[] {
  const known = FILLINGS.get(size);
  if (known !== undefined) return known;
  const found: number[] = [];
  for (let mask = 0; mask < 1 << size; mask += 1) {
    let blacks = 0;
    let run = 0;
    let last = -1;
    let fine = true;
    for (let k = 0; k < size; k += 1) {
      const bit = (mask >> k) & 1;
      blacks += bit;
      run = bit === last ? run + 1 : 1;
      last = bit;
      if (run === 3) {
        fine = false;
        break;
      }
    }
    if (fine && blacks * 2 === size) found.push(mask);
  }
  FILLINGS.set(size, found);
  return found;
}

/** A finished line as its filling, or null while any cell of it is open. */
function fillingOf(work: Grid, line: number[]): number | null {
  let mask = 0;
  for (const [k, index] of line.entries()) {
    if (work[index] === EMPTY) return null;
    if (work[index] === BLACK) mask |= 1 << k;
  }
  return mask;
}

export type SinglesResult = { grid: Grid; solved: boolean; contradiction: boolean };

/**
 * Everything that can be seen without trying anything, at the strength asked
 * for, run to a fixpoint. Returns a new grid; the input is left alone.
 */
export function applySingles(grid: Grid, size: number, reasoning: Reasoning = "glance"): SinglesResult {
  const work = [...grid];
  const lines = linesOf(size);
  const fillings = fillingsFor(size);
  const half = size / 2;
  let contradiction = false;
  let changed = true;
  const put = (index: number, stone: number): void => {
    if (work[index] === stone) return;
    if (work[index] !== EMPTY) contradiction = true;
    work[index] = stone;
    changed = true;
  };

  /** Narrow a line to the fillings that fit it and copy no finished line of its direction. */
  const narrowWhole = (line: number[], at: number): void => {
    let known = 0;
    let blacks = 0;
    for (const [k, index] of line.entries()) {
      if (work[index] === EMPTY) continue;
      known |= 1 << k;
      if (work[index] === BLACK) blacks |= 1 << k;
    }
    const sameWay = at < size ? lines.slice(0, size) : lines.slice(size);
    const taken = new Set<number>();
    for (const other of sameWay) {
      if (other === line) continue;
      const done = fillingOf(work, other);
      if (done !== null) taken.add(done);
    }
    let always = -1;
    let never = -1;
    let any = false;
    for (const mask of fillings) {
      if ((mask & known) !== blacks || taken.has(mask)) continue;
      any = true;
      always &= mask;
      never &= ~mask;
    }
    if (!any) {
      contradiction = true;
      return;
    }
    for (const [k, index] of line.entries()) {
      if (work[index] !== EMPTY) continue;
      if ((always >> k) & 1) put(index, BLACK);
      else if ((never >> k) & 1) put(index, WHITE);
    }
  };

  /** A person's glance along one line: pairs, gaps and a colour's half used up. */
  const glanceAlong = (line: number[]): void => {
    const at = (k: number) => (k < 0 || k >= size ? EMPTY : work[line[k]!]!);
    let blacks = 0;
    let whites = 0;
    for (let k = 0; k < size; k += 1) {
      if (at(k) === BLACK) blacks += 1;
      if (at(k) === WHITE) whites += 1;
      if (at(k) !== EMPTY && at(k) === at(k + 1) && at(k) === at(k + 2)) contradiction = true;
    }
    if (blacks > half || whites > half) contradiction = true;
    for (let k = 0; k < size; k += 1) {
      if (at(k) !== EMPTY) continue;
      const beside = [
        [at(k - 1), at(k - 2)],
        [at(k + 1), at(k + 2)],
        [at(k - 1), at(k + 1)],
      ];
      for (const [a, b] of beside) {
        if (a !== EMPTY && a === b) put(line[k]!, a === BLACK ? WHITE : BLACK);
      }
    }
    if (blacks === half || whites === half) {
      for (const index of line) if (work[index] === EMPTY) put(index, blacks === half ? WHITE : BLACK);
    }
  };

  while (changed && !contradiction) {
    changed = false;
    for (const [at, line] of lines.entries()) {
      if (contradiction) break;
      const open = line.filter((index) => work[index] === EMPTY).length;
      if (reasoning === "glance") glanceAlong(line);
      if (!contradiction && (reasoning === "lines" || open <= FEW_LEFT)) narrowWhole(line, at);
    }
  }
  return { grid: work, solved: !contradiction && work.every((cell) => cell !== EMPTY), contradiction };
}

/** The open cell to guess at: the first in the line with the fewest open cells, where a guess tells most. */
function branchCell(grid: Grid, size: number): number {
  let best = -1;
  let fewest = size + 1;
  for (const line of linesOf(size)) {
    const open = line.filter((index) => grid[index] === EMPTY);
    if (open.length > 0 && open.length < fewest) {
      fewest = open.length;
      best = open[0]!;
    }
  }
  return best;
}

/** How many answers the grid has, up to `limit`: the strongest reasoning at every node, then both colours at one cell. */
export function countSolutions(grid: Grid, size: number, limit = 2, first?: (answer: Grid) => void): number {
  let found = 0;
  const step = (at: Grid): void => {
    if (found >= limit) return;
    const singles = applySingles(at, size, "lines");
    if (singles.contradiction) return;
    if (singles.solved) {
      if (found === 0) first?.(singles.grid);
      found += 1;
      return;
    }
    const cell = branchCell(singles.grid, size);
    for (const stone of [BLACK, WHITE]) {
      const next = [...singles.grid];
      next[cell] = stone;
      step(next);
      if (found >= limit) return;
    }
  };
  step(grid);
  return found;
}

/** The one answer the printed stones allow, or null when they allow none or more than one: see `numberPlace/solve.ts`'s `solutionOf`. */
export function solutionOf(grid: Grid, size: number): Grid | null {
  let answer: Grid | null = null;
  return countSolutions(grid, size, 2, (first) => (answer = [...first])) === 1 ? answer : null;
}

/**
 * One answer, found with the colours at each guess tried in the order
 * `pick` gives: how a generator makes a full grid from a seed.
 */
export function someSolution(grid: Grid, size: number, pick: () => number): Grid | null {
  const singles = applySingles(grid, size, "lines");
  if (singles.contradiction) return null;
  if (singles.solved) return singles.grid;
  const cell = branchCell(singles.grid, size);
  const order = pick() < 0.5 ? [BLACK, WHITE] : [WHITE, BLACK];
  for (const stone of order) {
    const next = [...singles.grid];
    next[cell] = stone;
    const done = someSolution(next, size, pick);
    if (done !== null) return done;
  }
  return null;
}

/**
 * How many guesses, each followed by everything a glance then finds, a person
 * needs: 0 when looking finishes it, `Infinity` when there is no answer or
 * when it needs more than `limit`.
 */
export function guessDepth(grid: Grid, size: number, limit = Infinity): number {
  const singles = applySingles(grid, size, "glance");
  if (singles.contradiction) return Infinity;
  if (singles.solved) return 0;
  if (limit <= 0) return Infinity;
  const cell = branchCell(singles.grid, size);
  let deepest = Infinity;
  for (const stone of [BLACK, WHITE]) {
    const next = [...singles.grid];
    next[cell] = stone;
    const depth = guessDepth(next, size, limit - 1);
    if (depth < deepest) deepest = depth;
  }
  return deepest === Infinity ? Infinity : deepest + 1;
}
