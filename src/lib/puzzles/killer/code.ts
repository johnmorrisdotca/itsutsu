import { decodeCells, encodeCells } from "../puzzleCode";

/**
 * A Sum Cages puzzle's givens: the cells, then which cage each cell is in, then
 * each cage's sum.
 *
 * `cells` is size² characters as every number puzzle writes them (all empty,
 * usually; a cage of one cell is its own given). `cages` is size² characters,
 * one per cell, naming its cage from `CAGE_LETTERS`. `sums` is two base-36
 * characters a cage, in cage order. The cages ride in the givens because they
 * are the puzzle: the server checks a finished grid against the cages it was
 * handed, in one pass, and never has to make them again.
 */
export const CAGE_LETTERS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export type Cage = { cells: number[]; sum: number };

export function encodeKiller(cells: readonly number[], cages: readonly Cage[]): string {
  const cageOf = new Array<number>(cells.length).fill(0);
  cages.forEach((cage, c) => cage.cells.forEach((index) => (cageOf[index] = c)));
  if (cages.length > CAGE_LETTERS.length) throw new Error(`${cages.length} cages is more than a code can name.`);
  const letters = cageOf.map((c) => CAGE_LETTERS[c]).join("");
  const sums = cages.map((cage) => cage.sum.toString(36).padStart(2, "0")).join("");
  return encodeCells(cells) + letters + sums;
}

/**
 * The cells and cages a code says, or null for one that is not a whole,
 * well-formed puzzle: every cell named to a cage, every cage used, and a sum
 * for each.
 */
export function decodeKiller(code: string, size: number): { cells: number[]; cages: Cage[] } | null {
  const area = size * size;
  if (typeof code !== "string" || code.length < 2 * area) return null;
  const cells = decodeCells(code.slice(0, area), size);
  if (cells === null) return null;
  const cageOf: number[] = [];
  for (const letter of code.slice(area, 2 * area)) {
    const c = CAGE_LETTERS.indexOf(letter);
    if (c === -1) return null;
    cageOf.push(c);
  }
  const count = Math.max(...cageOf) + 1;
  const sums = code.slice(2 * area);
  if (sums.length !== 2 * count) return null;
  const cages: Cage[] = [];
  for (let c = 0; c < count; c += 1) {
    const sum = Number.parseInt(sums.slice(2 * c, 2 * c + 2), 36);
    const members = cageOf.flatMap((value, index) => (value === c ? [index] : []));
    if (!Number.isInteger(sum) || sum <= 0 || members.length === 0) return null;
    cages.push({ cells: members, sum });
  }
  return { cells, cages };
}
