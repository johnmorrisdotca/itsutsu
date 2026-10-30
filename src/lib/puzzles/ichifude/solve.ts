import { decodeNumbers, encodeLine, neighbours } from "./code";

/**
 * THE SOLVER: every way one line can run through every cell, passing the numbers
 * in order, counted as far as it needs to be.
 *
 * A search along the line from the first number. Two things cut it short, both
 * sound, so nothing it skips could have been an answer: a cell still empty must
 * keep two ways in and out (the last number, one), and every empty cell must still
 * be reachable from the head of the line.
 *
 * It works to a budget of steps, never of time, so one seed makes one board in
 * every browser, and a board it could not finish searching is reported as such
 * (`exhausted`) rather than as having the answers found so far: not having looked
 * is not the same as one answer.
 */
export const SEARCH_STEPS = 12_000;

export type Search = {
  /** How many answers were found, up to `most`. */
  found: number;
  /** The answers found, as lines of cells. */
  lines: number[][];
  /** Whether the search stopped on its budget, which means the count proves nothing. */
  exhausted: boolean;
  /** The steps it took. */
  steps: number;
};

const ROUNDS_OF_NEIGHBOURS = new Map<number, number[][]>();

function neighbourTable(size: number): number[][] {
  const known = ROUNDS_OF_NEIGHBOURS.get(size);
  if (known !== undefined) return known;
  const table = Array.from({ length: size * size }, (_, cell) => neighbours(cell, size));
  ROUNDS_OF_NEIGHBOURS.set(size, table);
  return table;
}

/** Up to `most` answers to a board, its numbers a number a cell. */
export function searchLines(size: number, numbers: readonly number[], most = 2, budget = SEARCH_STEPS): Search {
  const cells = size * size;
  const around = neighbourTable(size);
  const last = Math.max(...numbers);
  const start = numbers.indexOf(1);
  const end = numbers.indexOf(last);
  const taken = new Uint8Array(cells);
  const line = new Array<number>(cells).fill(-1);
  const lines: number[][] = [];
  const reach = new Int32Array(cells);
  const seen = new Int32Array(cells);
  let stamp = 0;
  let steps = 0;
  let exhausted = false;

  /** Whether the empty cells can all still be walked, from this head, with this many of them left. */
  const stillPossible = (head: number, empty: number): boolean => {
    let walked = 0;
    let top = 0;
    stamp += 1;
    for (const next of around[head]!) {
      if (taken[next] === 0) {
        seen[next] = stamp;
        reach[top] = next;
        top += 1;
      }
    }
    while (top > 0) {
      top -= 1;
      const cell = reach[top]!;
      walked += 1;
      let ways = 0;
      for (const next of around[cell]!) {
        if (next === head) ways += 1;
        else if (taken[next] === 0) {
          ways += 1;
          if (seen[next] !== stamp) {
            seen[next] = stamp;
            reach[top] = next;
            top += 1;
          }
        }
      }
      if (ways < (cell === end ? 1 : 2)) return false;
    }
    return walked === empty;
  };

  const walk = (head: number, place: number, wanted: number): void => {
    if (place === cells - 1) {
      if (head === end) lines.push(line.slice());
      return;
    }
    steps += 1;
    if (steps > budget) {
      exhausted = true;
      return;
    }
    if (!stillPossible(head, cells - 1 - place)) return;
    for (const next of around[head]!) {
      if (taken[next] !== 0) continue;
      const number = numbers[next]!;
      if (number !== 0 && number !== wanted) continue;
      // The last number is the last cell: stepping on it sooner leaves the rest of the board behind.
      if (next === end && place + 1 !== cells - 1) continue;
      taken[next] = 1;
      line[place + 1] = next;
      walk(next, place + 1, number === 0 ? wanted : wanted + 1);
      taken[next] = 0;
      if (exhausted || lines.length >= most) return;
    }
  };

  taken[start] = 1;
  line[0] = start;
  walk(start, 0, 2);
  return { found: lines.length, lines, exhausted, steps };
}

/** The one answer a board has, as the string a line is kept in: null where there is none or more than one, or the search could not tell. */
export function solutionOf(size: number, givens: string): string | null {
  const numbers = decodeNumbers(givens, size);
  if (numbers === null) return null;
  const search = searchLines(size, numbers, 2, SEARCH_STEPS * 20);
  return search.found === 1 && !search.exhausted ? encodeLine(search.lines[0]!, size) : null;
}
