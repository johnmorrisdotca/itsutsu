import type { PuzzleLevel } from "../puzzles.types";
import { slideLine, wholeLine } from "./lines";
import type { CellState, LineRule, PictureClues } from "./pictureLogic.types";

/**
 * SOLVING PICTURE LOGIC AS A PERSON DOES, and so proving there is one answer.
 *
 * Every step here is forced: a cell is shaded or emptied only when the clues
 * leave it no other way. So when the steps fill the whole grid, that grid is
 * the only one the clues allow — the picture the puzzle was made from, and no
 * other. That is the uniqueness proof: no search for a second answer is
 * needed, because a solve that never guesses cannot have taken a wrong turn.
 * A grid the steps cannot finish is not offered as a puzzle.
 *
 * The level is the least a solve needed to finish (`levelOf`):
 *
 * - EASY: the ends alone (`slideLine`), row after column after row.
 * - MEDIUM: somewhere the ends run out and a whole line has to be read —
 *   every way its runs could still lie, against what the crossing lines have
 *   already settled (`wholeLine`).
 * - HARD: somewhere even that runs out, and a cell has to be tried: shade it
 *   (or empty it), follow the lines, and when a clue breaks the cell is the
 *   other thing. One cell at a time, one step deep — a limited trial, never a
 *   search.
 */

/** A grid being solved: 0 unknown, 1 shaded, 2 empty, row by row. */
export type Grid = CellState[];

function lineCells(grid: Grid, size: number, line: number): number[] {
  return line < size
    ? Array.from({ length: size }, (_, col) => line * size + col)
    : Array.from({ length: size }, (_, row) => row * size + (line - size));
}

/**
 * Every line read with `rule` until none has anything more to say. The grid
 * is written in place. False when a line has no way left to lie: the grid
 * contradicts its clues.
 */
export function settle(grid: Grid, clues: PictureClues, rule: LineRule, dirty?: Set<number>): boolean {
  const { size } = clues;
  const read = rule === "ends" ? slideLine : wholeLine;
  const waiting = dirty ?? new Set(Array.from({ length: 2 * size }, (_, line) => line));
  while (waiting.size > 0) {
    const line = waiting.values().next().value!;
    waiting.delete(line);
    const at = lineCells(grid, size, line);
    const clue = line < size ? clues.rows[line]! : clues.cols[line - size]!;
    const next = read(clue, at.map((cell) => grid[cell]!));
    if (next === null) return false;
    next.forEach((state, index) => {
      const cell = at[index]!;
      if (grid[cell] === state) return;
      grid[cell] = state;
      // The line across this one learnt something.
      waiting.add(line < size ? size + (cell % size) : Math.floor(cell / size));
    });
  }
  return true;
}

function linesThrough(cell: number, size: number): Set<number> {
  return new Set([Math.floor(cell / size), size + (cell % size)]);
}

/**
 * One round of trials: each unknown cell shaded, and then emptied, on a copy,
 * with the whole-line rule followed to its end; where one breaks a clue, the
 * cell is the other on the real grid, which then settles again. True when a
 * trial settled anything. False on a contradiction on the real grid, which a
 * puzzle made from a picture never has.
 */
function trialRound(grid: Grid, clues: PictureClues): { progressed: boolean; broken: boolean } {
  const { size } = clues;
  let progressed = false;
  for (let cell = 0; cell < grid.length; cell += 1) {
    if (grid[cell] !== 0) continue;
    for (const guess of [1, 2] as const) {
      const trial = [...grid];
      trial[cell] = guess;
      if (settle(trial, clues, "whole", linesThrough(cell, size))) continue;
      grid[cell] = guess === 1 ? 2 : 1;
      progressed = true;
      if (!settle(grid, clues, "whole", linesThrough(cell, size))) return { progressed, broken: true };
      break;
    }
  }
  return { progressed, broken: false };
}

const solved = (grid: Grid) => grid.every((cell) => cell !== 0);

/**
 * What a solve needs to finish these clues, and the grid it finishes with: the
 * least level that does it, or null when even trials leave cells unknown —
 * more than one answer, or one only a search would find. Never a guess.
 */
export function solveClues(clues: PictureClues): { level: PuzzleLevel; grid: Grid } | null {
  const grid: Grid = new Array(clues.size * clues.size).fill(0);
  if (!settle(grid, clues, "ends")) return null;
  if (solved(grid)) return { level: "easy", grid };
  if (!settle(grid, clues, "whole")) return null;
  if (solved(grid)) return { level: "medium", grid };
  for (;;) {
    const { progressed, broken } = trialRound(grid, clues);
    if (broken) return null;
    if (solved(grid)) return { level: "hard", grid };
    if (!progressed) return null;
  }
}

/** The level these clues are, or null when they are not a puzzle this site offers. */
export function levelOf(clues: PictureClues): PuzzleLevel | null {
  return solveClues(clues)?.level ?? null;
}

/** The one picture these clues draw, shaded true, or null when the steps cannot prove there is one. */
export function solutionOf(clues: PictureClues): boolean[] | null {
  const found = solveClues(clues);
  return found === null ? null : found.grid.map((cell) => cell === 1);
}
