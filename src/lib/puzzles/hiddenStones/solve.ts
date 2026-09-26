/**
 * The Hidden Stones solver: counting, the reasoning a person does, and how
 * deep a guess goes. In the browser and in tests; never on a server.
 *
 * A puzzle is `size` and its regions (one region index per cell, row-major).
 * An answer is one column per row. The rules are that every row, every
 * column and every region holds exactly one stone and no two stones touch,
 * even at a corner — which for stones in consecutive rows means their
 * columns differ by at least two.
 */

/** A region index per cell, row-major. */
export type Regions = readonly number[];

/**
 * The answers the puzzle has, up to `limit` of them: a column per row each.
 * Row by row, a column not used, not beside the row above's, in a region not
 * used. The generator reads the second answer to see where a grid is loose.
 */
export function solutions(size: number, regions: Regions, limit = 2): number[][] {
  const columnsUsed = new Array<boolean>(size).fill(false);
  const regionsUsed = new Array<boolean>(size).fill(false);
  const stones: number[] = [];
  const found: number[][] = [];
  const step = (row: number, previous: number): void => {
    if (found.length >= limit) return;
    if (row === size) {
      found.push([...stones]);
      return;
    }
    for (let col = 0; col < size; col += 1) {
      if (columnsUsed[col] || Math.abs(col - previous) < 2) continue;
      const region = regions[row * size + col];
      if (region < 0 || regionsUsed[region]) continue;
      columnsUsed[col] = true;
      regionsUsed[region] = true;
      stones.push(col);
      step(row + 1, col);
      stones.pop();
      columnsUsed[col] = false;
      regionsUsed[region] = false;
      if (found.length >= limit) return;
    }
  };
  step(0, -10);
  return found;
}

/** How many answers the puzzle has, up to `limit`. */
export function countSolutions(size: number, regions: Regions, limit = 2): number {
  return solutions(size, regions, limit).length;
}

/** The one answer the regions allow, a column per row, or null when they allow none or more than one: see `numberPlace/solve.ts`'s `solutionOf`. */
export function solutionOf(size: number, regions: Regions): number[] | null {
  const found = solutions(size, regions, 2);
  return found.length === 1 ? found[0]! : null;
}

/**
 * What a person can see without trying anything: a cell is out when a
 * placed stone shares its row, column or region or touches it; a stone goes
 * in when a row, a column or a region has one cell left; and when every cell
 * a region has left lies in one row or column, the rest of that row or column
 * is out. Returns the stones placed (a column per row, -1 for none yet) and
 * whether the reasoning solved it, or ran into a cell that can hold nothing.
 */
export type ReasonedResult = { stones: number[]; solved: boolean; contradiction: boolean; open: boolean[] };

export function applyReasoning(size: number, regions: Regions): ReasonedResult {
  // A cell in a region below zero is sealed: a guess made by `guessDepth`.
  const open = regions.map((region) => region >= 0);
  const stones = new Array<number>(size).fill(-1);
  const place = (row: number, col: number): void => {
    stones[row] = col;
    const region = regions[row * size + col];
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        const index = r * size + c;
        if (r === row || c === col || regions[index] === region || (Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1)) {
          open[index] = false;
        }
      }
    }
    open[row * size + col] = true;
  };
  let changed = true;
  while (changed) {
    changed = false;
    // Contradiction: a row, column or region with nothing left.
    const rowCells = Array.from({ length: size }, () => [] as number[]);
    const colCells = Array.from({ length: size }, () => [] as number[]);
    const regionCells = Array.from({ length: size }, () => [] as number[]);
    for (let index = 0; index < size * size; index += 1) {
      if (!open[index]) continue;
      const row = Math.floor(index / size);
      const col = index % size;
      if (stones[row] !== -1 && stones[row] !== col) continue;
      rowCells[row].push(index);
      colCells[col].push(index);
      regionCells[regions[index]].push(index);
    }
    for (const unit of [rowCells, colCells, regionCells]) {
      for (const cells of unit) {
        if (cells.length === 0) return { stones, solved: false, contradiction: true, open };
        if (cells.length === 1) {
          const [index] = cells;
          const row = Math.floor(index / size);
          if (stones[row] === -1) {
            place(row, index % size);
            changed = true;
          }
        }
      }
    }
    if (changed) continue;
    // A stone here would leave some row, column or region nowhere to go: so not here.
    for (let index = 0; index < size * size; index += 1) {
      if (!open[index]) continue;
      const row = Math.floor(index / size);
      const col = index % size;
      if (stones[row] !== -1) continue;
      const region = regions[index];
      const struck = (other: number): boolean => {
        const r = Math.floor(other / size);
        const c = other % size;
        return r === row || c === col || regions[other] === region || (Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1);
      };
      const emptied = (cells: number[], own: boolean) => !own && cells.length > 0 && cells.every(struck);
      let out = false;
      for (let unit = 0; unit < size && !out; unit += 1) {
        out =
          emptied(rowCells[unit], unit === row) ||
          emptied(colCells[unit], unit === col) ||
          emptied(regionCells[unit], unit === region);
      }
      if (out) {
        open[index] = false;
        changed = true;
      }
    }
    if (changed) continue;
    // A region confined to one row or one column claims it.
    for (const cells of regionCells) {
      if (cells.length < 2) continue;
      const rows = new Set(cells.map((index) => Math.floor(index / size)));
      const cols = new Set(cells.map((index) => index % size));
      if (rows.size === 1) {
        const [row] = rows;
        const region = regions[cells[0]];
        for (let c = 0; c < size; c += 1) {
          const index = row * size + c;
          if (open[index] && regions[index] !== region) {
            open[index] = false;
            changed = true;
          }
        }
      }
      if (cols.size === 1) {
        const [col] = cols;
        const region = regions[cells[0]];
        for (let r = 0; r < size; r += 1) {
          const index = r * size + col;
          if (open[index] && regions[index] !== region) {
            open[index] = false;
            changed = true;
          }
        }
      }
    }
  }
  return { stones, solved: stones.every((col) => col !== -1), contradiction: false, open };
}

/**
 * How many guesses, each followed by all the reasoning it lets loose, a
 * solver needs: 0 when reasoning finishes it, `Infinity` for no answer.
 * A guess tries each open cell of the row with the fewest.
 */
export function guessDepth(size: number, regions: Regions, forced: readonly number[] = []): number {
  // A guess is made by sealing the other cells of a row: forced[row] = col leaves only that cell open.
  const reasoned = applyReasoning(size, regionsWithForced(size, regions, forced));
  if (reasoned.contradiction) return Infinity;
  if (reasoned.solved) return 0;
  let bestRow = -1;
  let bestCells: number[] = [];
  for (let row = 0; row < size; row += 1) {
    if (reasoned.stones[row] !== -1) continue;
    const cells: number[] = [];
    for (let col = 0; col < size; col += 1) if (reasoned.open[row * size + col]) cells.push(col);
    if (bestRow === -1 || cells.length < bestCells.length) {
      bestRow = row;
      bestCells = cells;
    }
  }
  let deepest = Infinity;
  for (const col of bestCells) {
    const next = [...forced];
    next[bestRow] = col;
    const depth = guessDepth(size, regions, next);
    if (depth < deepest) deepest = depth;
  }
  return deepest === Infinity ? Infinity : deepest + 1;
}

/**
 * A guess as a change to the puzzle: the other cells of a forced row are
 * given a region of their own that nothing else holds, so the reasoning
 * treats them as sealed. `size + row` is a region index past the real ones,
 * one per forced row — which `applyReasoning` never sees a stone for, and so
 * never treats as a unit that must hold one.
 */
function regionsWithForced(size: number, regions: Regions, forced: readonly number[]): number[] {
  const out = [...regions];
  forced.forEach((col, row) => {
    if (col === undefined || col === -1) return;
    for (let c = 0; c < size; c += 1) if (c !== col) out[row * size + c] = -1 - row;
  });
  return out;
}
