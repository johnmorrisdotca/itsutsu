import type { CellState, LineClue } from "./pictureLogic.types";

/**
 * ONE LINE, READ AGAINST ITS CLUE: what the cells already known leave
 * possible for the rest. Two readings, the two a person makes.
 *
 * THE ENDS (`slideLine`). Push every run as far to one end as the known cells
 * let it go, then as far to the other: where a run covers the same cells both
 * ways, those cells are shaded however it lies; a cell no run can reach
 * either way is empty. The rule on the first page of every book of these.
 *
 * THE WHOLE LINE (`wholeLine`). Every way the runs could still lie, all at
 * once: a cell shaded in every one is shaded, a cell empty in every one is
 * empty. It finds all the ends find and more — which run a shaded cell must
 * belong to, a gap too short for any run left — and is what a practised
 * solver does in their head across a row they have been staring at.
 *
 * Both are worked from one table of which runs fit which stretch of the line
 * (`fits`), in O(runs × cells). Each returns the line with what it found, or
 * null when no way of laying the runs agrees with what is known: a
 * contradiction, which a trial (`solve.ts`) is looking for.
 */

type Fits = {
  /** `before[j][i]`: the first j runs can lie in cells [0, i), every other cell there empty. */
  before: Uint8Array[];
  /** `after[j][i]`: runs j.. can lie in cells [i, n), every other cell there empty. */
  after: Uint8Array[];
  /** Whether a run of `length` may lie on cells [start, start + length): none of them known empty. */
  room: (start: number, length: number) => boolean;
  /** Whether a cell may be empty: not known shaded. */
  clear: (cell: number) => boolean;
};

function fits(clue: LineClue, cells: readonly CellState[]): Fits {
  const n = cells.length;
  const k = clue.length;
  // How many known-empty cells lie before each place, so a run's room is one subtraction.
  const blocked = new Int32Array(n + 1);
  for (let at = 0; at < n; at += 1) blocked[at + 1] = blocked[at]! + (cells[at] === 2 ? 1 : 0);
  const room = (start: number, length: number) => start >= 0 && start + length <= n && blocked[start + length]! - blocked[start]! === 0;
  const clear = (cell: number) => cells[cell] !== 1;

  const before = Array.from({ length: k + 1 }, () => new Uint8Array(n + 1));
  before[0]![0] = 1;
  for (let i = 1; i <= n; i += 1) before[0]![i] = before[0]![i - 1]! && clear(i - 1) ? 1 : 0;
  for (let j = 1; j <= k; j += 1) {
    const length = clue[j - 1]!;
    for (let i = 1; i <= n; i += 1) {
      let ok = before[j]![i - 1]! === 1 && clear(i - 1);
      const start = i - length;
      if (!ok && room(start, length)) {
        ok = j === 1 ? before[0]![start] === 1 : start >= 1 && clear(start - 1) && before[j - 1]![start - 1] === 1;
      }
      before[j]![i] = ok ? 1 : 0;
    }
  }

  const after = Array.from({ length: k + 1 }, () => new Uint8Array(n + 1));
  after[k]![n] = 1;
  for (let i = n - 1; i >= 0; i -= 1) after[k]![i] = after[k]![i + 1]! && clear(i) ? 1 : 0;
  for (let j = k - 1; j >= 0; j -= 1) {
    const length = clue[j]!;
    for (let i = n - 1; i >= 0; i -= 1) {
      let ok = after[j]![i + 1]! === 1 && clear(i);
      const end = i + length;
      if (!ok && room(i, length)) {
        ok = j === k - 1 ? after[k]![end] === 1 : end < n && clear(end) && after[j + 1]![end + 1] === 1;
      }
      after[j]![i] = ok ? 1 : 0;
    }
  }
  return { before, after, room, clear };
}

/** Whether run j may start at `start` in some way of laying the whole line. */
function placeable(clue: LineClue, n: number, table: Fits, j: number, start: number): boolean {
  const { before, after, room, clear } = table;
  const length = clue[j]!;
  const end = start + length;
  if (!room(start, length)) return false;
  const left = j === 0 ? before[0]![start] === 1 : start >= 1 && clear(start - 1) && before[j]![start - 1] === 1;
  if (!left) return false;
  return j === clue.length - 1 ? after[clue.length]![end] === 1 : end < n && clear(end) && after[j + 1]![end + 1] === 1;
}

/** Every way the runs could still lie, at once: shaded where all agree, empty where all agree. */
export function wholeLine(clue: LineClue, cells: readonly CellState[]): CellState[] | null {
  const n = cells.length;
  const table = fits(clue, cells);
  if (table.before[clue.length]![n] !== 1) return null;
  const canShade = new Uint8Array(n);
  const canEmpty = new Uint8Array(n);
  clue.forEach((length, j) => {
    for (let start = 0; start + length <= n; start += 1) {
      if (placeable(clue, n, table, j, start)) canShade.fill(1, start, start + length);
    }
  });
  for (let cell = 0; cell < n; cell += 1) {
    if (!table.clear(cell)) continue;
    for (let j = 0; j <= clue.length; j += 1) {
      if (table.before[j]![cell] === 1 && table.after[j]![cell + 1] === 1) {
        canEmpty[cell] = 1;
        break;
      }
    }
  }
  const out = [...cells];
  for (let cell = 0; cell < n; cell += 1) {
    if (canShade[cell] === 0 && canEmpty[cell] === 0) return null;
    if (canEmpty[cell] === 0) out[cell] = 1;
    else if (canShade[cell] === 0) out[cell] = 2;
  }
  return out;
}

/**
 * Each run's first cell when the runs are packed as far toward the start as
 * the known-empty cells let them go, the known-shaded ones left out of the
 * reckoning: never later than wherever the run can really lie, so what is
 * read from it is always sound. Null when the runs do not fit past the ✕s.
 */
function packed(clue: LineClue, cells: readonly CellState[]): number[] | null {
  const starts: number[] = [];
  let from = 0;
  for (const length of clue) {
    let start = from;
    for (;;) {
      if (start + length > cells.length) return null;
      const blocked = cells.slice(start, start + length).lastIndexOf(2);
      if (blocked === -1) break;
      start += blocked + 1;
    }
    starts.push(start);
    from = start + length + 1;
  }
  return starts;
}

/**
 * THE ENDS, as a person first reads a line: every run pushed as far to the
 * start as the ✕s allow, then as far to the end; where a run covers the same
 * cells both ways they are shaded, and a cell no run can reach either way is
 * empty. And a line whose shaded cells already make its clue is finished:
 * everything else in it is empty. What it leaves out on purpose — which run
 * a shaded cell belongs to, every way the line could lie at once — is the
 * whole line's (`wholeLine`), and is what makes a puzzle medium.
 */
export function slideLine(clue: LineClue, cells: readonly CellState[]): CellState[] | null {
  const n = cells.length;
  const out = [...cells];
  const shadedRuns: number[] = [];
  let run = 0;
  for (const cell of [...cells, 0 as CellState]) {
    if (cell === 1) run += 1;
    else if (run > 0) {
      shadedRuns.push(run);
      run = 0;
    }
  }
  if (shadedRuns.length === clue.length && shadedRuns.every((length, at) => length === clue[at])) {
    return out.map((cell) => (cell === 0 ? 2 : cell));
  }
  const left = packed(clue, cells);
  const reversed = [...cells].reverse();
  const backwards = packed([...clue].reverse(), reversed);
  if (left === null || backwards === null) return null;
  const k = clue.length;
  const reach = new Uint8Array(n);
  for (let j = 0; j < k; j += 1) {
    const length = clue[j]!;
    const first = left[j]!;
    const last = n - backwards[k - 1 - j]! - length;
    if (last < first) return null;
    reach.fill(1, first, last + length);
    for (let cell = last; cell < first + length; cell += 1) {
      if (out[cell] === 2) return null;
      out[cell] = 1;
    }
  }
  for (let cell = 0; cell < n; cell += 1) {
    if (reach[cell] === 0) {
      if (out[cell] === 1) return null;
      out[cell] = 2;
    }
  }
  return out;
}
