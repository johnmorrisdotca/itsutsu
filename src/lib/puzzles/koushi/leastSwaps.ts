import type { Swap } from "./lattice";

/**
 * THE FEWEST SWAPS THAT TURN ONE GRID INTO ANOTHER, when letters repeat.
 *
 * With every letter different this is a permutation's sorting distance: the
 * cells out of place, less the cycles they form (a cycle of k cells takes
 * k − 1 swaps and no fewer). With repeated letters the cycles are not fixed:
 * an E out of place may be sent to any cell that wants an E. So the question
 * is asked of letters rather than cells.
 *
 * Every cell out of place is an edge of a graph on letters, from the letter it
 * holds to the letter it wants. Each letter holds as many cells out of place as
 * want it, so every letter has as many edges in as out, and the edges split
 * into cycles. THE FEWEST SWAPS ARE THE CELLS OUT OF PLACE LESS THE MOST CYCLES
 * THE EDGES CAN BE SPLIT INTO.
 *
 * Why, in two halves:
 * - Enough: a cycle of k edges, letters a1 → a2 → … → ak → a1, is k cells, the
 *   j-th holding aj and wanting aj+1. Swapping the first cell with the second
 *   puts a2 in the first cell, which wanted it, and a1 in the second, which now
 *   holds a1 and wants a3: a cycle one shorter. k − 1 swaps finish it, and a
 *   split into c cycles is solved in (cells out of place − c) swaps
 *   (`swapsSolving` writes them out).
 * - Needed: follow each letter through any run of swaps that solves the grid.
 *   It ends in a cell that wants it, so the run carries out a permutation of
 *   the cells, and a permutation of n cells with c cycles takes exactly n − c
 *   swaps (one swap splits one cycle or joins two, so it moves the count of
 *   cycles by exactly one). Its cycles are a split of the letter graph: a
 *   cell in place may be a cycle of one, and otherwise each cycle of cells is
 *   a cycle of letters. Taking the cells in place out of a longer cycle only
 *   adds cycles, so the best permutation leaves them be, and has (cells in
 *   place + most cycles of the graph) cycles. Hence no run is shorter than
 *   the cells out of place less the most cycles.
 *
 * Finding the most cycles is a search in general, and small here: at most 21
 * edges. The first edge left lies in exactly one cycle of any split into simple
 * cycles, so every simple cycle through it is tried, the rest split the same
 * way, and splits already met are remembered by what is left of the graph.
 * Unit-tested against a breadth-first search over every grid a few swaps away.
 */

/** A letter-graph edge in a map key: the letter held, then the letter wanted. */
type Edges = Map<string, number>;

function keyOf(edges: Edges): string {
  return [...edges.entries()]
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([edge, count]) => `${edge}${count}`)
    .join(",");
}

/** The best split of what is left: how many cycles, and the cycles themselves as letter lists (a1, a2, … ak). */
type Split = { count: number; cycles: string[][] };

function bestSplit(edges: Edges, memo: Map<string, Split>): Split {
  const key = keyOf(edges);
  const known = memo.get(key);
  if (known !== undefined) return known;
  const first = [...edges.entries()].filter(([, count]) => count > 0).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))[0];
  if (first === undefined) {
    const none = { count: 0, cycles: [] };
    memo.set(key, none);
    return none;
  }
  const [from, to] = [...first[0]] as [string, string];
  const out = new Map<string, string[]>();
  for (const [edge, count] of edges) {
    if (count <= 0) continue;
    const [a, b] = [...edge] as [string, string];
    out.set(a, [...(out.get(a) ?? []), b]);
  }
  let best: Split = { count: -1, cycles: [] };
  // Every simple path from `to` back to `from`, which with the first edge is a simple cycle through it.
  const walk = (at: string, path: string[], seen: Set<string>) => {
    if (at === from) {
      const cycle = [from, ...path.slice(0, -1)];
      const rest = new Map(edges);
      for (let j = 0; j < cycle.length; j += 1) {
        const edge = cycle[j]! + cycle[(j + 1) % cycle.length]!;
        rest.set(edge, rest.get(edge)! - 1);
      }
      const after = bestSplit(rest, memo);
      if (after.count + 1 > best.count) best = { count: after.count + 1, cycles: [cycle, ...after.cycles] };
      return;
    }
    for (const next of out.get(at) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      path.push(next);
      walk(next, path, seen);
      path.pop();
      seen.delete(next);
    }
  };
  walk(to, [to], new Set([to]));
  memo.set(key, best);
  return best;
}

/** The letter graph of a grid against its target: one edge per cell out of place. Cells given as indexes into both. */
function graphOf(from: readonly string[], to: readonly string[], cells: readonly number[]): Edges {
  const edges: Edges = new Map();
  for (const cell of cells) {
    if (from[cell] === to[cell]) continue;
    const edge = from[cell]! + to[cell]!;
    edges.set(edge, (edges.get(edge) ?? 0) + 1);
  }
  return edges;
}

/**
 * The fewest swaps that turn `from` into `to` over `cells`, or null when the
 * two do not hold the same letters and no number of swaps will do it.
 */
export function leastSwaps(from: readonly string[], to: readonly string[], cells: readonly number[]): number | null {
  if (!sameLetters(from, to, cells)) return null;
  const edges = graphOf(from, to, cells);
  const outOfPlace = [...edges.values()].reduce((total, count) => total + count, 0);
  return outOfPlace - bestSplit(edges, new Map()).count;
}

/**
 * A shortest run of swaps from `from` to `to`, written out from a best split
 * (see the proof above): each cycle's cells swapped along it, first with
 * second, second with third. Null when the letters differ.
 */
export function swapsSolving(from: readonly string[], to: readonly string[], cells: readonly number[]): Swap[] | null {
  if (!sameLetters(from, to, cells)) return null;
  const split = bestSplit(graphOf(from, to, cells), new Map());
  // The cells out of place, by the edge each is, taken one at a time as the cycles call for them.
  const waiting = new Map<string, number[]>();
  for (const cell of cells) {
    if (from[cell] === to[cell]) continue;
    const edge = from[cell]! + to[cell]!;
    waiting.set(edge, [...(waiting.get(edge) ?? []), cell]);
  }
  const swaps: Swap[] = [];
  for (const cycle of split.cycles) {
    const placed = cycle.map((letter, j) => waiting.get(letter + cycle[(j + 1) % cycle.length]!)!.shift()!);
    for (let j = 0; j + 1 < placed.length; j += 1) {
      const [a, b] = [placed[j]!, placed[j + 1]!];
      swaps.push(a < b ? [a, b] : [b, a]);
    }
  }
  return swaps;
}

function sameLetters(from: readonly string[], to: readonly string[], cells: readonly number[]): boolean {
  const count = new Map<string, number>();
  for (const cell of cells) {
    count.set(from[cell]!, (count.get(from[cell]!) ?? 0) + 1);
    count.set(to[cell]!, (count.get(to[cell]!) ?? 0) - 1);
  }
  return [...count.values()].every((left) => left === 0);
}
