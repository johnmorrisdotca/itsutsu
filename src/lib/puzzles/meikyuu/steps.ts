import type { MazeCore } from "@johnmorrisdotca/meikyuu";

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
export function encodeCells(maze: MazeCore, cells: readonly number[]): string | null {
  let out = "";
  for (let at = 1; at < cells.length; at += 1) {
    const place = maze.grid.neighbours[cells[at - 1]!]?.indexOf(cells[at]!) ?? -1;
    if (place < 0 || place >= 36) return null;
    out += place.toString(36);
  }
  return out;
}

/** The cells a code walks from the maze's start, or null if any step goes where the line cannot: into a wall, off the maze, or back onto the line. */
export function decodeWay(maze: MazeCore, code: string): number[] | null {
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

/**
 * A RUN KEPT HALF WAY: the line as its steps, and, if stones are down, a `~` and the cells they lie on in base 36 joined by dots
 * (`0231~1a.2f`: the package's `encodeRun`). The stones are the player's own helper and never part of the answer, so what is handed in is
 * the steps alone (`wayOfRun`) and a run with a `~` is no answer (`decodeWay` refuses it). Read against its maze when opened (`mount.restore`).
 */
const STONES = /^[0-9a-z]+(\.[0-9a-z]+)*$/;

/** The steps of a kept run, without its stones. */
export function wayOfRun(run: string): string {
  const at = run.indexOf("~");
  return at < 0 ? run : run.slice(0, at);
}

/** Whether text could be a kept run: steps no longer than `most`, and stones in their alphabet, no more than `mostStones` characters of them. */
export function runFits(run: string, most: number, mostStones: number): boolean {
  const at = run.indexOf("~");
  if (at < 0) return wayFits(run, most);
  const stones = run.slice(at + 1);
  return wayFits(run.slice(0, at), most) && stones.length <= mostStones && STONES.test(stones);
}
