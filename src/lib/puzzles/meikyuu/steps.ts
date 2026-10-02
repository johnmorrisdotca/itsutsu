import type { Maze } from "@johnmorrisdotca/meikyuu";

/**
 * A LINE DRAWN THROUGH A MAZE, AS THE SITE KEEPS IT: one character a step, the
 * place of the cell stepped to among the neighbours of the cell stepped from
 * (`grid.neighbours`, in base 36), the first step leaving the start. A maze is
 * its recipe and the recipe rebuilds the same maze for ever (the package's
 * promise, held by its tests), so a line needs no more than that to be drawn
 * again: the longest on any level is 2,434 characters, and a line kept half way
 * is a prefix of one that is finished.
 *
 * Both a finished answer and a kept run are written so, and a reader decodes
 * them against the maze: a line that is not a path through it (a step into a
 * wall, one back onto the line) reads as null, and nothing is guessed.
 *
 * Nothing here imports the package at run time, only its types, so a page that
 * only reads or writes a line carries none of it; making a maze from a recipe
 * is `way.ts`.
 */
const STEP = /^[0-9a-z]*$/;

/** A line, cell by cell from the start, as its steps. Null if it is not a run of neighbours. */
export function encodeCells(maze: Maze, cells: readonly number[]): string | null {
  let out = "";
  for (let at = 1; at < cells.length; at += 1) {
    const place = maze.grid.neighbours[cells[at - 1]!]?.indexOf(cells[at]!) ?? -1;
    if (place < 0 || place >= 36) return null;
    out += place.toString(36);
  }
  return out;
}

/** The cells a code walks from the maze's start, or null if any step goes where the line cannot: into a wall, off the maze, or back onto the line. */
export function decodeWay(maze: Maze, code: string): number[] | null {
  if (!STEP.test(code)) return null;
  const cells = [maze.start];
  const seen = new Set(cells);
  for (const character of code) {
    const here = cells[cells.length - 1]!;
    const next = maze.grid.neighbours[here]?.[parseInt(character, 36)];
    if (next === undefined || seen.has(next) || !maze.links[here]!.includes(next)) return null;
    cells.push(next);
    seen.add(next);
  }
  return cells;
}

/** Whether text could be a line: its alphabet and no more steps than the most any level has. Read against its maze when opened (`decodeWay`). */
export function wayFits(code: string, most: number): boolean {
  return STEP.test(code) && code.length <= most;
}
