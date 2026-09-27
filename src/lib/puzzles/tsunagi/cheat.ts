import { CELL_BRIDGE, type LinkLayout } from "./code";
import { joined, letGo, type Lines } from "./lines";

/**
 * CHEAT: one unfinished line drawn for the player, correctly. John,
 * 2026-09-26: beyond Check, which only flashes the unjoined pairs, "a Cheat
 * button that draws one unfinished line correctly", offered only where
 * "Allow cheating" was chosen at set-up. Flow Free's hint does the same — it
 * draws one whole flow.
 *
 * The line is the lowest-numbered pair not yet joined; where every pair is
 * joined but the board is wrong, the lowest whose line is not the answer's.
 * It is drawn as the answer has it, and any other line in its way is cut back
 * to before the first cell it would share — on a bridge only where both go the
 * same way over it, since two lines may cross there. Null when there is nothing
 * to draw: every line already the answer's. Pure: new lines, the old untouched.
 */
export function cheatLine(layout: LinkLayout, lines: Lines, answer: Lines): { lines: Lines; pair: number } | null {
  const same = (a: readonly number[], b: readonly number[]) => a.length === b.length && (a.every((cell, at) => cell === b[at]) || a.every((cell, at) => cell === b[b.length - 1 - at]));
  let pair = layout.ends.findIndex((_, each) => !joined(layout, lines, each));
  if (pair === -1) pair = answer.findIndex((line, each) => !same(line, lines[each]!));
  if (pair === -1) return null;
  const drawn = answer[pair]!;
  // The way the drawn line goes over each bridge on it: across (a step of one) or down.
  const across = (line: readonly number[], at: number) => Math.abs(line[at]! - line[at - 1]!) === 1 || Math.abs(line[at + 1]! - line[at]!) === 1;
  const claimed = new Map<number, boolean | null>();
  drawn.forEach((cell, at) => claimed.set(cell, layout.cells[cell] === CELL_BRIDGE ? across(drawn, at) : null));
  const next = lines.map((line, each) => {
    if (each === pair) return [...drawn];
    const clash = line.findIndex((cell, at) => {
      if (!claimed.has(cell)) return false;
      const way = claimed.get(cell)!;
      // A bridge is shared only by lines going different ways over it.
      return way === null || at === 0 || at === line.length - 1 || across(line, at) === way;
    });
    return clash === -1 ? [...line] : line.slice(0, clash);
  });
  return { lines: letGo(next, layout), pair };
}
