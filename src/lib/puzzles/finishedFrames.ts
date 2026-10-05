import { decodeBlackAndWhite } from "./blackAndWhite/code";
import { boardOf, decodeBridges } from "./bridges/code";
import { decodeRegions, decodeStones } from "./hiddenStones/code";
import { decodeCells as decodePictureCells, decodePicture } from "./pictureLogic/code";
import type { CellState } from "./pictureLogic/pictureLogic.types";
import { readNumberGivens, type NumberGivens } from "./numberGivens";
import { jiraiFits, jiraiRecipeOf } from "./jirai/board";
import { pencilEngine } from "./pencil/engines";
import { isPencilKind } from "./pencil/pencil.constants";
import type { PencilKind } from "./pencil/pencil.types";
import { decodeCells } from "./puzzleCode";
import { decodeBlackAndWhiteProgress, decodeNumberProgress, decodeStoneProgress, type StoneMarkCode } from "./puzzleProgress";
import type { PuzzleKind } from "./puzzles.types";
import { decodeStepLog } from "./stepLog";

/**
 * ONE GRID OF A FINISHED PUZZLE, AS IT STOOD AT ONE STEP, in the shape its
 * kind's board draws: a number grid's entries (givens left empty, as the solve
 * screen holds them), a Hidden Stones grid's marks, a Black and White grid's
 * stones, printed ones included.
 */
export type Frame =
  | { kind: "numbers"; asked: NumberGivens; cells: number[] }
  | { kind: "stones"; regions: number[]; cells: StoneMarkCode[] }
  | { kind: "blackAndWhite"; printed: number[]; cells: number[] }
  | { kind: "bridges"; givens: string; cells: string[] }
  | { kind: "pictureLogic"; givens: string; cells: CellState[] }
  | { kind: "pencil"; pencil: PencilKind; givens: string; cells: string[] }
  | { kind: "jirai"; givens: string; cells: string[] };

export type FinishedFrames = {
  /** The grid as dealt, and as it ended where the answer reads: what a page draws with no steps. */
  dealt: { start: Frame; finished: Frame | null };
  /** Every grid on the way, from the first kept to the answer; null where no steps were kept or they do not read. */
  frames: Frame[] | null;
};

/**
 * THE STEPS OF A FINISHED GRID, READ FOR ITS REPLAY. The log (`stepLog.ts`)
 * is what the solve screen kept, and it ends one entry short of the answer,
 * because the last entry is the one that finished the puzzle and the answer is
 * sent in its place — so the answer is laid over the last step as the final
 * one. For Hidden Stones that keeps the crosses the solver had drawn, and
 * places the stones where the answer has them.
 *
 * Pure, and the same in the server's render and the browser's.
 */
export function finishedFrames(kind: PuzzleKind, size: number, givens: string, answer: string | null, steps: string | null): FinishedFrames {
  const cells = size * size;
  if (kind === "hiddenStones") {
    const regions = decodeRegions(givens, size) ?? [];
    const frame = (marks: StoneMarkCode[]): Frame => ({ kind: "stones", regions, cells: marks });
    const start = frame(new Array<StoneMarkCode>(cells).fill(""));
    const stones = answer === null ? null : decodeStones(answer, size);
    const ending = (before: readonly StoneMarkCode[]): Frame | null => {
      if (stones === null) return null;
      const marks = before.map((mark): StoneMarkCode => (mark === "cross" ? "cross" : ""));
      stones.forEach((col, row) => (marks[row * size + col] = "stone"));
      return frame(marks);
    };
    const kept = readSteps(steps, cells, (code) => decodeStoneProgress(code, size));
    return assemble(start, ending(start.cells as StoneMarkCode[]), kept?.map(frame) ?? null, (last) => ending(last.cells as StoneMarkCode[]));
  }

  if (kind === "blackAndWhite") {
    const printed = decodeBlackAndWhite(givens.slice(0, cells), size) ?? new Array<number>(cells).fill(0);
    const frame = (stones: number[]): Frame => ({ kind: "blackAndWhite", printed, cells: stones });
    const solved = answer === null ? null : decodeBlackAndWhite(answer, size);
    const finished = solved === null ? null : frame(solved);
    const kept = readSteps(steps, cells, (code) => decodeBlackAndWhiteProgress(code, size));
    return assemble(frame([...printed]), finished, kept?.map(frame) ?? null, () => finished);
  }

  if (kind === "bridges") {
    // A drawing, a character a cell (`bridges/code.ts`): read only where it is one of this board's.
    const board = boardOf(givens, size);
    const drawing = (code: string): string[] | null => (board !== null && decodeBridges(board, code) !== null ? [...code] : null);
    const frame = (cells: string[]): Frame => ({ kind: "bridges", givens, cells });
    const solved = answer === null ? null : drawing(answer);
    const finished = solved === null ? null : frame(solved);
    const kept = readSteps(steps, cells, drawing);
    return assemble(frame([...givens]), finished, kept?.map(frame) ?? null, () => finished);
  }

  if (kind === "pictureLogic") {
    // The player's grid, a character a cell; the answer drawn as the clean picture, shaded and nothing else.
    const frame = (states: CellState[]): Frame => ({ kind: "pictureLogic", givens, cells: states });
    const picture = answer === null ? null : decodePicture(answer, size);
    const finished = picture === null ? null : frame(picture.map((shaded): CellState => (shaded ? 1 : 0)));
    const kept = readSteps(steps, cells, (code) => decodePictureCells(code, size));
    return assemble(frame(new Array<CellState>(cells).fill(0)), finished, kept?.map(frame) ?? null, () => finished);
  }

  if (isPencilKind(kind)) {
    // What was written on the board, a character a mark place (`pencil/`): read only where it is one this kind could have written.
    const engine = pencilEngine(kind);
    const written = (code: string): string | null => (engine.fits(size, code) ? code : null);
    const frame = (code: string): Frame => ({ kind: "pencil", pencil: kind, givens, cells: [...code] });
    const solved = answer === null ? null : written(answer);
    const finished = solved === null ? null : frame(solved);
    const kept = readSteps(steps, engine.codeLength(size), written);
    return assemble(frame(engine.blank(size, givens)), finished, kept?.map(frame) ?? null, () => finished);
  }

  if (kind === "jirai") {
    // What was on the board, a character a square (`jirai/board.ts`): the opening as dealt, and each grid on the way.
    const recipe = jiraiRecipeOf(size, givens);
    const written = (code: string): string | null => (recipe !== null && code.length === recipe.cells.length && jiraiFits(size, code) ? code : null);
    const frame = (code: string): Frame => ({ kind: "jirai", givens, cells: [...code] });
    const solved = answer === null ? null : written(answer);
    const finished = solved === null ? null : frame(solved);
    const kept = readSteps(steps, size * size, written);
    return assemble(frame(recipe?.cells ?? ".".repeat(cells)), finished, kept?.map(frame) ?? null, () => finished);
  }

  const asked = readNumberGivens(kind, givens, size);
  const frame = (entries: number[]): Frame => ({ kind: "numbers", asked, cells: entries });
  const full = answer === null ? null : decodeCells(answer, size);
  // The entries the answer means: every cell the puzzle did not print.
  const finished = full === null ? null : frame(asked.cells.map((given, index) => (given !== 0 ? 0 : (full[index] ?? 0))));
  const kept = readSteps(steps, cells, (code) => decodeNumberProgress(code, size));
  return assemble(frame(new Array<number>(cells).fill(0)), finished, kept?.map(frame) ?? null, () => finished);
}

/** The grids a log holds, each read by the kind's decoder, or null when any of them does not read. */
function readSteps<T>(steps: string | null, cells: number, decode: (code: string) => T | null): T[] | null {
  if (steps === null) return null;
  const codes = decodeStepLog(steps, cells);
  if (codes === null) return null;
  const grids = codes.map(decode);
  return grids.every((grid) => grid !== null) ? (grids as T[]) : null;
}

function assemble(start: Frame, finished: Frame | null, kept: Frame[] | null, ending: (last: Frame) => Frame | null): FinishedFrames {
  if (kept === null || kept.length === 0) return { dealt: { start, finished }, frames: null };
  const last = kept.at(-1)!;
  const end = ending(last);
  const frames = end === null || same(end, last) ? kept : [...kept, end];
  return { dealt: { start, finished }, frames };
}

function same(a: Frame, b: Frame): boolean {
  return a.cells.length === b.cells.length && a.cells.every((cell, index) => cell === b.cells[index]);
}
