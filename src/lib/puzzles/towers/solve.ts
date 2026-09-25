import { lineFrom, towersSeen, type TowerClues } from "./code";

/**
 * The Towers solver: counting, the reasoning a person does, and how deep a
 * guess goes. In the browser and in tests; never on a server.
 *
 * A Latin square whose rows and columns are also seen from outside. The
 * candidates are bitmasks, bit `v` for a tower of height `v`, as in More or
 * Less. It reasons about a clued line at one of two strengths:
 *
 * - `edges`, what a person sees at a glance, and what the levels are measured
 *   by: a 1 means the tallest tower is next to it, a clue as big as the square
 *   means they climb one step at a time, and a clue of `c` caps the `k`th cell
 *   from it at `size − c + k`, since `c − 1` taller towers must still show
 *   behind it. And once a clued line is down to `FEW_LEFT` open cells, every
 *   order of what is left — six at most — is tried in the head, as a person
 *   does; at seven open cells nobody tries 5,040.
 * - `lines`, the general form of all of that, used to COUNT answers and never
 *   to grade them: a height no ordering of 1..size that fits both the cells
 *   and both clues puts in a cell cannot go there. It is far stronger than
 *   anybody's eye — graded by it, nearly every puzzle came out "easy" — and
 *   it is what keeps proving a 7×7 unique down to milliseconds. At seven a
 *   side there are 5,040 orderings, filed once by what they show from each
 *   end, so a clue reads only its own.
 */

export type Grid = number[];

/** How few open cells a clued line must have before a person tries every order of them. */
const FEW_LEFT = 3;

/** How hard the solver looks at a clued line: see the note at the top. */
export type Reasoning = "edges" | "lines";

const ALL = (size: number) => (1 << (size + 1)) - 2;

function bitCount(mask: number): number {
  let count = 0;
  for (let m = mask; m !== 0; m &= m - 1) count += 1;
  return count;
}

function lowestBit(mask: number): number {
  return 31 - Math.clz32(mask & -mask);
}

/**
 * Every ordering of 1..size, filed by the towers it shows from its first end
 * and from its last: `[from][to]`, with 0 meaning "either". Flat, `size`
 * heights an ordering, because a line reads thousands of them per step.
 */
const ORDERINGS = new Map<number, Uint8Array[][]>();

function orderingsFor(size: number): Uint8Array[][] {
  const known = ORDERINGS.get(size);
  if (known !== undefined) return known;
  const lists: number[][][] = Array.from({ length: size + 1 }, () => Array.from({ length: size + 1 }, () => []));
  const heights = Array.from({ length: size }, (_, i) => i + 1);
  const place = (at: number): void => {
    if (at === size) {
      const from = towersSeen(heights);
      const to = towersSeen([...heights].reverse());
      for (const [a, b] of [[from, to], [from, 0], [0, to], [0, 0]] as const) lists[a]![b]!.push(...heights);
      return;
    }
    for (let i = at; i < size; i += 1) {
      [heights[at], heights[i]] = [heights[i]!, heights[at]!];
      place(at + 1);
      [heights[at], heights[i]] = [heights[i]!, heights[at]!];
    }
  };
  place(0);
  const filed = lists.map((row) => row.map((flat) => Uint8Array.from(flat)));
  ORDERINGS.set(size, filed);
  return filed;
}

/** A row or column with a clue at one end or both: its cells from the first end, and the clue at each (0 for none). */
type Line = { cells: number[]; from: number; to: number };

function cluedLines(size: number, clues: TowerClues): Line[] {
  const lines: Line[] = [];
  for (let at = 0; at < size; at += 1) {
    if (clues.left[at] !== 0 || clues.right[at] !== 0) lines.push({ cells: lineFrom("left", at, size), from: clues.left[at]!, to: clues.right[at]! });
    if (clues.top[at] !== 0 || clues.bottom[at] !== 0) lines.push({ cells: lineFrom("top", at, size), from: clues.top[at]!, to: clues.bottom[at]! });
  }
  return lines;
}

/**
 * Narrow one clued line to what its fitting orderings allow. Returns whether
 * anything changed, or null when no ordering fits — a contradiction.
 */
function narrowLine(line: Line, candidates: number[], size: number): boolean | null {
  const flat = orderingsFor(size)[line.from]![line.to]!;
  const masks = line.cells.map((index) => candidates[index]!);
  const allowed = new Array<number>(size).fill(0);
  let any = false;
  for (let start = 0; start < flat.length; start += size) {
    let fits = true;
    for (let k = 0; k < size; k += 1) {
      if ((masks[k]! & (1 << flat[start + k]!)) === 0) {
        fits = false;
        break;
      }
    }
    if (!fits) continue;
    any = true;
    for (let k = 0; k < size; k += 1) allowed[k]! |= 1 << flat[start + k]!;
  }
  if (!any) return null;
  let changed = false;
  line.cells.forEach((index, k) => {
    const narrowed = candidates[index]! & allowed[k]!;
    if (narrowed !== candidates[index]) {
      candidates[index] = narrowed;
      changed = true;
    }
  });
  return changed;
}

/**
 * What a person reads off a clued line at a glance (see the note at the top).
 * Returns whether anything changed, or null for a contradiction: a cell left
 * with no height, or a nearly filled line no order of its open cells can make
 * show what its clues say.
 */
function narrowEdges(line: Line, candidates: number[], size: number): boolean | null {
  let changed = false;
  const narrow = (index: number, keep: number): void => {
    const narrowed = candidates[index]! & keep;
    if (narrowed !== candidates[index]) {
      candidates[index] = narrowed;
      changed = true;
    }
  };
  for (const [clue, cells] of [[line.from, line.cells], [line.to, [...line.cells].reverse()]] as const) {
    if (clue === 0) continue;
    cells.forEach((index, k) => {
      if (clue === 1 && k === 0) narrow(index, 1 << size);
      else if (clue === size) narrow(index, 1 << (k + 1));
      else narrow(index, (1 << (Math.min(size, size - clue + k + 1) + 1)) - 2);
    });
  }
  if (line.cells.some((index) => candidates[index] === 0)) return null;
  // Few enough left to try every order: the same narrowing as `lines`, which also refuses a filled line its clues do not see.
  if (line.cells.filter((index) => bitCount(candidates[index]!) > 1).length <= FEW_LEFT) {
    const tried = narrowLine(line, candidates, size);
    if (tried === null) return null;
    if (tried) changed = true;
  }
  return changed;
}

export type SinglesResult = { grid: Grid; solved: boolean; contradiction: boolean; candidates: number[] };

/**
 * What can be seen without trying anything: every clued line narrowed at the
 * strength asked for, a cell with one height left, a height with one place
 * left in its row or column. Runs to a fixpoint. Returns a new grid; the
 * input is left alone.
 */
export function applySingles(grid: Grid, size: number, clues: TowerClues, reasoning: Reasoning = "edges"): SinglesResult {
  const narrowOne = reasoning === "lines" ? narrowLine : narrowEdges;
  const work = [...grid];
  const lines = cluedLines(size, clues);
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
      if (at !== index && (Math.floor(at / size) === row || at % size === col)) candidates[at]! &= ~(1 << value);
    }
  };
  const stuck = (): SinglesResult => ({ grid: work, solved: false, contradiction: true, candidates });
  let changed = true;
  while (changed) {
    changed = false;
    for (const line of lines) {
      const narrowed = narrowOne(line, candidates, size);
      if (narrowed === null) return stuck();
      if (narrowed) changed = true;
    }
    for (let index = 0; index < work.length; index += 1) {
      if (candidates[index] === 0) return stuck();
      if (work[index] === 0 && bitCount(candidates[index]!) === 1) {
        set(index, lowestBit(candidates[index]!));
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
            if ((candidates[index]! & bit) !== 0) {
              place = index;
              places += 1;
            }
          }
          if (places === 0) return stuck();
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

/** The empty cell with the fewest heights left, which is where a guess costs least. */
function branchCell(singles: SinglesResult, size: number): number {
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
  return best;
}

/** How many answers the grid has, up to `limit`: the strongest reasoning at every node, then a branch on the tightest cell. */
export function countSolutions(grid: Grid, size: number, clues: TowerClues, limit = 2): number {
  let found = 0;
  const step = (at: Grid): void => {
    if (found >= limit) return;
    const singles = applySingles(at, size, clues, "lines");
    if (singles.contradiction) return;
    if (singles.solved) {
      found += 1;
      return;
    }
    const best = branchCell(singles, size);
    for (let mask = singles.candidates[best]!; mask !== 0; mask &= mask - 1) {
      const next = [...singles.grid];
      next[best] = lowestBit(mask);
      step(next);
      if (found >= limit) return;
    }
  };
  step(grid);
  return found;
}

/**
 * How many guesses, each followed by everything a glance then finds (`edges`),
 * a person needs: 0 when looking finishes it, `Infinity` when there is no answer or
 * when it needs more than `limit` — all a caller asking "is this within the
 * level" needs to know.
 */
export function guessDepth(grid: Grid, size: number, clues: TowerClues, limit = Infinity): number {
  const singles = applySingles(grid, size, clues);
  if (singles.contradiction) return Infinity;
  if (singles.solved) return 0;
  if (limit <= 0) return Infinity;
  const best = branchCell(singles, size);
  let deepest = Infinity;
  for (let mask = singles.candidates[best]!; mask !== 0; mask &= mask - 1) {
    const next = [...singles.grid];
    next[best] = lowestBit(mask);
    const depth = guessDepth(next, size, clues, limit - 1);
    if (depth < deepest) deepest = depth;
  }
  return deepest === Infinity ? Infinity : deepest + 1;
}
