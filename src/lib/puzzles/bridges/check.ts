import type { PuzzleCheck } from "../puzzles.types";
import { ACROSS_ONE, ACROSS_TWO, DOWN_ONE, DOWN_TWO, MOST_BRIDGES, WATER } from "./code";

/**
 * Whether a drawing solves a Bridges puzzle: the check the browser makes to
 * say "solved" and the server makes before it pays. O(cells), no search, and
 * written out here rather than taken from the solver or from `boardOf`: the
 * solver made the puzzle, and a check that reads its mind proves only that it
 * agrees with itself.
 *
 * Every island where the givens put it with its number; every other cell
 * water or one of `- = | H`; every run of bridge cells ending in an island at
 * both ends, one kind all along; every island given exactly its number; and
 * every island reached from the first by walking the bridges.
 */
export function checkBridges(size: number, givens: string, answer: string): PuzzleCheck {
  const cells = size * size;
  if (typeof givens !== "string" || givens.length !== cells) return { ok: false, reason: "the givens are not a grid of islands" };
  if (typeof answer !== "string" || answer.length !== cells) return { ok: false, reason: "not a grid of that size" };
  const isIsland = (char: string | undefined) => char !== undefined && char >= "1" && char <= String(MOST_BRIDGES);
  let islands = 0;
  let first = -1;
  for (let cell = 0; cell < cells; cell += 1) {
    const given = givens[cell]!;
    const drawn = answer[cell]!;
    if (given !== WATER && !isIsland(given)) return { ok: false, reason: "the givens are not a grid of islands" };
    if (isIsland(given)) {
      if (drawn !== given) return { ok: false, reason: "an island was moved" };
      islands += 1;
      if (first === -1) first = cell;
      continue;
    }
    if (drawn !== WATER && drawn !== ACROSS_ONE && drawn !== ACROSS_TWO && drawn !== DOWN_ONE && drawn !== DOWN_TWO) {
      return { ok: false, reason: isIsland(drawn) ? "an island was added" : "a cell is neither water nor a bridge" };
    }
  }
  if (islands === 0) return { ok: false, reason: "there are no islands" };

  const at = (row: number, col: number) => (row < 0 || col < 0 || row >= size || col >= size ? undefined : answer[row * size + col]);
  // Every bridge cell runs on to its own kind or an island, both ways along it.
  for (let cell = 0; cell < cells; cell += 1) {
    const drawn = answer[cell]!;
    const row = Math.floor(cell / size);
    const col = cell % size;
    const across = drawn === ACROSS_ONE || drawn === ACROSS_TWO;
    const down = drawn === DOWN_ONE || drawn === DOWN_TWO;
    if (!across && !down) continue;
    const ends = across ? [at(row, col - 1), at(row, col + 1)] : [at(row - 1, col), at(row + 1, col)];
    if (ends.some((end) => end !== drawn && !isIsland(end))) return { ok: false, reason: `the bridge at row ${row + 1}, column ${col + 1} does not reach an island` };
  }

  // What each island is given, and every island reached from the first along the bridges.
  const weight: Record<string, number> = { [ACROSS_ONE]: 1, [ACROSS_TWO]: 2, [DOWN_ONE]: 1, [DOWN_TWO]: 2 };
  const reached = new Uint8Array(cells);
  const waiting = [first];
  reached[first] = 1;
  let joined = 1;
  const sides = [
    [0, 1, [ACROSS_ONE, ACROSS_TWO]],
    [0, -1, [ACROSS_ONE, ACROSS_TWO]],
    [1, 0, [DOWN_ONE, DOWN_TWO]],
    [-1, 0, [DOWN_ONE, DOWN_TWO]],
  ] as const;
  for (let cell = 0; cell < cells; cell += 1) {
    if (!isIsland(givens[cell])) continue;
    const row = Math.floor(cell / size);
    const col = cell % size;
    let given = 0;
    for (const [dr, dc, kinds] of sides) {
      const next = at(row + dr, col + dc);
      if (next !== undefined && (kinds as readonly string[]).includes(next)) given += weight[next]!;
    }
    if (given !== Number(givens[cell])) return { ok: false, reason: `the island at row ${row + 1}, column ${col + 1} wants ${givens[cell]} and has ${given}` };
  }
  // Each bridge is walked at most twice, once from each end: O(cells).
  while (waiting.length > 0) {
    const cell = waiting.pop()!;
    const row = Math.floor(cell / size);
    const col = cell % size;
    for (const [dr, dc, kinds] of sides) {
      let r = row + dr;
      let c = col + dc;
      if (!(kinds as readonly string[]).includes(at(r, c) ?? "")) continue;
      while ((kinds as readonly string[]).includes(at(r, c) ?? "")) {
        r += dr;
        c += dc;
      }
      const end = r * size + c;
      if (reached[end] === 0) {
        reached[end] = 1;
        joined += 1;
        waiting.push(end);
      }
    }
  }
  if (joined !== islands) return { ok: false, reason: "the islands are not all joined into one" };
  return { ok: true };
}
