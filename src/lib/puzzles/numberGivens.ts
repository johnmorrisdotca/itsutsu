import { decodeJigsaw } from "./jigsaw/code";
import { decodeKiller, type Cage } from "./killer/code";
import { decodeMoreOrLess, type Mark } from "./moreOrLess/code";
import { decodeCells } from "./puzzleCode";
import type { PuzzleKind } from "./puzzles.types";
import { decodeTowers, type TowerClues } from "./towers/code";

export type NumberGivens = { cells: number[]; marks: Mark[]; regions: number[] | null; cages: Cage[] | null; clues: TowerClues | null };

/**
 * What a grid of numbers was dealt with, read from its givens: the printed
 * cells, and for More or Less its marks, a Jigsaw its regions, Sum Cages its
 * cages, Towers its clues — each kind writes them after the cells. The solve
 * screen and a finished puzzle's page read them the same way, here.
 */
export function readNumberGivens(kind: PuzzleKind, givens: string, size: number): NumberGivens {
  const plain = { marks: [], regions: null, cages: null, clues: null };
  if (kind === "moreOrLess") {
    const read = decodeMoreOrLess(givens, size);
    return { ...plain, cells: read?.cells ?? [], marks: read?.marks ?? [] };
  }
  if (kind === "sumCages") {
    const read = decodeKiller(givens, size);
    return { ...plain, cells: read?.cells ?? [], cages: read?.cages ?? null };
  }
  if (kind === "jigsaw") {
    const read = decodeJigsaw(givens, size);
    return { ...plain, cells: read?.cells ?? [], regions: read?.regions ?? null };
  }
  if (kind === "towers") {
    const read = decodeTowers(givens, size);
    return { ...plain, cells: read?.cells ?? [], clues: read?.clues ?? null };
  }
  return { ...plain, cells: decodeCells(givens, size) ?? [] };
}
