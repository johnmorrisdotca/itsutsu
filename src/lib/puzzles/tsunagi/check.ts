import { CELL_BLOCKED, CELL_EMPTY, decodeLayout, LINK_BLOCKED, neighbourTable, PAIR_LETTERS } from "./code";
import { tsunagiLevelOf } from "./levels";
import type { PuzzleCheck } from "../puzzles.types";

/**
 * Whether an answer joins a Tsunagi level: the check the browser makes to say
 * "solved" and the server makes before it pays. O(cells), no search.
 *
 * The layout must be one of the site's levels (its size loaded first, by
 * `preparePuzzle`), so nobody is paid or ranked for a board they made up. The
 * answer must then carry every stone's letter on its stone, `#` on every
 * blocked cell, a letter on every other cell, and each letter's cells must be
 * one line from one of its stones to the other: the two stones with one
 * neighbour of their letter each, every cell between with two, all of them
 * joined. A line that ran beside itself would show a cell with three, and is
 * refused; no level's one answer does that, which the level test proves.
 */
export function checkTsunagi(size: number, givens: string, answer: string): PuzzleCheck {
  const layout = decodeLayout(givens, size);
  if (layout === null) return { ok: false, reason: "the givens are not a Tsunagi layout" };
  if (tsunagiLevelOf(size, givens) === null) return { ok: false, reason: "not one of the site's levels" };
  if (typeof answer !== "string" || answer.length !== size * size) return { ok: false, reason: "not a grid of that size" };
  const around = neighbourTable(size);
  const pairs = layout.ends.length;
  const owners: number[] = [];
  for (let at = 0; at < answer.length; at += 1) {
    const char = answer[at]!;
    const cell = layout.cells[at]!;
    if (cell === CELL_BLOCKED) {
      if (char !== LINK_BLOCKED) return { ok: false, reason: "a blocked cell is used" };
      owners.push(CELL_BLOCKED);
      continue;
    }
    const pair = PAIR_LETTERS.indexOf(char);
    if (pair === -1 || pair >= pairs) return { ok: false, reason: "a cell has no line through it" };
    if (cell !== CELL_EMPTY && cell !== pair) return { ok: false, reason: "a stone is moved" };
    owners.push(pair);
  }
  for (let pair = 0; pair < pairs; pair += 1) {
    const from: number = layout.ends[pair]![0];
    const to: number = layout.ends[pair]![1];
    const mine = owners.flatMap((owner, at) => (owner === pair ? [at] : []));
    for (const at of mine) {
      const same = around[at]!.filter((next) => owners[next] === pair).length;
      const want = at === from || at === to ? 1 : 2;
      if (same !== want) return { ok: false, reason: `line ${PAIR_LETTERS[pair]} is not one line` };
    }
    // Joined: walk from one stone and reach every cell of the line, ending on the other.
    const seen = new Set<number>([from]);
    const queue: number[] = [from];
    while (queue.length > 0) {
      const cell: number = queue.pop()!;
      for (const next of around[cell]!) {
        if (owners[next] === pair && !seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    if (!seen.has(to) || seen.size !== mine.length) return { ok: false, reason: `line ${PAIR_LETTERS[pair]} does not join its stones` };
  }
  return { ok: true };
}
