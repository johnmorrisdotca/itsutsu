import { SHAPE_BASE } from "./analysis.constants";
import { DIRECTIONS } from "./gomoku.constants";
import type { Cell, Point, Stone } from "./gomoku.types";

/**
 * Reading a line of squares from a table built once, instead of scanning it
 * again on every move.
 *
 * The computer's inner loop asks one question over and over: how much is this
 * stretch of the board worth to one colour? The answer only ever depended on
 * the pattern of the cells, never on where on the board they happened to sit —
 * and there are not many patterns. A stretch of N cells, with each cell either
 * empty, this colour's, or blocked to this colour, has exactly 3^N fillings. A
 * table of every one of them is a few hundred kilobytes and is built once; a
 * reading is then an index and a lookup rather than a nest of loops.
 *
 * Measured on a 15×15 board, mid-game: `shapeScore` cost 4.28 µs a call by
 * scanning and 0.29 µs by lookup, which is fifteen times cheaper. It matters
 * because the search is bounded by a wall clock (SEARCH.millis) rather than by
 * a node count, so every microsecond saved in the reading is spent on depth —
 * and depth is the only thing still separating the top two grades, which were
 * measured playing the same move 94% of the time because neither reached the
 * depth it is supposed to differ by.
 *
 * WHAT THE TABLE CANNOT SAY, IT DOES NOT SAY. Every entry point here answers
 * `null` rather than a number when the line it was asked about is longer than
 * the tables cover — and a number in range would be the dangerous answer,
 * because a shape score of zero also means "nothing here". The callers keep
 * their original scan and fall back to it, so a game with a line rule the
 * table has never heard of is read exactly as it was before, only slower.
 *
 * Three cell codes, and the third is the point: a cell is blocked whether it
 * holds the other colour, an obstacle, a hot square, or nothing at all because
 * it is off the edge of the board. The old scan treated all four identically —
 * the window is dead and scores nothing — so coding them as one digit is what
 * the reading already meant rather than a simplification of it.
 */

const CELL_EMPTY = 0;
const CELL_MINE = 1;
const CELL_BLOCKED = 2;

/**
 * The longest line the centred table covers.
 *
 * A point's reading spans `2 × winLength - 1` cells, so six is 3^11 = 177,147
 * entries — 354 KB as Int16 — and seven would be 3^13, nine times that, for
 * games nobody plays. Six covers every line length the site offers (WIN_LENGTHS
 * is 4, 5 and 6) and every length a variant's spec pins (3 for the tic-tac-toe
 * family, 4, 5, 6). A longer line arrives only through the API, which allows up
 * to 19, or through the handicap that lengthens one colour's line by one; both
 * fall back to the scan.
 *
 * Int16 is safe up to here and checked rather than assumed: the largest entry
 * is `winLength × SHAPE_BASE ** winLength`, which is 24,576 at six against a
 * ceiling of 32,767. `spanTable` refuses to build a table whose entries would
 * not fit, so raising SHAPE_BASE produces a fallback rather than a wrong number.
 */
const LONGEST_CENTRED_LINE = 6;

/** The byte cost, for the record: 486 B at 3, 4.4 KB at 4, 39 KB at 5, 354 KB at 6. */
const SPAN_TABLES = new Map<number, Int16Array | null>();

/** How many cells a point's reading spans: the window either side of it. */
function spanCells(winLength: number): number {
  return 2 * winLength - 1;
}

/**
 * What one window of `winLength` cells is worth, given how many of them are
 * this colour's and whether anything blocks it.
 *
 * The same arithmetic `shapeScore` and `windowScore` have always done, in one
 * place, so the table cannot drift from the scan it replaces.
 */
function windowValue(own: number, blocked: boolean): number {
  return blocked ? 0 : SHAPE_BASE ** own;
}

/**
 * The table for a point's reading: every filling of the `2 × winLength - 1`
 * cells centred on a point, valued as the sum of the `winLength` windows that
 * cover the centre.
 *
 * Null where the line is longer than the tables cover, or where an entry would
 * not fit the array — see `LONGEST_CENTRED_LINE`. Built once per line length
 * and remembered, including the refusal, so a game that cannot be tabled asks
 * once rather than on every move.
 */
export function spanTable(winLength: number): Int16Array | null {
  const known = SPAN_TABLES.get(winLength);
  if (known !== undefined) return known;
  const built = buildSpanTable(winLength);
  SPAN_TABLES.set(winLength, built);
  return built;
}

function buildSpanTable(winLength: number): Int16Array | null {
  if (!Number.isInteger(winLength)) return null;
  if (winLength < 2 || winLength > LONGEST_CENTRED_LINE) return null;
  // The largest a cell of the table can hold: every window full of this colour.
  if (winLength * SHAPE_BASE ** winLength > 32_767) return null;

  const span = spanCells(winLength);
  const table = new Int16Array(3 ** span);
  /*
   * An odometer over the cells rather than dividing each index back down into
   * digits: the table is walked in index order, so the digits of the next entry
   * are the digits of this one plus one, which is a carry and nothing more.
   */
  const digits = new Uint8Array(span);

  for (let index = 0; index < table.length; index += 1) {
    let total = 0;
    /*
     * The windows covering the centre. The centre sits at `winLength - 1`, and
     * a window starting at `start` covers `start … start + winLength - 1`, so
     * the starts that include it are exactly 0 … winLength - 1.
     */
    for (let start = 0; start < winLength; start += 1) {
      let own = 0;
      let blocked = false;
      for (let k = 0; k < winLength; k += 1) {
        const digit = digits[start + k];
        if (digit === CELL_MINE) own += 1;
        else if (digit === CELL_BLOCKED) {
          blocked = true;
          break;
        }
      }
      total += windowValue(own, blocked);
    }
    table[index] = total;

    for (let place = 0; place < span; place += 1) {
      if (digits[place] === 2) digits[place] = 0;
      else {
        digits[place] += 1;
        break;
      }
    }
  }
  return table;
}

/**
 * The longest line the single-window table covers.
 *
 * Far more generous than `LONGEST_CENTRED_LINE` because this table is one
 * window rather than a span: 3^8 is 6,561 entries against 3^15. Eight is the
 * longest line the site can produce — six from WIN_LENGTHS, plus one for the
 * handicap that lengthens a colour's line — with a cell of room over it.
 */
const LONGEST_WINDOW = 8;

/** The byte cost, for the record: 972 B at 5, 2.9 KB at 6, 26 KB at 8. */
const WINDOW_TABLES = new Map<number, Int32Array | null>();

/**
 * The table for a whole-board reading: every filling of ONE window of
 * `winLength` cells.
 *
 * It differs from the span table in one thing, and the difference is the
 * board-wide reading's own rule rather than an oversight: a window with none of
 * this colour's stones in it is worth nothing here, where a point's reading
 * counts it as one. A board has thousands of empty windows and a point has
 * four; counting the empties board-wide would score an empty board by its size.
 */
export function windowTable(winLength: number): Int32Array | null {
  const known = WINDOW_TABLES.get(winLength);
  if (known !== undefined) return known;
  const built = buildWindowTable(winLength);
  WINDOW_TABLES.set(winLength, built);
  return built;
}

/**
 * A window table with values of the caller's own: what a window holding `own` of
 * a colour's stones is worth, in `values` by that count. Cached by the values it
 * was built from, so the search builds each pair of tables once.
 */
const WEIGHTED_WINDOW_TABLES = new Map<string, Int32Array | null>();

export function weightedWindowTable(winLength: number, values: readonly number[]): Int32Array | null {
  const key = `${winLength}:${values.join(",")}`;
  const known = WEIGHTED_WINDOW_TABLES.get(key);
  if (known !== undefined) return known;
  const built = buildWindowTable(winLength, values);
  WEIGHTED_WINDOW_TABLES.set(key, built);
  return built;
}

function buildWindowTable(winLength: number, values?: readonly number[]): Int32Array | null {
  if (!Number.isInteger(winLength)) return null;
  if (winLength < 2 || winLength > LONGEST_WINDOW) return null;

  const table = new Int32Array(3 ** winLength);
  for (let index = 0; index < table.length; index += 1) {
    let rest = index;
    let own = 0;
    let blocked = false;
    for (let cell = 0; cell < winLength; cell += 1) {
      const digit = rest % 3;
      rest = (rest - digit) / 3;
      if (digit === CELL_MINE) own += 1;
      else if (digit === CELL_BLOCKED) blocked = true;
    }
    table[index] = own === 0 || blocked ? 0 : (values?.[own] ?? windowValue(own, false));
  }
  return table;
}

/**
 * What the whole board has going for `stone`: every window of `winLength` on it
 * that nothing of the other colour has broken, weighted by how many of this
 * colour's stones it holds. Null where no table covers this line length.
 *
 * Each line is walked ONCE, carrying a rolling index rather than re-reading the
 * `winLength` cells of every window — so the reading costs a lookup per cell of
 * the board rather than a scan per window of it. Walking by line also decides
 * where a window may start without a per-direction rule: a cell begins a line
 * exactly when the cell one step behind it is off the board.
 *
 * The wrapping boards are read flat, as the scan this replaces read them, so a
 * line across the join is not counted. That is an approximation in an advisory
 * reading which the engine still settles, and it is the same approximation as
 * before rather than a new one.
 */
export function boardShapeScore(
  board: readonly Cell[],
  size: number,
  winLength: number,
  stone: Stone,
  /** What a window is worth by the stones it holds; the powers of four where the caller says nothing. */
  values?: readonly number[],
  /** The lines a run may travel: the square board's four by default, the hexagon's three where the caller knows it is one. */
  directions: readonly Point[] = DIRECTIONS,
): number | null {
  const table = values === undefined ? windowTable(winLength) : weightedWindowTable(winLength, values);
  if (table === null) return null;
  // A board too small to hold one window holds none, in any direction.
  if (size < winLength) return 0;

  // The place the newest cell of the window takes; the oldest sits at the ones.
  const newest = 3 ** (winLength - 1);
  let total = 0;

  for (const step of directions) {
    for (let row = 0; row < size; row += 1) {
      /*
       * Only a cell on the rim can begin a line: one step back from anywhere
       * else is still on the board, so that cell's line was already walked. An
       * interior row is therefore visited at its two ends and nowhere between,
       * which is what keeps this one pass over the board rather than four.
       */
      const rimRow = row === 0 || row === size - 1;
      const stride = rimRow ? 1 : size - 1;
      for (let col = 0; col < size; col += stride) {
        const backRow = row - step.row;
        const backCol = col - step.col;
        const startsLine =
          backRow < 0 || backRow >= size || backCol < 0 || backCol >= size;
        if (!startsLine) continue;

        let index = 0;
        let held = 0;
        let atRow = row;
        let atCol = col;
        while (atRow >= 0 && atRow < size && atCol >= 0 && atCol < size) {
          const value = board[atRow * size + atCol];
          const digit =
            value === stone ? CELL_MINE : value === null ? CELL_EMPTY : CELL_BLOCKED;
          /*
           * Shift the window along: drop the oldest cell off the ones place and
           * put the new one at the top. An all-empty run before the window is
           * full reads as zeros, which is why nothing is counted until it is.
           */
          index = ((index / 3) | 0) + digit * newest;
          held += 1;
          if (held >= winLength) total += table[index];
          atRow += step.row;
          atCol += step.col;
        }
      }
    }
  }
  return total;
}

/**
 * How promising `point` looks for `stone`, read from the table — the same
 * number `shapeScore`'s scan produces, and null where no table covers this line
 * length.
 *
 * Least significant digit first, matching the odometer above: the cell at the
 * near end of the span is the ones place. Which end is which does not matter to
 * the answer, only that the builder and the reader agree, so they are written
 * to agree here rather than in two places that could drift.
 */
export function spanScore(
  board: readonly Cell[],
  size: number,
  winLength: number,
  stone: Stone,
  point: Point,
  /** The lines a run may travel: the square board's four by default, the hexagon's three where the caller knows it is one. */
  directions: readonly Point[] = DIRECTIONS,
): number | null {
  const table = spanTable(winLength);
  if (table === null) return null;

  const span = spanCells(winLength);
  const reach = winLength - 1;
  let total = 0;

  for (const step of directions) {
    let index = 0;
    let place = 1;
    for (let cell = 0; cell < span; cell += 1) {
      const shift = cell - reach;
      const row = point.row + step.row * shift;
      const col = point.col + step.col * shift;
      /*
       * Off the board is blocked. The scan this replaces broke out of the
       * window on a cell it could not read, which scores it nothing — exactly
       * what a blocked cell does — so the edge needs no code of its own.
       */
      const value =
        row < 0 || row >= size || col < 0 || col >= size ? undefined : board[row * size + col];
      const digit =
        value === stone ? CELL_MINE : value === null ? CELL_EMPTY : CELL_BLOCKED;
      index += digit * place;
      place *= 3;
    }
    total += table[index];
  }
  return total;
}
