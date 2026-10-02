import { KAZU_BOXES, neighbours, regionsAreSound } from "@johnmorrisdotca/kazu";

import type { Random } from "../random";

/**
 * IRREGULAR REGIONS FOR A GRID'S SET-UP PICTURE, shaken from the boxes (or the
 * rows) by exchanges in a seeded order: a cell passes to a neighbouring region
 * and a cell of that region touching the first passes back, kept only while
 * both regions stay joined edge to edge, so the sizes never change. A layout
 * with a region that is still a whole row or column is drawn again.
 *
 * This is the same shake Kazu makes a Jigsaw's regions with, which the package
 * does not export. The preview draws the same regions for a size on every
 * visit (`PuzzleBoardPreview`), so it keeps its own copy to stay as it was;
 * the puzzles themselves are Kazu's.
 */

/** Exchanges tried per cell when shaking the regions. */
const SHAKES_PER_CELL = 40;

function startingRegions(size: number): number[] {
  const boxes = KAZU_BOXES[size];
  return Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const col = index % size;
    return boxes === undefined ? row : Math.floor(row / boxes.rows) * (size / boxes.cols) + Math.floor(col / boxes.cols);
  });
}

function joined(size: number, region: readonly number[], group: number): boolean {
  const start = region.indexOf(group);
  const seen = new Set<number>([start]);
  const stack = [start];
  while (stack.length > 0) {
    const index = stack.pop()!;
    for (const next of neighbours(size, index)) {
      if (!seen.has(next) && region[next] === group) {
        seen.add(next);
        stack.push(next);
      }
    }
  }
  return seen.size === size;
}

/** Whether some region is exactly one row or one column. */
function hasStraightRegion(size: number, region: readonly number[]): boolean {
  for (let group = 0; group < size; group += 1) {
    const cells = region.flatMap((value, index) => (value === group ? [index] : []));
    const rows = new Set(cells.map((index) => Math.floor(index / size)));
    const cols = new Set(cells.map((index) => index % size));
    if (rows.size === 1 || cols.size === 1) return true;
  }
  return false;
}

export function shakeRegions(size: number, random: Random): number[] {
  for (;;) {
    const region = startingRegions(size);
    for (let shake = 0; shake < SHAKES_PER_CELL * size * size; shake += 1) {
      /*
       * One cell passes from its region A to a neighbouring region B, and then
       * any cell of B that touches A passes back, so both keep their size. A
       * straight swap of two neighbours almost always cuts one region in two,
       * and starting from rows it never can succeed at all — the version that
       * tried it never returned.
       */
      const a = Math.floor(random() * size * size);
      const ra = region[a]!;
      const across = neighbours(size, a).filter((next) => region[next] !== ra);
      if (across.length === 0) continue;
      const rb = region[across[Math.floor(random() * across.length)]!]!;
      region[a] = rb;
      const back = region.flatMap((value, index) =>
        value === rb && index !== a && neighbours(size, index).some((next) => region[next] === ra) ? [index] : [],
      );
      if (back.length === 0) {
        region[a] = ra;
        continue;
      }
      const b = back[Math.floor(random() * back.length)]!;
      region[b] = ra;
      if (!joined(size, region, ra) || !joined(size, region, rb)) {
        region[a] = ra;
        region[b] = rb;
      }
    }
    if (!hasStraightRegion(size, region) && regionsAreSound(size, region)) return region;
  }
}

