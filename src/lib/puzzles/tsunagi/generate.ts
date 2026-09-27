import { CELL_BLOCKED, CELL_BRIDGE, CELL_EMPTY, compareEdges, decodeLayout, edgeKey, encodeAnswer, encodeLayout, hexNeighbourTable, layoutCells, layoutNeighbours, layoutStep, type LinkLayout, LINK_HEX, LINK_WALLS, neighbourTable, PAIR_LETTERS, tailWord } from "./code.ts";
import { countSolutions } from "./solve.ts";
import { stepTable } from "./steps.ts";
import type { Random } from "../random.ts";

/**
 * MAKING TSUNAGI LEVELS: the way John described it on 2026-09-26 — fill
 * the grid with lines that never cross, keep each line's two ends as its
 * stones, rub the lines out, and keep only the layouts the solver proves have
 * exactly one answer.
 *
 * Only `scripts/tsunagi-levels.ts` calls this, on a desk. The levels it
 * makes are curated into the size files (`levels/size<n>.data.ts`) and those
 * are what the site plays; nothing a reader does ever runs it.
 *
 * Every line it draws is at least three cells long (two stones side by side
 * are a line with nothing to think about) and never runs beside itself, so
 * each answer reads as clean lines and the solver's "exactly one" is rarely
 * spoiled by a line that could shortcut through its own bend.
 */

/** One candidate: its layout and answer codes, and what the solver said about it. */
export type LinkCandidate = {
  layout: string;
  answer: string;
  pairs: number;
  /** Positions the solver looked at to prove the answer is the only one. */
  nodes: number;
  /** Positions where it had to try more than one way: how much guessing the level asks for. */
  branches: number;
  /** Turns in the answer's lines, over all of them: how much the lines wind. */
  turns: number;
  /** The layout in its one spelling over all eight turns and mirrors, so two levels are never the same board. */
  key: string;
};

const SHORTEST_LINE = 3;

/**
 * From which side a filling takes back lines rather than give up, and how many
 * times. Below 12×12 a stranded run ends the attempt, as it always has, so the
 * boards made there are the boards they always were; from 12×12 almost every
 * attempt strands one (5 good fillings in 20,000 at 12×12, none at 15×15, in
 * the spike of 2026-09-26), and taking back the last few lines and growing them
 * again is what makes a filling at all.
 */
const RETREAT_FROM = 12;
const RETREATS = 400;

/** How a blocked cell is marked while a grid is filled: an owner no line has. */
const BLOCKED_MARK = 32_000;

/** What a board has besides its lines: the cells no line enters, the bridges two lines cross, and the walls between cells. */
export type LinkExtras = { blocked?: ReadonlySet<number>; bridges?: ReadonlySet<number>; walls?: ReadonlySet<string>; waypoints?: ReadonlySet<number>; wrap?: boolean; hex?: boolean; sparse?: boolean };

/** Grid lines that fill every cell, as lists of cells; null when this attempt painted itself into a corner. */
export function randomFilling(size: number, random: Random, longest: number, blocked: ReadonlySet<number> = new Set(), wrap = false, hex = false): number[][] | null {
  const total = size * size;
  // On a board that wraps, the lines may run off one edge and on at the other.
  // On a board that wraps, the lines may run off one edge and on at the other; on a hexagon, a cell has six neighbours.
  const around = hex ? hexNeighbourTable(size) : wrap ? layoutNeighbours({ size, cells: [], ends: [], walls: new Set(), waypoints: new Map(), wrap: true, hex: false, sparse: false, strokes: null, explosions: null }) : neighbourTable(size);
  const owner = new Int16Array(total).fill(-1);
  // A blocked cell belongs to no line, ever: marked as one nothing can be.
  for (const cell of blocked) owner[cell] = BLOCKED_MARK;
  const paths: number[][] = [];
  let retreats = size >= RETREAT_FROM ? RETREATS : 0;
  const emptyAround = (at: number) => around[at]!.filter((next) => owner[next] === -1).length;
  // Whether `cell` can follow `tip` on line `id` without the line touching itself.
  const fits = (id: number, tip: number, cell: number) => owner[cell] === -1 && around[cell]!.every((next) => next === tip || owner[next] !== id);

  for (;;) {
    const empty: number[] = [];
    for (let at = 0; at < total; at += 1) if (owner[at] === -1) empty.push(at);
    if (empty.length === 0) break;
    // Start where the grid is tightest, so no cell is left stranded.
    const tightest = Math.min(...empty.map(emptyAround));
    const starts = empty.filter((at) => emptyAround(at) === tightest);
    const start = starts[Math.floor(random() * starts.length)]!;
    const id = paths.length;
    const path = [start];
    owner[start] = id;
    const want = SHORTEST_LINE + Math.floor(random() * (longest - SHORTEST_LINE + 1));
    while (path.length < want) {
      const tip = path[path.length - 1]!;
      const ways = around[tip]!.filter((next) => fits(id, tip, next));
      if (ways.length === 0) break;
      // Mostly the tightest way on (Warnsdorff's rule), sometimes any: winding lines that still fill.
      let pick: number;
      if (random() < 0.7) {
        const least = Math.min(...ways.map(emptyAround));
        const tight = ways.filter((next) => emptyAround(next) === least);
        pick = tight[Math.floor(random() * tight.length)]!;
      } else pick = ways[Math.floor(random() * ways.length)]!;
      owner[pick] = id;
      path.push(pick);
    }
    if (path.length >= SHORTEST_LINE) {
      paths.push(path);
      continue;
    }
    // Too short to be a line: hand its cells to a neighbouring line's end; else take back the last few lines and grow them again, or give up.
    for (const cell of path) owner[cell] = -1;
    if (absorb(path, paths, owner, around)) continue;
    if (retreats <= 0) return null;
    retreats -= 1;
    const back = Math.min(paths.length, 1 + Math.floor(random() * 3));
    for (let each = 0; each < back; each += 1) for (const cell of paths.pop()!) owner[cell] = -1;
  }
  return paths;
}

/** Joins a short run of cells onto the end of a line beside it, keeping every line clear of itself. */
function absorb(run: number[], paths: number[][], owner: Int16Array, around: number[][]): boolean {
  const orders = run.length === 1 ? [run] : [run, [...run].reverse()];
  for (const order of orders) {
    for (let id = 0; id < paths.length; id += 1) {
      for (const atEnd of [true, false]) {
        const line = atEnd ? paths[id]! : [...paths[id]!].reverse();
        const grown = [...line];
        const inLine = new Set(line);
        let ok = true;
        for (const cell of order) {
          const last = grown[grown.length - 1]!;
          if (!around[last]!.includes(cell) || around[cell]!.some((next) => next !== last && inLine.has(next))) {
            ok = false;
            break;
          }
          grown.push(cell);
          inLine.add(cell);
        }
        if (ok) {
          paths[id] = grown;
          for (const cell of order) owner[cell] = id;
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * The layout and answer the lines leave: their ends as stones, lettered in
 * reading order, with whatever else the board has — blocked cells, bridges
 * (in two lines' paths, drawn `+`) and walls.
 */
export function layoutOf(size: number, paths: readonly number[][], extras: LinkExtras = {}): { layout: string; answer: string } {
  const total = size * size;
  const byFirst = [...paths].map((path) => (path[0]! < path[path.length - 1]! ? path : [...path].reverse())).sort((a, b) => a[0]! - b[0]!);
  const cells = new Array<number>(total).fill(CELL_EMPTY);
  const owners = new Array<number>(total).fill(CELL_EMPTY);
  byFirst.forEach((path, pair) => {
    cells[path[0]!] = pair;
    cells[path[path.length - 1]!] = pair;
    for (const cell of path) owners[cell] = pair;
  });
  for (const cell of extras.blocked ?? []) cells[cell] = owners[cell] = CELL_BLOCKED;
  for (const cell of extras.bridges ?? []) cells[cell] = owners[cell] = CELL_BRIDGE;
  // A waypoint is kept for the pair whose line runs through it in the answer.
  const waypoints = new Map([...(extras.waypoints ?? [])].map((cell) => [cell, owners[cell]!] as const));
  // Relabel in reading order of first stone, which `byFirst`'s order already is.
  return { layout: encodeLayout(cells, extras.walls ?? [], { waypoints, wrap: extras.wrap, hex: extras.hex, sparse: extras.sparse }), answer: encodeAnswer(owners) };
}

/** Where cell `at` goes when a board is given `turn` quarter turns and then mirrored across the vertical when `mirror`. */
function movedTo(size: number, at: number, turn: number, mirror: boolean): number {
  let r = Math.floor(at / size);
  let c = at % size;
  for (let each = 0; each < turn; each += 1) [r, c] = [c, size - 1 - r];
  if (mirror) c = size - 1 - c;
  return r * size + c;
}

/** A layout code turned or mirrored: `turn` quarter turns, then a mirror across the vertical when `mirror`. Its walls turn with it. */
export function transformed(code: string, size: number, turn: number, mirror: boolean): string {
  const cells = layoutCells(code);
  const out = new Array<string>(size * size);
  for (let at = 0; at < size * size; at += 1) out[movedTo(size, at, turn, mirror)] = cells[at]!;
  // After the cells: the walls turn with the board; the tail's words (`wrap`, an explosion) are the same however it is turned.
  const tail = code.slice(cells.length).split(LINK_WALLS).filter(Boolean);
  const segments = tail.map((segment) =>
    tailWord(segment) !== null
      ? segment
      : segment
          .split(",")
          .map((edge) => {
            const [a, b] = edge.split("-").map(Number) as [number, number];
            return edgeKey(movedTo(size, a, turn, mirror), movedTo(size, b, turn, mirror));
          })
          .sort(compareEdges)
          .join(","),
  );
  return [out.join(""), ...segments].join(LINK_WALLS);
}

/** A code's letters renamed in reading order of first appearance: the one spelling of a layout or answer. */
export function relettered(code: string): string {
  const cells = layoutCells(code);
  const names = new Map<string, string>();
  // Stones first, in reading order; a waypoint takes the new name of its pair, wherever it stands.
  for (const char of cells) if (PAIR_LETTERS.includes(char) && !names.has(char)) names.set(char, PAIR_LETTERS[names.size]!);
  const renamed = [...cells]
    .map((char) => {
      if (PAIR_LETTERS.includes(char)) return names.get(char)!;
      const upper = char.toUpperCase();
      if (char !== upper && names.has(upper)) return names.get(upper)!.toLowerCase();
      return char;
    })
    .join("");
  return renamed + code.slice(cells.length);
}

/**
 * The least spelling of a layout over its eight turns and mirrors: equal keys
 * are the same board. A hexagon is only turned the ways that keep its lattice
 * — half round, and the two diagonal mirrors (a quarter turn then a mirror) —
 * since a quarter turn alone would make its slanting neighbours the wrong pair.
 */
export function symmetryKey(code: string, size: number): string {
  let least: string | null = null;
  const hex = code.slice(layoutCells(code).length).split(LINK_WALLS).includes(LINK_HEX);
  for (let turn = 0; turn < 4; turn += 1) {
    for (const mirror of [false, true]) {
      if (hex && (turn % 2 === 1) !== mirror) continue;
      const each = relettered(transformed(code, size, turn, mirror));
      if (least === null || each < least) least = each;
    }
  }
  return least!;
}

/** How many times an answer's lines turn a corner, over all of them: a line going straight over a bridge turns nowhere on it. */
export function turnsIn(answer: string, layout: LinkLayout): number {
  const steps = stepTable(layout);
  let turns = 0;
  for (let at = 0; at < layoutCells(answer).length; at += 1) {
    if (layout.cells[at] !== CELL_EMPTY) continue;
    // The ways this cell's line goes on from it, as steps: over a bridge, the way onto it; across a joined edge, the step it is.
    const ways = steps[at]!.filter((step) => answer[step.to] === answer[at]).map((step) => layoutStep(layout, at, step.over === -1 ? step.to : step.over));
    // Straight on is two opposite steps, on a square or a hexagon alike.
    if (ways.length === 2 && ways[0]! + ways[1]! !== 0) turns += 1;
  }
  return turns;
}

/**
 * One candidate level, or null: a filling, its layout, and the solver's
 * proof that the layout has exactly one answer — the filling's own. A layout
 * the solver cannot settle inside `budget` positions is dropped rather than
 * trusted.
 */
export function candidate(size: number, random: Random, longest: number, budget: number): LinkCandidate | null {
  const paths = randomFilling(size, random, longest);
  if (paths === null) return null;
  const { layout, answer } = layoutOf(size, paths);
  const decoded = decodeLayout(layout, size);
  if (decoded === null) return null;
  const solved = countSolutions(decoded, 2, budget);
  if (solved.gaveUp || solved.count !== 1) return null;
  if (encodeAnswer(solved.solution!) !== answer) return null;
  return {
    layout,
    answer,
    pairs: decoded.ends.length,
    nodes: solved.nodes,
    branches: solved.branches,
    turns: turnsIn(answer, decoded),
    key: symmetryKey(layout, size),
  };
}

/** How many times a board with two answers is mended before it is dropped. */
const REPAIR_ROUNDS = 30;

/** The lines with the one through `cell` cut in two there, each half a line of its own of at least three cells; null where no such cut is. */
function splitAt(paths: readonly number[][], cell: number): number[][] | null {
  const at = paths.findIndex((path) => path.includes(cell));
  const path = paths[at]!;
  const index = path.indexOf(cell);
  for (const cut of [index + 1, index]) {
    const [first, second] = [path.slice(0, cut), path.slice(cut)];
    if (first.length >= SHORTEST_LINE && second.length >= SHORTEST_LINE) return [...paths.slice(0, at), first, second, ...paths.slice(at + 1)];
  }
  return null;
}

/**
 * One candidate level made by MENDING rather than by luck, for boards too big
 * for luck (12×12): a filling whose layout has a second answer is mended where
 * the two answers differ — the line through a cell they disagree on is cut in
 * two there, which adds a pair of stones the second answer cannot honour — and
 * solved again, until it has exactly one answer, its own. The classic
 * Numberlink generator's move; in the 2026-09-26 spike it took 0.4 rounds on
 * average at 12×12 and doubled what luck alone made. Null when the solver
 * gives up, the lines pass `most`, or no cut can be made.
 */
export function repairedCandidate(size: number, random: Random, longest: number, budget: number, most: number): LinkCandidate | null {
  let paths = randomFilling(size, random, longest);
  if (paths === null) return null;
  for (let round = 0; round < REPAIR_ROUNDS; round += 1) {
    if (paths.length > most) return null;
    const { layout, answer } = layoutOf(size, paths);
    const decoded = decodeLayout(layout, size);
    if (decoded === null) return null;
    const solved = countSolutions(decoded, 2, budget);
    if (solved.gaveUp) return null;
    if (solved.count === 1) {
      if (encodeAnswer(solved.solution!) !== answer) return null;
      return { layout, answer, pairs: decoded.ends.length, nodes: solved.nodes, branches: solved.branches, turns: turnsIn(answer, decoded), key: symmetryKey(layout, size) };
    }
    const other = solved.solutions.map(encodeAnswer).find((each) => each !== answer);
    if (other === undefined) return null;
    const differ = [...other].flatMap((char, at) => (char !== answer[at] ? [at] : []));
    let mended: number[][] | null = null;
    for (let left = differ.length; left > 0 && mended === null; left -= 1) mended = splitAt(paths, differ.splice(Math.floor(random() * left), 1)[0]!);
    if (mended === null) return null;
    paths = mended;
  }
  return null;
}
