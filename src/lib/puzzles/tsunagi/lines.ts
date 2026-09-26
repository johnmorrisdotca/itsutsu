import { CELL_BLOCKED, CELL_BRIDGE, CELL_EMPTY, edgeOpen, encodeAnswer, PAIR_LETTERS, stepBetween, wrappedStep, type LinkLayout } from "./code";
import { stepTable } from "./steps";

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
 *    pair's stone, a blocked cell, across a wall, or past its own far stone:
 *    nothing.
 *  - Onto a bridge: only to go straight on (`steps.ts`); another line already
 *    going the same way over it is cut back, and a line never crosses itself.
 *    A bridge is in a line's list between the cells either side of it, and a
 *    line let go with its tip on a bridge ends before it. Pressing on a bridge
 *    draws nothing: two lines may be there.
 */
export type Lines = readonly (readonly number[])[];

export function noLines(layout: LinkLayout): Lines {
  return layout.ends.map(() => []);
}

/** The pair whose line (or stone) holds each cell, `CELL_EMPTY` for none, `CELL_BLOCKED` where blocked, `CELL_BRIDGE` on a bridge (two lines may be there). */
export function ownersOf(layout: LinkLayout, lines: Lines): number[] {
  const owners = layout.cells.map((cell) => (cell === CELL_BLOCKED || cell === CELL_BRIDGE ? cell : cell >= 0 ? cell : CELL_EMPTY));
  lines.forEach((line, pair) => line.forEach((cell) => owners[cell] !== CELL_BRIDGE && (owners[cell] = pair)));
  return owners;
}

/** The pair going over a bridge each way, or -1: across (left to right) and down. */
export function overBridge(lines: Lines, bridge: number): { across: number; down: number } {
  const out = { across: -1, down: -1 };
  lines.forEach((line, pair) => {
    const at = line.indexOf(bridge);
    if (at <= 0) return;
    if (Math.abs(bridge - line[at - 1]!) === 1) out.across = pair;
    else out.down = pair;
  });
  return out;
}

/** Whether a pair's line runs from one of its stones to the other. */
export function joined(layout: LinkLayout, lines: Lines, pair: number): boolean {
  const line = lines[pair]!;
  const [a, b] = layout.ends[pair]!;
  return line.length >= 2 && ((line[0] === a && line[line.length - 1] === b) || (line[0] === b && line[line.length - 1] === a));
}

/** Solved: every pair joined, every open cell on a line, and every bridge gone over both ways. */
export function allJoined(layout: LinkLayout, lines: Lines): boolean {
  if (!layout.ends.every((_, pair) => joined(layout, lines, pair))) return false;
  if (!ownersOf(layout, lines).every((owner) => owner !== CELL_EMPTY)) return false;
  return layout.cells.every((cell, at) => {
    if (cell !== CELL_BRIDGE) return true;
    const over = overBridge(lines, at);
    return over.across !== -1 && over.down !== -1;
  });
}

/**
 * The pairs not joined yet, for Check: every pair whose line does not run from
 * one of its marbles to the other — a line stopped beside its partner looks
 * joined and is not. Nothing about where any line should go.
 */
export function unjoinedPairs(layout: LinkLayout, lines: Lines): number[] {
  return layout.ends.map((_, pair) => pair).filter((pair) => !joined(layout, lines, pair));
}

/**
 * A level's answer drawn back as lines: each pair's cells, in order, from its
 * first marble to its second. How a solved level opens on its solved board.
 * Null for an answer that does not draw every pair as one unbroken line.
 */
export function linesOfAnswer(layout: LinkLayout, answer: string): Lines | null {
  const { size } = layout;
  if (answer.length !== size * size) return null;
  const steps = stepTable(layout);
  const out: number[][] = [];
  for (const [pair, [from, to]] of layout.ends.entries()) {
    const letter = PAIR_LETTERS[pair];
    const cells = [...answer].filter((char) => char === letter).length;
    // A search, not a walk: a line that runs beside itself leaves a cell two ways on. A bridge gone over is in the line between the cells either side of it.
    const line = [from];
    let counted = 1;
    const walk = (): boolean => {
      const at = line[line.length - 1]!;
      if (at === to) return counted === cells;
      for (const step of steps[at]!) {
        if (answer[step.to] !== letter || line.includes(step.to)) continue;
        if (step.over !== -1) line.push(step.over);
        line.push(step.to);
        counted += 1;
        if (walk()) return true;
        counted -= 1;
        line.pop();
        if (step.over !== -1) line.pop();
      }
      return false;
    };
    if (!walk()) return null;
    out.push(line);
  }
  return out;
}

/** How many open cells have a line through them or a stone on them, and how many there are: a bridge counts twice, once each way over it. */
export function filled(layout: LinkLayout, lines: Lines): { done: number; of: number } {
  const open = layout.cells.filter((cell) => cell !== CELL_BLOCKED && cell !== CELL_BRIDGE).length;
  const bridges = layout.cells.flatMap((cell, at) => (cell === CELL_BRIDGE ? [at] : []));
  const covered = new Set(lines.flat().filter((cell) => layout.cells[cell] !== CELL_BRIDGE));
  layout.cells.forEach((cell, at) => cell >= 0 && covered.add(at));
  const over = bridges.reduce((sum, bridge) => {
    const ways = overBridge(lines, bridge);
    return sum + (ways.across === -1 ? 0 : 1) + (ways.down === -1 ? 0 : 1);
  }, 0);
  return { done: covered.size + over, of: open + 2 * bridges.length };
}

/** The answer the lines make, in the answer's spelling (`encodeAnswer`). */
export function answerOf(layout: LinkLayout, lines: Lines): string {
  return encodeAnswer(ownersOf(layout, lines));
}

/** Neighbours with no wall between them: across a joined edge too, on a board that wraps. */
function stepOpen(layout: LinkLayout, a: number, b: number): boolean {
  return stepBetween(layout.size, a, b, layout.wrap) !== 0 && edgeOpen(layout, a, b);
}

function replaced(lines: Lines, pair: number, line: readonly number[]): Lines {
  return lines.map((each, at) => (at === pair ? line : each));
}

/** A press: the lines after it, and the pair now being drawn, or null where the press draws nothing. */
export function pressAt(layout: LinkLayout, lines: Lines, cell: number): { lines: Lines; drawing: number | null } {
  const stone = layout.cells[cell]!;
  if (stone === CELL_BRIDGE) return { lines, drawing: null };
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
  if (!stepOpen(layout, tip, cell)) return lines;
  // Past its own far stone: a joined line only shortens.
  if (line.length >= 2 && layout.cells[tip] === pair) return lines;
  // Off a bridge only straight on.
  if (layout.cells[tip] === CELL_BRIDGE && line.length >= 2 && cell - tip !== tip - line[line.length - 2]!) return lines;
  const what = layout.cells[cell]!;
  if (what === CELL_BLOCKED || (what >= 0 && what !== pair)) return lines;
  // A waypoint is its own pair's alone.
  const waypoint = layout.waypoints.get(cell);
  if (waypoint !== undefined && waypoint !== pair) return lines;
  if (what === CELL_BRIDGE) {
    const acrossNow = Math.abs(cell - tip) === 1;
    const over = overBridge(lines, cell);
    // Never over itself: the other way over is not this line's.
    if ((acrossNow ? over.down : over.across) === pair) return lines;
    const taken = acrossNow ? over.across : over.down;
    let next = lines;
    if (taken !== -1) {
      const cut = lines[taken]!.slice(0, lines[taken]!.indexOf(cell));
      next = replaced(next, taken, cut.length <= 1 ? [] : cut);
    }
    return replaced(next, pair, [...line, cell]);
  }
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
    // Already there, or one step away (across a joined edge counts): straight to it.
    if (tip === cell || line.includes(cell) || stepBetween(size, tip, cell, layout.wrap) !== 0) return dragTo(layout, now, pair, cell);
    const [tr, tc] = [Math.floor(tip / size), tip % size];
    const [cr, cc] = [Math.floor(cell / size), cell % size];
    const step = tc !== cc ? tip + Math.sign(cc - tc) : tip + Math.sign(cr - tr) * size;
    const after = dragTo(layout, now, pair, step);
    if (after === now) return now;
    now = after;
  }
  return now;
}

/** Letting go: a line of only its stone is no line (a tap on a stone clears it), and a line ends before a bridge it stopped on. */
export function letGo(lines: Lines, layout?: LinkLayout): Lines {
  const onBridge = (line: readonly number[]) => layout !== undefined && line.length > 0 && layout.cells[line[line.length - 1]!] === CELL_BRIDGE;
  if (!lines.some((line) => line.length === 1 || onBridge(line))) return lines;
  return lines.map((line) => {
    const kept = onBridge(line) ? line.slice(0, -1) : line;
    return kept.length === 1 ? [] : kept;
  });
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
      // A bridge is written by the cell beyond it, which says it came from the bridge's side.
      if (layout.cells[cell] === CELL_BRIDGE) return;
      if (at === 0) {
        out[cell] = "*";
        return;
      }
      const came = line[at - 1]!;
      // Which side it came in from, across a joined edge too: the step from here back to where it came from.
      const by = stepBetween(size, cell, came, layout.wrap);
      out[cell] = by === -size ? "n" : by === 1 ? "e" : by === size ? "s" : "w";
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
    const by = [-size, 1, size, -1][dir]!;
    let came = layout.wrap ? wrappedStep(size, cell, by) : cell + by;
    if (came < 0 || came >= size * size || stepBetween(size, cell, came, layout.wrap) === 0) return null;
    // From a bridge: from the cell on its far side, over it.
    if (layout.cells[came] === CELL_BRIDGE) came = came - (cell - came);
    if (came < 0 || came >= size * size || code[came] === "." || next.has(came)) return null;
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
      const after = next.get(at)!;
      // Two cells apart: the bridge between them is in the line.
      if (stepBetween(size, at, after, layout.wrap) === 0) {
        const bridge = (at + after) / 2;
        if (layout.cells[bridge] !== CELL_BRIDGE) return null;
        line.push(bridge);
      }
      at = after;
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
