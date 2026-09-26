import { CELL_EMPTY, type LinkLayout, neighbourTable } from "./code.ts";

/**
 * THE TSUNAGI SOLVER: how many ways a layout can be joined, up to a
 * limit, and how much trying it took.
 *
 * Run where the levels are made (`scripts/tsunagi-levels.ts`) and in the
 * unit test that proves every shipped level has exactly one answer — never in
 * a browser and never on a request. A level is a line of data by the time
 * anybody plays it.
 *
 * The rules it counts under are the published ones, and no more: a line runs
 * cell to cell across and down, lines never cross or share a cell, and every
 * open cell is used. A line MAY run beside itself; the solver counts those
 * answers too, so "exactly one" is a claim about every answer the rules
 * allow, not only the tidy ones.
 *
 * Search: each pair's line grows from its first stone towards its second.
 * At every step the pair with the fewest ways on is grown (a pair with one is
 * forced), after four checks that throw a hopeless grid away early:
 *
 *   - every empty cell still has two ways in and out (an empty cell or an
 *     unfinished line's end beside it), or no line could pass through it;
 *   - every unfinished line's growing end and its far stone each have a way on;
 *   - the growing end and the far stone touch one common region of empty
 *     cells (or each other), or the line can never close;
 *   - every region of empty cells is touched at both ends by some unfinished
 *     line, or nothing could ever fill it.
 */
export type SolveCount = {
  /** Answers found, never more than the limit asked for. */
  count: number;
  /** Positions looked at: the measure of how much trying the layout takes. */
  nodes: number;
  /** Positions where more than one way on had to be tried: the measure of guessing. */
  branches: number;
  /** The first answer found, as the pair through each cell; null for none. */
  solution: number[] | null;
  /** True when the search stopped at the node budget before it could say. */
  gaveUp: boolean;
};

export function countSolutions(layout: LinkLayout, limit = 2, budget = Number.POSITIVE_INFINITY): SolveCount {
  const { size, cells, ends } = layout;
  const total = size * size;
  const around = neighbourTable(size);
  const pairs = ends.length;
  const grid = Int16Array.from(cells);
  const head = Int16Array.from(ends.map((pair) => pair[0]));
  const goal = Int16Array.from(ends.map((pair) => pair[1]));
  const closed = new Uint8Array(pairs);
  let openPairs = pairs;
  let empties = cells.filter((cell) => cell === CELL_EMPTY).length;

  // Scratch for the region check, reused at every node.
  const region = new Int16Array(total);
  const queue = new Int16Array(total);
  const served = new Uint8Array(total);
  /** Which unfinished pair's end sits on each cell, or -1: a growing end or a far stone. */
  const endOf = new Int16Array(total).fill(-1);
  for (let pair = 0; pair < pairs; pair += 1) {
    endOf[head[pair]!] = pair;
    endOf[goal[pair]!] = pair;
  }

  const result: SolveCount = { count: 0, nodes: 0, branches: 0, solution: null, gaveUp: false };

  const hopeless = (): boolean => {
    // Every empty cell needs two ways: an empty neighbour, or an unfinished line's end.
    for (let at = 0; at < total; at += 1) {
      if (grid[at] !== CELL_EMPTY) continue;
      let ways = 0;
      for (const next of around[at]!) if (grid[next] === CELL_EMPTY || endOf[next] !== -1) ways += 1;
      if (ways < 2) return true;
    }
    // Regions of empty cells.
    region.fill(-1);
    let regions = 0;
    for (let at = 0; at < total; at += 1) {
      if (grid[at] !== CELL_EMPTY || region[at] !== -1) continue;
      let read = 0;
      let write = 0;
      queue[write++] = at;
      region[at] = regions;
      while (read < write) {
        const cell = queue[read++]!;
        for (const next of around[cell]!) {
          if (grid[next] === CELL_EMPTY && region[next] === -1) {
            region[next] = regions;
            queue[write++] = next;
          }
        }
      }
      regions += 1;
    }
    served.fill(0, 0, regions);
    for (let pair = 0; pair < pairs; pair += 1) {
      if (closed[pair] === 1) continue;
      const from = head[pair]!;
      const to = goal[pair]!;
      let touching = false;
      let fromWays = 0;
      let toWays = 0;
      for (const next of around[from]!) {
        if (next === to) {
          touching = true;
          fromWays += 1;
        } else if (grid[next] === CELL_EMPTY) fromWays += 1;
      }
      for (const next of around[to]!) if (next === from || grid[next] === CELL_EMPTY) toWays += 1;
      if (fromWays === 0 || toWays === 0) return true;
      let joined = touching;
      for (const a of around[from]!) {
        if (grid[a] !== CELL_EMPTY) continue;
        for (const b of around[to]!) {
          if (grid[b] === CELL_EMPTY && region[a] === region[b]) {
            joined = true;
            served[region[a]!] = 1;
          }
        }
      }
      if (!joined) return true;
    }
    for (let each = 0; each < regions; each += 1) if (served[each] === 0) return true;
    return false;
  };

  const search = (): void => {
    if (result.count >= limit || result.gaveUp) return;
    result.nodes += 1;
    if (result.nodes > budget) {
      result.gaveUp = true;
      return;
    }
    if (openPairs === 0) {
      if (empties === 0) {
        result.count += 1;
        if (result.solution === null) result.solution = Array.from(grid);
      }
      return;
    }
    if (hopeless()) return;
    // The unfinished pair with the fewest ways on.
    let best = -1;
    let bestWays = 5;
    for (let pair = 0; pair < pairs; pair += 1) {
      if (closed[pair] === 1) continue;
      let ways = 0;
      for (const next of around[head[pair]!]!) if (grid[next] === CELL_EMPTY || next === goal[pair]) ways += 1;
      if (ways < bestWays) {
        best = pair;
        bestWays = ways;
        if (ways <= 1) break;
      }
    }
    if (bestWays === 0) return;
    if (bestWays > 1) result.branches += 1;
    const from = head[best]!;
    for (const next of around[from]!) {
      if (next === goal[best]) {
        // Close the line here.
        closed[best] = 1;
        openPairs -= 1;
        endOf[from] = -1;
        endOf[next] = -1;
        search();
        endOf[from] = best;
        endOf[next] = best;
        openPairs += 1;
        closed[best] = 0;
      } else if (grid[next] === CELL_EMPTY) {
        grid[next] = best;
        empties -= 1;
        head[best] = next;
        endOf[from] = -1;
        endOf[next] = best;
        search();
        endOf[next] = -1;
        endOf[from] = best;
        head[best] = from;
        empties += 1;
        grid[next] = CELL_EMPTY;
      }
      if (result.count >= limit || result.gaveUp) return;
    }
  };

  // A stone its pair does not name is no layout at all: nothing can be joined.
  if (cells.some((cell, at) => cell >= 0 && ends[cell]![0] !== at && ends[cell]![1] !== at)) return result;
  search();
  return result;
}
