import { CELL_EMPTY, type LinkLayout } from "./code.ts";
import { bridgesOf, stepTable, type Step } from "./steps.ts";

/*
 * An empty cell, read into this module once. The search reads it millions of
 * times, and a test runner that rewrites imports into lookups on a module
 * object (vitest's does) made every one of those reads a property access: the
 * same solves ran 2.8 times slower under the unit suite than in node, and a
 * 12×12 proof file took 47 seconds rather than 16.
 */
const EMPTY: number = CELL_EMPTY;

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
 * cell to cell across and down, never through a wall (`steps.ts`), lines never
 * cross or share a cell except on a bridge — where one goes straight across
 * and a different one straight down — a waypoint is taken by its own pair's
 * line and no other, on a board that wraps a line may leave one edge and come
 * back at the other, and every open cell and both ways over every bridge are
 * used. A line MAY run beside itself; the solver counts those
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
  /** Every answer found, in the order found: a second one is where a generator mends a board that has two (`repairedCandidate`). */
  solutions: number[][];
  /** True when the search stopped at the node budget before it could say. */
  gaveUp: boolean;
};

export function countSolutions(layout: LinkLayout, limit = 2, budget = Number.POSITIVE_INFINITY): SolveCount {
  const { size, cells, ends } = layout;
  const total = size * size;
  const steps = stepTable(layout);
  const bridges = bridgesOf(layout);
  const pairs = ends.length;
  const grid = Int16Array.from(cells);
  const head = Int16Array.from(ends.map((pair) => pair[0]));
  const goal = Int16Array.from(ends.map((pair) => pair[1]));
  const closed = new Uint8Array(pairs);
  // A bridge's two slots: the pair going across it and the pair going down it, -1 while free.
  const across = new Int16Array(total).fill(-1);
  const down = new Int16Array(total).fill(-1);
  // A waypoint's pair, or -1: an empty cell only that pair's line may take.
  const kept = new Int16Array(total).fill(-1);
  for (const [cell, pair] of layout.waypoints) kept[cell] = pair;
  /** Whether `pair`'s line may take the empty cell `at`. */
  const mayTake = (at: number, pair: number) => grid[at] === EMPTY && (kept[at] === -1 || kept[at] === pair);
  let openPairs = pairs;
  // Every empty cell, and both slots of every bridge, must be used.
  let empties = cells.filter((cell) => cell === EMPTY).length + 2 * bridges.length;

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

  /** Whether a step may be taken now: a plain step always, a bridge's only while its slot is free, and never by the line already on the other slot. */
  const free = (step: Step, pair = -1): boolean => {
    if (step.over === -1) return true;
    const mine = step.across ? across : down;
    const other = step.across ? down : across;
    return mine[step.over] === -1 && (pair === -1 || other[step.over] !== pair);
  };

  const result: SolveCount = { count: 0, nodes: 0, branches: 0, solution: null, solutions: [], gaveUp: false };

  const hopeless = (): boolean => {
    // Every empty cell needs two ways: an empty cell or an unfinished line's end a step away.
    for (let at = 0; at < total; at += 1) {
      if (grid[at] !== EMPTY) continue;
      let ways = 0;
      for (const step of steps[at]!) if (free(step) && (grid[step.to] === EMPTY || endOf[step.to] !== -1)) ways += 1;
      if (ways < 2) return true;
    }
    // Every free slot of a bridge needs something on both sides that a line could still come from or go to.
    for (const bridge of bridges) {
      for (const [slot, by] of [
        [across, 1],
        [down, size],
      ] as const) {
        if (slot[bridge] !== -1) continue;
        for (const side of [bridge - by, bridge + by]) if (grid[side] !== EMPTY && endOf[side] === -1) return true;
      }
    }
    // Regions of empty cells, joined over a bridge's free slot.
    region.fill(-1);
    let regions = 0;
    for (let at = 0; at < total; at += 1) {
      if (grid[at] !== EMPTY || region[at] !== -1) continue;
      let read = 0;
      let write = 0;
      queue[write++] = at;
      region[at] = regions;
      while (read < write) {
        const cell = queue[read++]!;
        for (const step of steps[cell]!) {
          if (free(step) && grid[step.to] === EMPTY && region[step.to] === -1) {
            region[step.to] = regions;
            queue[write++] = step.to;
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
      for (const step of steps[from]!) {
        if (!free(step, pair)) continue;
        if (step.to === to) {
          touching = true;
          fromWays += 1;
        } else if (grid[step.to] === EMPTY) fromWays += 1;
      }
      for (const step of steps[to]!) if (free(step, pair) && (step.to === from || grid[step.to] === EMPTY)) toWays += 1;
      if (fromWays === 0 || toWays === 0) return true;
      let joined = touching;
      for (const a of steps[from]!) {
        if (grid[a.to] !== EMPTY || !free(a, pair)) continue;
        for (const b of steps[to]!) {
          if (grid[b.to] === EMPTY && free(b, pair) && region[a.to] === region[b.to]) {
            joined = true;
            served[region[a.to]!] = 1;
          }
        }
      }
      if (!joined) return true;
    }
    for (let each = 0; each < regions; each += 1) if (served[each] === 0) return true;
    return false;
  };

  const take = (step: Step, pair: number) => {
    if (step.over === -1) return;
    (step.across ? across : down)[step.over] = pair;
    empties -= 1;
  };
  const untake = (step: Step) => {
    if (step.over === -1) return;
    (step.across ? across : down)[step.over] = -1;
    empties += 1;
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
        result.solutions.push(Array.from(grid));
      }
      return;
    }
    if (hopeless()) return;
    // The unfinished pair with the fewest ways on.
    let best = -1;
    // More than any cell can have: four ways on a square, six on a hexagon.
    let bestWays = 7;
    for (let pair = 0; pair < pairs; pair += 1) {
      if (closed[pair] === 1) continue;
      let ways = 0;
      for (const step of steps[head[pair]!]!) if (free(step, pair) && (mayTake(step.to, pair) || step.to === goal[pair])) ways += 1;
      if (ways < bestWays) {
        best = pair;
        bestWays = ways;
        if (ways <= 1) break;
      }
    }
    if (bestWays === 0) return;
    if (bestWays > 1) result.branches += 1;
    const from = head[best]!;
    for (const step of steps[from]!) {
      if (!free(step, best)) continue;
      const next = step.to;
      if (next === goal[best]) {
        // Close the line here.
        take(step, best);
        closed[best] = 1;
        openPairs -= 1;
        endOf[from] = -1;
        endOf[next] = -1;
        search();
        endOf[from] = best;
        endOf[next] = best;
        openPairs += 1;
        closed[best] = 0;
        untake(step);
      } else if (mayTake(next, best)) {
        take(step, best);
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
        grid[next] = EMPTY;
        untake(step);
      }
      if (result.count >= limit || result.gaveUp) return;
    }
  };

  // A stone its pair does not name is no layout at all: nothing can be joined.
  if (cells.some((cell, at) => cell >= 0 && ends[cell]![0] !== at && ends[cell]![1] !== at)) return result;
  search();
  return result;
}
