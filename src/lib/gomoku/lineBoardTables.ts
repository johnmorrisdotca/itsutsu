import { weightedWindowTable, windowTable } from "./lineShapes";

/*
 * The tables a line board reads a point's span through. Each is indexed by the
 * span's base-3 number — see `lineBoard.ts` — and built once per line length.
 */

/** A cell as a digit of a line's number, from one colour's side: empty, its own, or anything else. */
export const EMPTY = 0;
export const OWN = 1;
export const BLOCKED = 2;

/**
 * The whole board's score for one colour, read one point's span at a time: for
 * each filling of the `2 × winLength − 1` cells centred on a point, the sum of
 * the board-scoring table over the windows that cover the centre. Built from
 * `windowTable` itself, so a window is worth here exactly what it is worth to
 * `boardShapeScore` — which counts an empty window as nothing, where the point
 * table counts it as one.
 */
const LEAF_SPAN_TABLES = new Map<string, Int32Array>();

export function leafSpanTable(winLength: number, values?: readonly number[]): Int32Array | null {
  const key = values === undefined ? `${winLength}` : `${winLength}:${values.join(",")}`;
  const known = LEAF_SPAN_TABLES.get(key);
  if (known !== undefined) return known;
  const windows = values === undefined ? windowTable(winLength) : weightedWindowTable(winLength, values);
  if (windows === null) return null;
  const span = 2 * winLength - 1;
  const table = new Int32Array(3 ** span);
  const digits = new Uint8Array(span);
  for (let code = 0; code < table.length; code += 1) {
    let total = 0;
    for (let start = 0; start < winLength; start += 1) {
      let windowCode = 0;
      for (let k = winLength - 1; k >= 0; k -= 1) windowCode = windowCode * 3 + digits[start + k];
      total += windows[windowCode];
    }
    table[code] = total;
    for (let place = 0; place < span; place += 1) {
      if (digits[place] === 2) digits[place] = 0;
      else {
        digits[place] += 1;
        break;
      }
    }
  }
  LEAF_SPAN_TABLES.set(key, table);
  return table;
}

/**
 * For each filling of a point's span, the most of the colour's stones in any
 * window covering the centre that holds nothing else — what `forcedReplies`
 * counts cell by cell to decide whether a point is one or two short of five.
 */
const OPEN_COUNT_TABLES = new Map<number, Uint8Array>();

export function openCountTable(winLength: number): Uint8Array {
  const known = OPEN_COUNT_TABLES.get(winLength);
  if (known !== undefined) return known;
  const span = 2 * winLength - 1;
  const table = new Uint8Array(3 ** span);
  const digits = new Uint8Array(span);
  for (let code = 0; code < table.length; code += 1) {
    let best = 0;
    for (let start = 0; start < winLength; start += 1) {
      let own = 0;
      let open = true;
      for (let k = 0; k < winLength; k += 1) {
        const digit = digits[start + k];
        if (digit === OWN) own += 1;
        else if (digit === BLOCKED) {
          open = false;
          break;
        }
      }
      if (open && own > best) best = own;
    }
    table[code] = best;
    for (let place = 0; place < span; place += 1) {
      if (digits[place] === 2) digits[place] = 0;
      else {
        digits[place] += 1;
        break;
      }
    }
  }
  OPEN_COUNT_TABLES.set(winLength, table);
  return table;
}

/** For each filling of a point's span, how many of its cells are the colour's own. */
const OWN_COUNT_TABLES = new Map<number, Uint8Array>();

export function ownCountTable(winLength: number): Uint8Array {
  const known = OWN_COUNT_TABLES.get(winLength);
  if (known !== undefined) return known;
  const span = 2 * winLength - 1;
  const table = new Uint8Array(3 ** span);
  for (let code = 0; code < table.length; code += 1) {
    let rest = code;
    let own = 0;
    for (let place = 0; place < span; place += 1) {
      const digit = rest % 3;
      rest = (rest - digit) / 3;
      if (digit === OWN) own += 1;
    }
    table[code] = own;
  }
  OWN_COUNT_TABLES.set(winLength, table);
  return table;
}

