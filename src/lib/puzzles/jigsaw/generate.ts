import { encodeCells } from "../puzzleCode";
import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { seededRandom, type Random } from "../random";
import { carve } from "../numberPlace/generate";
import { NUMBER_PLACE_BOXES } from "../numberPlace/boxes";
import { neighbours, regionLayout, regionsAreSound } from "../numberPlace/layout";
import { fillLayout } from "../numberPlace/solve";
import { encodeJigsaw } from "./code";

/**
 * Making a Jigsaw, in the browser, from a seed: Number Place with the boxes
 * traded for irregular regions of the same size.
 *
 * The regions come first. They start as a regular partition — the boxes
 * where the side has boxes, the rows where it does not — and are shaken by
 * exchanges: a cell passes to a neighbouring region and a cell of that region
 * touching the first passes back, kept only while both regions stay joined
 * edge to edge, so the sizes never change. A shaken layout with a region that
 * is still a whole row or column is drawn again, because that region would
 * ask nothing the row does not.
 *
 * Then a full grid for those regions, by the solver's own search with a step
 * budget: some layouts fill slowly, and one that runs past the budget is
 * swapped for another rather than waited on. Then the givens, carved exactly
 * as Number Place's are (`carve`). Deterministic in the seed, as a race needs.
 */

/** Where the removal stops, by level and side — the same proportions as Number Place's floors. */
const FLOOR: Record<PuzzleLevel, Record<number, number>> = {
  easy: { 5: 12, 6: 18, 7: 25, 9: 38 },
  medium: { 5: 9, 6: 14, 7: 20, 9: 30 },
  hard: { 5: 7, 6: 11, 7: 16, 9: 24 },
};

/** Exchanges tried per cell when shaking the regions. */
const SHAKES_PER_CELL = 40;

/** Layouts tried before giving up; a layout that cannot be filled inside the budget is replaced. */
const LAYOUTS_TRIED = 40;

function startingRegions(size: number): number[] {
  const boxes = NUMBER_PLACE_BOXES[size];
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

export function generateJigsaw(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const random = seededRandom(seed);
  for (let tried = 0; tried < LAYOUTS_TRIED; tried += 1) {
    const regions = shakeRegions(size, random);
    const layout = regionLayout(size, regions);
    const solution = fillLayout(layout, random);
    if (solution === null) continue;
    const givens = carve(solution, layout, level, FLOOR[level][size]!, random);
    return { kind: "jigsaw", size, level, seed, givens: encodeJigsaw(givens, regions), solution: encodeCells(solution) };
  }
  throw new Error(`No jigsaw could be filled from seed ${seed} at ${size}×${size}.`);
}
