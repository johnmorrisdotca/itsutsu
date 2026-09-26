import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { seededRandom, shuffled, type Random } from "../random";
import { CLIMB_TRIES, CLIMBED_ABOVE, CLIMBED_PLACEMENTS, LOOSEN_TRIES, climbToReasoned, loosenPastReasoning } from "./climb";
import { encodeRegions, encodeStones } from "./code";
import { connected } from "./regions";
import { applyReasoning, solutions } from "./solve";

/**
 * Making a Hidden Stones puzzle, in the browser, from a seed.
 *
 * Backwards from the answer, as Number Place is made: first where the stones
 * go — one per row and column, none touching — then the regions, grown out
 * from each stone by a seeded flood until every cell belongs to one. A grid
 * grown that way usually has several answers, so it is kept only when the
 * solver counts exactly one; otherwise the regions are grown again, and after
 * enough tries the stones are placed again. The level is what the solver
 * needed: easy yields to reasoning alone, hard needs a guess, and the
 * generator keeps growing until it has one of the kind asked for or has spent
 * its tries, when it hands over the last unique grid it made.
 *
 * Deterministic in the seed, like every generator here: two browsers, one
 * seed, one grid.
 */

const REGROWS_PER_PLACEMENT = 40;
const PLACEMENTS = 20;

/** A column per row, no two consecutive within one of each other, every column once. */
export function placeStones(size: number, random: Random): number[] | null {
  const columns = Array.from({ length: size }, (_, i) => i);
  const used = new Array<boolean>(size).fill(false);
  const stones: number[] = [];
  const step = (row: number): boolean => {
    if (row === size) return true;
    for (const col of shuffled(columns, random)) {
      if (used[col] || (row > 0 && Math.abs(col - stones[row - 1]) < 2)) continue;
      used[col] = true;
      stones.push(col);
      if (step(row + 1)) return true;
      stones.pop();
      used[col] = false;
    }
    return false;
  };
  return step(0) ? stones : null;
}

/** Regions grown from the stones: each region starts at its stone and takes a neighbouring free cell at a time. */
export function growRegions(size: number, stones: readonly number[], random: Random): number[] {
  const regions = new Array<number>(size * size).fill(-1);
  const frontier: number[][] = stones.map((col, row) => {
    regions[row * size + col] = row;
    return [row * size + col];
  });
  let free = size * size - size;
  const neighbours = (index: number): number[] => {
    const row = Math.floor(index / size);
    const col = index % size;
    const out: number[] = [];
    if (row > 0) out.push(index - size);
    if (row < size - 1) out.push(index + size);
    if (col > 0) out.push(index - 1);
    if (col < size - 1) out.push(index + 1);
    return out;
  };
  while (free > 0) {
    // A region at random, weighted towards the smaller ones so no region swallows the grid.
    const order = shuffled(
      frontier.map((_, region) => region),
      random,
    ).sort((a, b) => frontier[a].length - frontier[b].length);
    let grew = false;
    for (const region of order) {
      const edge = frontier[region];
      const candidates = shuffled(
        edge.flatMap((cell) => neighbours(cell).filter((next) => regions[next] === -1)),
        random,
      );
      if (candidates.length === 0) continue;
      const taken = candidates[0];
      regions[taken] = region;
      edge.push(taken);
      free -= 1;
      grew = true;
      if (random() < 0.5) break;
    }
    if (!grew) break;
  }
  return regions;
}

/**
 * Tighten a grown grid until it has one answer.
 *
 * A grid grown at random almost always has several answers (measured: two in
 * four hundred were unique at 5×5, none at 6×6 and up). But every extra
 * answer says where the grid is loose: take a second answer, pick a row
 * where it differs from the one the grid was grown from, and move that cell
 * into a neighbouring region. The second answer now puts two stones in one
 * region and is no answer; the first still has every stone in its own
 * region, so it stands. The move is kept only if the region it leaves stays
 * in one piece. Repeat until the solver counts one, or give up on this grid.
 */
function tighten(size: number, regions: number[], stones: readonly number[], random: Random): boolean {
  for (let round = 0; round < size * size; round += 1) {
    const found = solutions(size, regions, 2);
    if (found.length === 1) return true;
    const other = found.find((answer) => answer.some((col, row) => col !== stones[row]));
    if (other === undefined) return false;
    const rows = shuffled(
      other.map((col, row) => row).filter((row) => other[row] !== stones[row]),
      random,
    );
    let moved = false;
    for (const row of rows) {
      const cell = row * size + other[row];
      const from = regions[cell];
      const col = cell % size;
      const beside = shuffled(
        [row > 0 ? cell - size : -1, row < size - 1 ? cell + size : -1, col > 0 ? cell - 1 : -1, col < size - 1 ? cell + 1 : -1].filter(
          (next) => next !== -1 && regions[next] !== from,
        ),
        random,
      );
      for (const next of beside) {
        regions[cell] = regions[next];
        if (connected(size, regions, from, stones.indexOf(from) === -1 ? cell : from * size + stones[from])) {
          moved = true;
          break;
        }
        regions[cell] = from;
      }
      if (moved) break;
    }
    if (!moved) return false;
  }
  return false;
}

export function generateHiddenStones(size: number, level: PuzzleLevel, seed: number): Puzzle {
  /* A grid past ten is climbed rather than tightened (`climb.ts`): tightening
     a 12×12 took seconds, and the sizes up to ten keep the way they were made
     so every seed already played makes the grid it made then. */
  if (size > CLIMBED_ABOVE) return climbHiddenStones(size, level, seed);
  const random = seededRandom(seed);
  const wanted = level === "easy" ? 0 : 1;
  let fallback: { stones: number[]; regions: number[] } | null = null;
  for (let placement = 0; placement < PLACEMENTS; placement += 1) {
    const stones = placeStones(size, random);
    if (stones === null) continue;
    for (let regrow = 0; regrow < REGROWS_PER_PLACEMENT; regrow += 1) {
      const regions = growRegions(size, stones, random);
      if (regions.includes(-1) || !tighten(size, regions, stones, random)) continue;
      /* The level is whether reasoning alone finishes it — asked of the
         reasoning directly, not through `guessDepth`, whose search on a hard
         10×10 costs seconds and answers more than the level needs. */
      const reasoned = applyReasoning(size, regions).solved;
      const fits = wanted === 0 ? reasoned : !reasoned;
      if (fits) return made(size, level, seed, stones, regions);
      if (fallback === null) fallback = { stones, regions };
    }
  }
  /* Every try spent: the last unique grid, at whatever level it turned out.
     A grid with one answer is a puzzle; a grid of the wrong level is a puzzle
     with a label that flatters or undersells it, which is the lesser fault. */
  if (fallback !== null) return made(size, level, seed, fallback.stones, fallback.regions);
  throw new Error(`could not make a ${size}×${size} Hidden Stones from seed ${seed}`);
}

/**
 * A grid past ten, climbed: stones placed and regions grown as below, then
 * cells moved one at a time until the reasoning alone finishes it — which
 * makes it an easy puzzle with one answer, since every step the reasoning
 * takes is forced. A hard one is walked on from there until the reasoning
 * stops short while the solver still counts one answer. Measured on a 12×12:
 * a third of a second for an easy one and a quarter for a hard one on
 * average, never over one and a half, where tightening took seconds.
 */
function climbHiddenStones(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const random = seededRandom(seed);
  let fallback: { stones: number[]; regions: number[] } | null = null;
  for (let placement = 0; placement < CLIMBED_PLACEMENTS; placement += 1) {
    const stones = placeStones(size, random);
    if (stones === null) continue;
    const regions = growRegions(size, stones, random);
    if (regions.includes(-1) || !climbToReasoned(size, regions, stones, random, CLIMB_TRIES)) continue;
    if (level === "easy") return made(size, level, seed, stones, regions);
    fallback ??= { stones, regions: [...regions] };
    if (loosenPastReasoning(size, regions, stones, random, LOOSEN_TRIES)) return made(size, level, seed, stones, regions);
  }
  // As below: a grid with one answer at the wrong level is the lesser fault.
  if (fallback !== null) return made(size, level, seed, fallback.stones, fallback.regions);
  throw new Error(`could not make a ${size}×${size} Hidden Stones from seed ${seed}`);
}

function made(size: number, level: PuzzleLevel, seed: number, stones: readonly number[], regions: readonly number[]): Puzzle {
  return { kind: "hiddenStones", size, level, seed, givens: encodeRegions(regions), solution: encodeStones(stones) };
}
