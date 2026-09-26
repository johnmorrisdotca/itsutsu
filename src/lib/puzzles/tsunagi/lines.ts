import { CELL_BLOCKED, CELL_EMPTY, encodeAnswer, type LinkLayout } from "./code";

/**
 * THE LINES A PLAYER HAS DRAWN, and what a press and a drag do to them.
 *
 * Pure, and the only place the drawing rules live: the grid reports where a
 * finger went, and this says what the lines are now. Each pair has one line,
 * an ordered list of cells starting at one of its stones; an empty list is no
 * line. Every function returns new lines and leaves the ones it was given
 * alone, the way the engine does.
 *
 *  - Press on a stone: a fresh line starts there, and the pair's old one goes.
 *    A press let go without moving is a tap, and clears the line.
 *  - Press on a line: it is cut back to that cell, and drawing goes on from it.
 *  - Drag into the next cell: the line grows. Back over itself: it shortens,
 *    cell by cell, as the finger goes. Into another pair's line: that line is
 *    cut back to before the cell, and this one goes through. Into another
 *    pair's stone, a blocked cell, or past its own far stone: nothing.
 */
export type Lines = readonly (readonly number[])[];

export function noLines(layout: LinkLayout): Lines {
  return layout.ends.map(() => []);
}

/** The pair whose line (or stone) holds each cell, `CELL_EMPTY` for none, `CELL_BLOCKED` where blocked. */
export function ownersOf(layout: LinkLayout, lines: Lines): number[] {
  const owners = layout.cells.map((cell) => (cell === CELL_BLOCKED ? CELL_BLOCKED : cell >= 0 ? cell : CELL_EMPTY));
  lines.forEach((line, pair) => line.forEach((cell) => (owners[cell] = pair)));
  return owners;
}

/** Whether a pair's line runs from one of its stones to the other. */
export function joined(layout: LinkLayout, lines: Lines, pair: number): boolean {
  const line = lines[pair]!;
  const [a, b] = layout.ends[pair]!;
  return line.length >= 2 && ((line[0] === a && line[line.length - 1] === b) || (line[0] === b && line[line.length - 1] === a));
}

/** Solved: every pair joined and every open cell on a line. */
export function allJoined(layout: LinkLayout, lines: Lines): boolean {
  if (!layout.ends.every((_, pair) => joined(layout, lines, pair))) return false;
  return ownersOf(layout, lines).every((owner) => owner !== CELL_EMPTY);
}

/** How many open cells have a line through them or a stone on them, and how many there are. */
export function filled(layout: LinkLayout, lines: Lines): { done: number; of: number } {
  const owners = ownersOf(layout, lines);
  const open = owners.filter((owner) => owner !== CELL_BLOCKED);
  const covered = new Set(lines.flat());
  layout.cells.forEach((cell, at) => cell >= 0 && covered.add(at));
  return { done: covered.size, of: open.length };
}

/** The answer the lines make, in the answer's spelling (`encodeAnswer`). */
export function answerOf(layout: LinkLayout, lines: Lines): string {
  return encodeAnswer(ownersOf(layout, lines));
}

function adjacent(size: number, a: number, b: number): boolean {
  const same = Math.floor(a / size) === Math.floor(b / size);
  return (same && Math.abs(a - b) === 1) || Math.abs(a - b) === size;
}

function replaced(lines: Lines, pair: number, line: readonly number[]): Lines {
  return lines.map((each, at) => (at === pair ? line : each));
}

/** A press: the lines after it, and the pair now being drawn, or null where the press draws nothing. */
export function pressAt(layout: LinkLayout, lines: Lines, cell: number): { lines: Lines; drawing: number | null } {
  const stone = layout.cells[cell]!;
  if (stone >= 0) return { lines: replaced(lines, stone, [cell]), drawing: stone };
  const pair = lines.findIndex((line) => line.includes(cell));
  if (pair === -1) return { lines, drawing: null };
  const line = lines[pair]!;
  return { lines: replaced(lines, pair, line.slice(0, line.indexOf(cell) + 1)), drawing: pair };
}

/** A drag of the pair being drawn into `cell`: one step, as the finger enters a cell. */
export function dragTo(layout: LinkLayout, lines: Lines, pair: number, cell: number): Lines {
  const line = lines[pair]!;
  if (line.length === 0) return lines;
  const tip = line[line.length - 1]!;
  if (cell === tip) return lines;
  const back = line.indexOf(cell);
  // Back over itself: shorter, to that cell.
  if (back !== -1) return replaced(lines, pair, line.slice(0, back + 1));
  if (!adjacent(layout.size, tip, cell)) return lines;
  // Past its own far stone: a joined line only shortens.
  if (line.length >= 2 && layout.cells[tip] === pair) return lines;
  const what = layout.cells[cell]!;
  if (what === CELL_BLOCKED || (what >= 0 && what !== pair)) return lines;
  let next = lines;
  const other = lines.findIndex((each, at) => at !== pair && each.includes(cell));
  if (other !== -1) {
    const cut = lines[other]!.slice(0, lines[other]!.indexOf(cell));
    next = replaced(next, other, cut.length <= 1 ? [] : cut);
  }
  return replaced(next, pair, [...line, cell]);
}

/**
 * A drag that jumped several cells between two pointer events (a quick
 * flick): walked one cell at a time along the row, then the column, so a fast
 * finger draws what a slow one would. Stops at the first cell a step refuses.
 */
export function dragThrough(layout: LinkLayout, lines: Lines, pair: number, cell: number): Lines {
  const size = layout.size;
  let now = lines;
  for (let guard = 0; guard < size * 2; guard += 1) {
    const line = now[pair]!;
    if (line.length === 0) return now;
    const tip = line[line.length - 1]!;
    if (tip === cell || line.includes(cell)) return dragTo(layout, now, pair, cell);
    const [tr, tc] = [Math.floor(tip / size), tip % size];
    const [cr, cc] = [Math.floor(cell / size), cell % size];
    const step = tc !== cc ? tip + Math.sign(cc - tc) : tip + Math.sign(cr - tr) * size;
    const after = dragTo(layout, now, pair, step);
    if (after === now) return now;
    now = after;
  }
  return now;
}

/** Letting go: a line of only its stone is no line (a tap on a stone clears it). */
export function letGo(lines: Lines): Lines {
  return lines.some((line) => line.length === 1) ? lines.map((line) => (line.length === 1 ? [] : line)) : lines;
}

/*
 * THE LINES AS A KEPT RUN'S PROGRESS: one character a cell, so an unfinished
 * level is kept like any other puzzle (`PuzzleRun.progress`). `.` is a cell no
 * line starts or passes through; `*` a stone a line starts from; `n`, `e`,
 * `s` or `w` a cell whose line came into it from that side.
 */
const FROM: Record<string, number> = { n: 0, e: 1, s: 2, w: 3 };
const PROGRESS_CHARS = /^[.*nesw]*$/;

export function encodeLines(layout: LinkLayout, lines: Lines): string {
  const size = layout.size;
  const out = new Array<string>(size * size).fill(".");
  for (const line of lines) {
    line.forEach((cell, at) => {
      if (at === 0) {
        out[cell] = "*";
        return;
      }
      const came = line[at - 1]!;
      out[cell] = came === cell - size ? "n" : came === cell + 1 ? "e" : came === cell + size ? "s" : "w";
    });
  }
  return out.join("");
}

/** Whether a progress code has the shape of one: a size's cells in the progress alphabet. */
export function linesCodeFits(code: string, size: number): boolean {
  return code.length === size * size && PROGRESS_CHARS.test(code);
}

/**
 * Lines read back from a progress code against the layout they were drawn on,
 * or null for a code that does not describe lines on it: a start that is not
 * a stone, a step from nowhere, a line through another pair's stone, a cell
 * two lines claim.
 */
export function decodeLines(layout: LinkLayout, code: string): Lines | null {
  const size = layout.size;
  if (!linesCodeFits(code, size)) return null;
  const next = new Map<number, number>();
  for (let cell = 0; cell < code.length; cell += 1) {
    const char = code[cell]!;
    if (char === "." || char === "*") continue;
    const dir = FROM[char]!;
    const came = [cell - size, cell + 1, cell + size, cell - 1][dir]!;
    if (came < 0 || came >= size * size || !adjacent(size, came, cell) || code[came] === "." || next.has(came)) return null;
    next.set(came, cell);
  }
  const lines: number[][] = layout.ends.map(() => []);
  const used = new Set<number>();
  for (let cell = 0; cell < code.length; cell += 1) {
    if (code[cell] !== "*") continue;
    const pair = layout.cells[cell]!;
    if (pair < 0 || lines[pair]!.length > 0) return null;
    const line = [cell];
    used.add(cell);
    let at = cell;
    while (next.has(at)) {
      at = next.get(at)!;
      const what = layout.cells[at]!;
      if (used.has(at) || what === CELL_BLOCKED || (what >= 0 && what !== pair)) return null;
      line.push(at);
      used.add(at);
      if (what === pair) break;
    }
    if (next.has(at) && layout.cells[at] === pair && line.length > 1) return null;
    lines[pair] = line.length === 1 ? [] : line;
  }
  // Every stepped cell must belong to some line.
  for (let cell = 0; cell < code.length; cell += 1) if (code[cell] !== "." && !used.has(cell)) return null;
  return lines;
}
