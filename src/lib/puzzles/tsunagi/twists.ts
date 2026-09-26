import { decodeLayout, edgeKey, encodeAnswer, stepBetween, type LinkLayout } from "./code.ts";
import { layoutOf, randomFilling, symmetryKey, turnsIn, type LinkCandidate } from "./generate.ts";
import { countSolutions } from "./solve.ts";
import { stepTable } from "./steps.ts";
import type { Random } from "../random.ts";

/**
 * MAKING TSUNAGI'S TWISTS, on a desk: boards with bridges, and boards with
 * walls and blocked cells (John, 2026-09-26, both chosen from the brainstorm;
 * bridges first). Like `generate.ts`, only the level script calls this, and a
 * board is kept only when the solver proves it has exactly one answer — the one
 * it was made from.
 *
 * BRIDGES. A grid is filled with lines as for a plain board. Then, where a
 * line runs straight through a cell away from the edge and two other lines each
 * end on the cells either side of it the other way, those two are joined into
 * one line over the cell, which becomes a bridge: the first line goes over it
 * one way, the joined one the other. Repeated for as many bridges as asked,
 * never two side by side.
 *
 * WALLS AND BLOCKED CELLS. A few cells are blocked before the grid is filled,
 * so the lines go round them. Where the board then has more than one answer,
 * walls are put on edges between two different lines — never across an edge
 * the answer uses, so its answer stands — until it has one, and then every
 * wall that is not needed for that is taken away again. What is left is walls
 * a player has to use to find the answer.
 */

export type TwistCandidate = LinkCandidate & {
  bridges: number;
  walls: number;
  blocked: number;
};

/** A candidate from a layout and its answer, if the solver finds exactly that answer and no other inside `budget`. */
function proved(layout: string, answer: string, size: number, budget: number, extras: { bridges: number; walls: number; blocked: number }): TwistCandidate | null {
  const decoded = decodeLayout(layout, size);
  if (decoded === null || !runsClear(decoded, answer)) return null;
  const solved = countSolutions(decoded, 2, budget);
  if (solved.gaveUp || solved.count !== 1 || encodeAnswer(solved.solution!) !== answer) return null;
  return {
    layout,
    answer,
    pairs: decoded.ends.length,
    nodes: solved.nodes,
    branches: solved.branches,
    turns: turnsIn(answer, decoded),
    key: symmetryKey(layout, size),
    ...extras,
  };
}

/**
 * Whether every line of an answer is one clean line: its two stones with one
 * step to a cell of their own letter, every other cell with two. A line that
 * ran beside itself would show three, and the check the site makes on a solve
 * (`check.ts`) would refuse the level's own answer.
 */
function runsClear(layout: LinkLayout, answer: string): boolean {
  const steps = stepTable(layout);
  for (let at = 0; at < layout.size * layout.size; at += 1) {
    const letter = answer[at]!;
    if (letter === "." || letter === "#" || letter === "+") continue;
    const same = steps[at]!.filter((step) => answer[step.to] === letter).length;
    if (same !== (layout.cells[at]! >= 0 ? 1 : 2)) return false;
  }
  return true;
}

/** A filled grid with `want` bridges made in it — its lines, one of them over each bridge — or null where it offers no place for them. */
function bridgedFilling(size: number, random: Random, longest: number, want: number): { paths: number[][]; bridges: Set<number> } | null {
  const filling = randomFilling(size, random, longest);
  if (filling === null) return null;
  let paths = filling.map((path) => [...path]);
  const bridges = new Set<number>();
  for (let made = 0; made < want; made += 1) {
    const places: { cell: number; ends: [number, number]; by: number }[] = [];
    paths.forEach((path, over) => {
      for (let at = 1; at < path.length - 1; at += 1) {
        const cell = path[at]!;
        const row = Math.floor(cell / size);
        const col = cell % size;
        if (row === 0 || col === 0 || row === size - 1 || col === size - 1 || bridges.has(cell)) continue;
        if ([cell - 1, cell + 1, cell - size, cell + size].some((next) => bridges.has(next))) continue;
        const by = path[at + 1]! - cell;
        // Straight through, and the two cells the other way each the end of a different line.
        if (path[at - 1]! !== cell - by) continue;
        const cross = Math.abs(by) === 1 ? size : 1;
        const endOf = (target: number) => paths.findIndex((each, id) => id !== over && (each[0] === target || each[each.length - 1] === target));
        const a = endOf(cell - cross);
        const b = endOf(cell + cross);
        if (a === -1 || b === -1 || a === b) continue;
        places.push({ cell, ends: [a, b], by: cross });
      }
    });
    if (places.length === 0) return null;
    const place = places[Math.floor(random() * places.length)]!;
    const [a, b] = place.ends;
    const first = paths[a]![paths[a]!.length - 1] === place.cell - place.by ? paths[a]! : [...paths[a]!].reverse();
    const second = paths[b]![0] === place.cell + place.by ? paths[b]! : [...paths[b]!].reverse();
    const joined = [...first, place.cell, ...second];
    paths = paths.filter((_, id) => id !== a && id !== b);
    paths.push(joined);
    bridges.add(place.cell);
  }
  return { paths, bridges };
}

/** A board with `want` bridges, or null where this filling offers no place for them or the board has more than one answer. */
export function bridgeCandidate(size: number, random: Random, longest: number, budget: number, want: number): TwistCandidate | null {
  const made = bridgedFilling(size, random, longest, want);
  if (made === null) return null;
  const { layout, answer } = layoutOf(size, made.paths, { bridges: made.bridges });
  return proved(layout, answer, size, budget, { bridges: made.bridges.size, walls: 0, blocked: 0 });
}

/**
 * The walls a filled board needs to have one answer, at most `mostWalls`: put
 * on edges between two different lines (never one the answer uses, never
 * beside a bridge) until it is unique, then each taken away again where it is
 * not needed. Null where `mostWalls` is not enough.
 */
function wallsNeeded(decoded: LinkLayout, answer: string, random: Random, budget: number, mostWalls: number): Set<string> | null {
  const { size } = decoded;
  const free: string[] = [];
  for (let at = 0; at < size * size; at += 1) {
    for (const next of [at + 1, at + size]) {
      if (next >= size * size || (next === at + 1 && next % size === 0)) continue;
      if ("#+.".includes(answer[at]!) || "#+.".includes(answer[next]!) || answer[at] === answer[next]) continue;
      free.push(edgeKey(at, next));
    }
  }
  const unique = (walls: ReadonlySet<string>) => {
    const counted = countSolutions({ ...decoded, walls }, 2, budget);
    return !counted.gaveUp && counted.count === 1;
  };
  let walls = new Set<string>();
  const order = free.map((edge) => [random(), edge] as const).sort((x, y) => x[0] - y[0]).map(([, edge]) => edge);
  for (const edge of order) {
    if (unique(walls)) break;
    if (walls.size >= mostWalls) return null;
    walls.add(edge);
  }
  if (!unique(walls)) return null;
  for (const edge of [...walls]) {
    const without = new Set([...walls].filter((each) => each !== edge));
    if (unique(without)) walls = without;
  }
  return walls;
}

/** A board with `blockedWanted` blocked cells and as many walls as it needs (at most `mostWalls`) to have one answer, or null. */
export function wallCandidate(size: number, random: Random, longest: number, budget: number, blockedWanted: number, mostWalls: number): TwistCandidate | null {
  const blocked = new Set<number>();
  while (blocked.size < blockedWanted) blocked.add(Math.floor(random() * size * size));
  const filling = randomFilling(size, random, longest, blocked);
  if (filling === null) return null;
  const { layout: plain, answer } = layoutOf(size, filling, { blocked });
  const decoded = decodeLayout(plain, size);
  if (decoded === null) return null;
  const walls = wallsNeeded(decoded, answer, random, budget, mostWalls);
  if (walls === null || (walls.size === 0 && blocked.size === 0)) return null;
  const { layout } = layoutOf(size, filling, { blocked, walls });
  return proved(layout, answer, size, budget, { bridges: 0, walls: walls.size, blocked: blocked.size });
}

/** A board with bridges and the walls it needs besides: both twists at once, for the blocks after both are taught. */
export function bridgeAndWallCandidate(size: number, random: Random, longest: number, budget: number, bridgesWanted: number, mostWalls: number): TwistCandidate | null {
  const made = bridgedFilling(size, random, longest, bridgesWanted);
  if (made === null) return null;
  const { layout: plain, answer } = layoutOf(size, made.paths, { bridges: made.bridges });
  const decoded = decodeLayout(plain, size);
  if (decoded === null || !runsClear(decoded, answer)) return null;
  const walls = wallsNeeded(decoded, answer, random, budget, mostWalls);
  if (walls === null || walls.size === 0) return null;
  const { layout } = layoutOf(size, made.paths, { bridges: made.bridges, walls });
  return proved(layout, answer, size, budget, { bridges: made.bridges.size, walls: walls.size, blocked: 0 });
}

/**
 * WAYPOINTS. A plain filling whose layout has more than one answer, given
 * waypoints — cells in the middle of the answer's lines, each kept for the line
 * through it — until it has one, and then each taken away again where it is not
 * needed: every waypoint left is one a player has to use. At most `most`.
 */
export function waypointCandidate(size: number, random: Random, longest: number, budget: number, most: number): TwistCandidate | null {
  const filling = randomFilling(size, random, longest);
  if (filling === null) return null;
  const middles = filling.flatMap((path) => path.slice(1, -1));
  if (middles.length === 0) return null;
  const unique = (marked: ReadonlySet<number>) => {
    const { layout } = layoutOf(size, filling, { waypoints: marked });
    const decoded = decodeLayout(layout, size);
    if (decoded === null) return false;
    const counted = countSolutions(decoded, 2, budget);
    return !counted.gaveUp && counted.count === 1;
  };
  // A layout already unique without one teaches nothing about waypoints.
  if (unique(new Set())) return null;
  let marked = new Set<number>();
  const order = middles.map((cell) => [random(), cell] as const).sort((x, y) => x[0] - y[0]).map(([, cell]) => cell);
  for (const cell of order) {
    if (unique(marked)) break;
    if (marked.size >= most) return null;
    marked.add(cell);
  }
  if (!unique(marked)) return null;
  for (const cell of [...marked]) {
    const without = new Set([...marked].filter((each) => each !== cell));
    if (unique(without)) marked = without;
  }
  if (marked.size === 0) return null;
  const { layout, answer } = layoutOf(size, filling, { waypoints: marked });
  return proved(layout, answer, size, budget, { bridges: 0, walls: 0, blocked: 0 });
}

/**
 * WRAP. A grid filled on a torus — a line may run off one edge and on at the
 * other — kept only where at least one line of the answer does, so the wrap is
 * a thing the board asks for, and only with exactly one answer under the wrap
 * rules.
 */
export function wrapCandidate(size: number, random: Random, longest: number, budget: number): TwistCandidate | null {
  const filling = randomFilling(size, random, longest, new Set(), true);
  if (filling === null) return null;
  const crosses = filling.some((path) => path.some((cell, at) => at > 0 && stepBetween(size, path[at - 1]!, cell, false) === 0));
  if (!crosses) return null;
  const { layout, answer } = layoutOf(size, filling, { wrap: true });
  return proved(layout, answer, size, budget, { bridges: 0, walls: 0, blocked: 0 });
}
