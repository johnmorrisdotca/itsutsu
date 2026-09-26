import { CELL_BLOCKED, CELL_BRIDGE, CELL_EMPTY, decodeLayout, LINK_BLOCKED, LINK_BRIDGE, PAIR_LETTERS } from "./code";
import { tsunagiLevelOf } from "./levels";
import { bridgesOf, stepTable } from "./steps";
import type { PuzzleCheck } from "../puzzles.types";

/**
 * Whether an answer joins a Tsunagi level: the check the browser makes to say
 * "solved" and the server makes before it pays. O(cells), no search.
 *
 * The layout must be one of the site's levels (its size loaded first, by
 * `preparePuzzle`), so nobody is paid or ranked for a board they made up. The
 * answer must then carry every stone's letter on its stone, `#` on every
 * blocked cell, `+` on every bridge, a letter on every other cell, and each
 * letter's cells must be one line from one of its stones to the other, stepping
 * as a line may (`steps.ts`: never through a wall, straight over a bridge): the
 * two stones with one step to a cell of their letter each, every cell between
 * with two, all of them joined. A line that ran beside itself would show a cell
 * with three, and is refused; no level's one answer does that, which the level
 * test proves. Each bridge must be crossed straight across by one line and
 * straight down by a different one, and each waypoint passed by its own line.
 */
export function checkTsunagi(size: number, givens: string, answer: string): PuzzleCheck {
  const layout = decodeLayout(givens, size);
  if (layout === null) return { ok: false, reason: "the givens are not a Tsunagi layout" };
  if (tsunagiLevelOf(size, givens) === null) return { ok: false, reason: "not one of the site's levels" };
  if (typeof answer !== "string" || answer.length !== size * size) return { ok: false, reason: "not a grid of that size" };
  const steps = stepTable(layout);
  const pairs = layout.ends.length;
  const owners: number[] = [];
  for (let at = 0; at < answer.length; at += 1) {
    const char = answer[at]!;
    const cell = layout.cells[at]!;
    if (cell === CELL_BLOCKED || cell === CELL_BRIDGE) {
      if (char !== (cell === CELL_BLOCKED ? LINK_BLOCKED : LINK_BRIDGE)) return { ok: false, reason: cell === CELL_BLOCKED ? "a blocked cell is used" : "a bridge is not a bridge" };
      owners.push(cell);
      continue;
    }
    const pair = PAIR_LETTERS.indexOf(char);
    if (pair === -1 || pair >= pairs) return { ok: false, reason: "a cell has no line through it" };
    if (cell !== CELL_EMPTY && cell !== pair) return { ok: false, reason: "a stone is moved" };
    const waypoint = layout.waypoints.get(at);
    if (waypoint !== undefined && waypoint !== pair) return { ok: false, reason: "a waypoint is passed by another line" };
    owners.push(pair);
  }
  // Each bridge: one line straight across it, a different one straight down.
  for (const bridge of bridgesOf(layout)) {
    const acrossPair = owners[bridge - 1];
    const downPair = owners[bridge - size];
    if (acrossPair !== owners[bridge + 1] || downPair !== owners[bridge + size] || acrossPair === downPair) return { ok: false, reason: "a bridge is not crossed both ways by two lines" };
  }
  for (let pair = 0; pair < pairs; pair += 1) {
    const from: number = layout.ends[pair]![0];
    const to: number = layout.ends[pair]![1];
    const mine = owners.flatMap((owner, at) => (owner === pair ? [at] : []));
    for (const at of mine) {
      const same = steps[at]!.filter((step) => owners[step.to] === pair).length;
      const want = at === from || at === to ? 1 : 2;
      if (same !== want) return { ok: false, reason: `line ${PAIR_LETTERS[pair]} is not one line` };
    }
    // Joined: walk from one stone and reach every cell of the line, ending on the other.
    const seen = new Set<number>([from]);
    const queue: number[] = [from];
    while (queue.length > 0) {
      const cell: number = queue.pop()!;
      for (const step of steps[cell]!) {
        if (owners[step.to] === pair && !seen.has(step.to)) {
          seen.add(step.to);
          queue.push(step.to);
        }
      }
    }
    if (!seen.has(to) || seen.size !== mine.length) return { ok: false, reason: `line ${PAIR_LETTERS[pair]} does not join its stones` };
  }
  return { ok: true };
}
