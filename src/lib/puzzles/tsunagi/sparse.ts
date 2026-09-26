import { decodeLayout, encodeAnswer, neighbourTable, sparseMost } from "./code.ts";
import { layoutOf, randomFilling, symmetryKey, turnsIn, type LinkCandidate } from "./generate.ts";
import { countSolutions } from "./solve.ts";
import type { Random } from "../random.ts";

/**
 * SPARSE BOARDS: the same size, fewer and longer lines. John, 2026-09-26: a
 * board harder without a new rule — "difficulty from distance". A board is
 * filled with lines as usual and proved to have one answer; then two lines
 * whose ends touch are joined into one, again and again, while the board keeps
 * exactly one answer, until no more than `sparseMost` are left. A joined line
 * never runs beside itself, so it is still one clean line.
 *
 * A sparse board says so (`sparse` after its cells), and a layout that says so
 * with more lines than `sparseMost` is not read at all: the word is a claim
 * about the board, checked, never a label that could be wrong.
 *
 * Imports carry their `.ts` so the level script can run this under plain node.
 */

/** Whether two lines can be joined end to end into one that never touches itself; the joined line, or null. */
function joined(a: readonly number[], b: readonly number[], around: readonly (readonly number[])[]): number[] | null {
  for (const first of [a, [...a].reverse()]) {
    for (const second of [b, [...b].reverse()]) {
      const end = first[first.length - 1]!;
      const start = second[0]!;
      if (!around[end]!.includes(start)) continue;
      // Clean: no cell of one next to a cell of the other, but at the join itself.
      const inSecond = new Set(second);
      const touches = first.some((cell, at) => around[cell]!.some((next) => inSecond.has(next) && !(at === first.length - 1 && next === start)));
      if (!touches) return [...first, ...second];
    }
  }
  return null;
}

/** Whether a layout made from these lines has exactly one answer, its own, inside `budget`. */
function unique(size: number, paths: readonly number[][], budget: number): { layout: string; answer: string; nodes: number; branches: number } | null {
  const made = layoutOf(size, paths, { sparse: false });
  const decoded = decodeLayout(made.layout, size);
  if (decoded === null) return null;
  const solved = countSolutions(decoded, 2, budget);
  if (solved.gaveUp || solved.count !== 1 || encodeAnswer(solved.solution!) !== made.answer) return null;
  return { ...made, nodes: solved.nodes, branches: solved.branches };
}

/**
 * One sparse candidate level, or null. From a filling proved to have one
 * answer, lines are joined one join at a time, in a random order, and a join is
 * kept only while the board still has exactly one answer — so what is left is
 * as few lines as this filling allows without a second answer creeping in. A
 * board that does not get down to `sparseMost` is dropped.
 */
export function sparseCandidate(size: number, random: Random, budget: number): LinkCandidate | null {
  const filled = randomFilling(size, random, size * size);
  if (filled === null || unique(size, filled, budget) === null) return null;
  const around = neighbourTable(size);
  let paths = filled.map((path) => [...path]);
  const most = sparseMost(size);
  for (let joining = true; joining && paths.length > most; ) {
    joining = false;
    const joins: { a: number; b: number; line: number[] }[] = [];
    for (let a = 0; a < paths.length; a += 1) {
      for (let b = a + 1; b < paths.length; b += 1) {
        const line = joined(paths[a]!, paths[b]!, around);
        if (line !== null) joins.push({ a, b, line });
      }
    }
    // Tried in a random order; the first that keeps one answer is kept.
    for (let left = joins.length; left > 0; left -= 1) {
      const pick = joins.splice(Math.floor(random() * left), 1)[0]!;
      const next = [...paths.filter((_, at) => at !== pick.a && at !== pick.b), pick.line];
      if (unique(size, next, budget) === null) continue;
      paths = next;
      joining = true;
      break;
    }
  }
  if (paths.length > most) return null;
  const made = layoutOf(size, paths, { sparse: true });
  const decoded = decodeLayout(made.layout, size);
  const proved = unique(size, paths, budget);
  if (decoded === null || proved === null) return null;
  return {
    layout: made.layout,
    answer: made.answer,
    pairs: decoded.ends.length,
    nodes: proved.nodes,
    branches: proved.branches,
    turns: turnsIn(made.answer, decoded),
    key: symmetryKey(made.layout, size),
  };
}
