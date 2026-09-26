import type { Random } from "../random";
import { besideCells, connected } from "./regions";
import { applyReasoning, countSolutions } from "./solve";

/**
 * MAKING A BIG HIDDEN STONES GRID BY CLIMBING, not by tightening.
 *
 * Up to 10×10 a grid is grown and then tightened against the solver, one
 * second answer at a time (`generate.ts`). At 12×12 that stalls: a grown grid
 * has thousands of answers, tightening gives up on nineteen grids in twenty,
 * and one that finished took ten seconds or more — measured 2026-09-26, and
 * more than a browser can spare. So a big grid is made the other way round,
 * from what a person can see:
 *
 * - CLIMB: move a cell that is not a stone into a neighbouring region, and
 *   keep the move when the reasoning (`applyReasoning`) leaves no more cells
 *   open than before. When nothing is left open, the reasoning has placed
 *   every stone by steps that were each forced, so the grid has exactly one
 *   answer and is an easy puzzle.
 * - LOOSEN, for a hard one: from there, go on moving cells while the
 *   reasoning still finishes it, and stop at the first move after which it
 *   does not but the solver still counts one answer. The count is made only
 *   over the cells the reasoning left open, which is all a stone could be in.
 *
 * Every move keeps each region in one piece and never moves a stone's cell,
 * so the stones the grid was grown from stay its answer throughout.
 */

/** The sides made this way: every size above this one. 10×10 and below keep the way they were made, so an old seed makes its old grid. */
export const CLIMBED_ABOVE = 10;

/** Placements tried before the generator settles for what it has. Measured: one or two are usually enough at 12×12. */
export const CLIMBED_PLACEMENTS = 30;

/** Moves tried on one grid while climbing: a plateau is common below about five thousand, and a restart costs more than waiting it out. */
export const CLIMB_TRIES = 8000;

/** Moves tried from an easy grid towards a hard one: three thousand failed one grid in forty. */
export const LOOSEN_TRIES = 3000;

/** How many cells the reasoning leaves open: none once it has finished the grid, and infinitely many if it found no answer at all. */
function openLeft(size: number, regions: readonly number[]): number {
  const reasoned = applyReasoning(size, regions);
  if (reasoned.contradiction) return Infinity;
  return reasoned.solved ? 0 : reasoned.open.filter(Boolean).length;
}

/** One random move: a cell that is not a stone into a region beside it, kept only if the region it left stays in one piece. Returns how to undo it, or null for no move. */
function moveOne(size: number, regions: number[], stones: readonly number[], random: Random): (() => void) | null {
  const cell = Math.floor(random() * size * size);
  if (stones[Math.floor(cell / size)] === cell % size) return null;
  const from = regions[cell];
  const beside = besideCells(size, cell).filter((next) => regions[next] !== from);
  if (beside.length === 0) return null;
  regions[cell] = regions[beside[Math.floor(random() * beside.length)]];
  // A region is numbered by the row of its stone, so its stone's cell is where the walk starts.
  if (!connected(size, regions, from, from * size + stones[from])) {
    regions[cell] = from;
    return null;
  }
  return () => {
    regions[cell] = from;
  };
}

/** Climb until the reasoning alone finishes the grid. Changes `regions` in place; answers whether it got there. */
export function climbToReasoned(size: number, regions: number[], stones: readonly number[], random: Random, tries: number): boolean {
  let best = openLeft(size, regions);
  for (let tried = 0; tried < tries && best > 0; tried += 1) {
    const undo = moveOne(size, regions, stones, random);
    if (undo === null) continue;
    const now = openLeft(size, regions);
    if (now <= best) best = now;
    else undo();
  }
  return best === 0;
}

/**
 * From a grid the reasoning finishes, walk until it no longer does and one
 * answer remains. Changes `regions` in place; answers whether it got there.
 * When it does not, `regions` is still a grid the reasoning finishes.
 */
export function loosenPastReasoning(size: number, regions: number[], stones: readonly number[], random: Random, tries: number): boolean {
  for (let tried = 0; tried < tries; tried += 1) {
    const undo = moveOne(size, regions, stones, random);
    if (undo === null) continue;
    const reasoned = applyReasoning(size, regions);
    if (reasoned.solved) continue;
    // Only the cells left open can hold a stone; sealing the rest (a region below zero) leaves the solver less to search.
    const open = regions.map((region, index) => (reasoned.open[index] ? region : -1));
    if (!reasoned.contradiction && countSolutions(size, open, 2) === 1) return true;
    undo();
  }
  return false;
}
