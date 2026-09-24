import { decodeRegions, encodeRegions } from "../hiddenStones/code";
import { decodeCells, encodeCells } from "../puzzleCode";

/**
 * A Jigsaw's givens: the cells, then the regions, one letter a cell (the
 * Hidden Stones region code). The regions ride in the givens because they are
 * the puzzle — the server checks a finished grid against the regions it was
 * handed, in one pass, and never has to make them again.
 */
export function encodeJigsaw(cells: readonly number[], regions: readonly number[]): string {
  return encodeCells(cells) + encodeRegions(regions);
}

export function decodeJigsaw(code: string, size: number): { cells: number[]; regions: number[] } | null {
  if (typeof code !== "string" || code.length !== 2 * size * size) return null;
  const cells = decodeCells(code.slice(0, size * size), size);
  const regions = decodeRegions(code.slice(size * size), size);
  return cells === null || regions === null ? null : { cells, regions };
}
