/**
 * The shape of a Hidden Stones region: which cells touch, and whether a
 * region is still one piece. Shared by both ways a grid is made — tightened
 * against the solver (`generate.ts`) and climbed against the reasoning
 * (`climb.ts`) — which both move one cell at a time from region to region.
 */

/** The cells beside this one, up, down, left and right, that are on the grid. */
export function besideCells(size: number, cell: number): number[] {
  const row = Math.floor(cell / size);
  const col = cell % size;
  const out: number[] = [];
  if (row > 0) out.push(cell - size);
  if (row < size - 1) out.push(cell + size);
  if (col > 0) out.push(cell - 1);
  if (col < size - 1) out.push(cell + 1);
  return out;
}

/**
 * Whether a region is one connected piece, walking from one of its cells.
 */
export function connected(size: number, regions: readonly number[], region: number, from: number): boolean {
  const seen = new Set<number>([from]);
  const queue = [from];
  while (queue.length > 0) {
    const cell = queue.pop()!;
    const row = Math.floor(cell / size);
    const col = cell % size;
    for (const next of [row > 0 ? cell - size : -1, row < size - 1 ? cell + size : -1, col > 0 ? cell - 1 : -1, col < size - 1 ? cell + 1 : -1]) {
      if (next === -1 || seen.has(next) || regions[next] !== region) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return regions.every((each, index) => each !== region || seen.has(index));
}
