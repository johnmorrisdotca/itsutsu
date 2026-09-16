import { describe, expect, it } from "vitest";
import { SHAPE_BASE } from "./analysis.constants";
import { shapeScore } from "./analysis";
import { createGame } from "./engine";
import { BLOCKED, DIRECTIONS, HOT, RULE_VARIANTS, STONES } from "./gomoku.constants";
import { boardShapeScore, spanScore, spanTable, windowTable } from "./lineShapes";
import { seededRandom } from "./rules/random";
import type { Cell, Stone } from "./gomoku.types";

/**
 * The tables are only worth anything if they say exactly what the scans they
 * replaced said, so the scans are restated here BY HAND rather than imported.
 *
 * That is the same move `simulation.checks.ts` makes against the engine, and
 * for the same reason: a table checked against the code it was derived from
 * proves the derivation ran, not that it was right. These two functions are
 * transcriptions of `shapeScore`'s loop and `windowScore`'s loop as they stood
 * before the tables existed, and they are the reference every case below
 * compares against.
 */
function scanPoint(
  board: readonly Cell[],
  size: number,
  winLength: number,
  stone: Stone,
  point: { row: number; col: number },
): number {
  let score = 0;
  for (const step of DIRECTIONS) {
    for (let offset = -(winLength - 1); offset <= 0; offset += 1) {
      let own = 0;
      let usable = true;
      for (let k = 0; k < winLength; k += 1) {
        const shift = offset + k;
        const row = point.row + step.row * shift;
        const col = point.col + step.col * shift;
        if (row < 0 || row >= size || col < 0 || col >= size) {
          usable = false;
          break;
        }
        const value = board[row * size + col];
        if (value === stone) own += 1;
        else if (value !== null) {
          usable = false;
          break;
        }
      }
      if (usable) score += SHAPE_BASE ** own;
    }
  }
  return score;
}

function scanBoard(
  board: readonly Cell[],
  size: number,
  winLength: number,
  stone: Stone,
): number {
  let total = 0;
  for (const step of DIRECTIONS) {
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const lastRow = row + step.row * (winLength - 1);
        const lastCol = col + step.col * (winLength - 1);
        if (lastRow < 0 || lastRow >= size || lastCol < 0 || lastCol >= size) continue;
        let own = 0;
        let usable = true;
        for (let k = 0; k < winLength; k += 1) {
          const cell = board[(row + step.row * k) * size + (col + step.col * k)];
          if (cell === stone) own += 1;
          else if (cell !== null) {
            usable = false;
            break;
          }
        }
        if (usable && own > 0) total += SHAPE_BASE ** own;
      }
    }
  }
  return total;
}

/**
 * A board with something of everything on it, from a seed, so a failing case
 * can be reproduced. Obstacles and hot squares are in the mix deliberately:
 * they are neither colour and neither empty, and they are exactly the cells a
 * three-way coding could get wrong.
 */
function litteredBoard(size: number, seed: number): Cell[] {
  const random = seededRandom(seed);
  const board: Cell[] = [];
  for (let cell = 0; cell < size * size; cell += 1) {
    const roll = random();
    if (roll < 0.34) board.push(null);
    else if (roll < 0.62) board.push(STONES.black);
    else if (roll < 0.9) board.push(STONES.white);
    else if (roll < 0.96) board.push(BLOCKED);
    else board.push(HOT);
  }
  return board;
}

const COLOURS: readonly Stone[] = [STONES.black, STONES.white];

describe("spanScore", () => {
  it("gives what the scan gives, for every point of a littered board", () => {
    for (const winLength of [3, 4, 5, 6]) {
      for (const size of [7, 9, 13]) {
        const board = litteredBoard(size, size * 100 + winLength);
        for (const stone of COLOURS) {
          for (let row = 0; row < size; row += 1) {
            for (let col = 0; col < size; col += 1) {
              const point = { row, col };
              expect(spanScore(board, size, winLength, stone, point)).toBe(
                scanPoint(board, size, winLength, stone, point),
              );
            }
          }
        }
      }
    }
  });

  it("gives what the scan gives on an empty board, where every window is live", () => {
    const size = 9;
    const board: Cell[] = new Array(size * size).fill(null);
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const point = { row, col };
        expect(spanScore(board, size, 5, STONES.black, point)).toBe(
          scanPoint(board, size, 5, STONES.black, point),
        );
      }
    }
  });

  /*
   * The corner is where the edge does its work. Off the board and blocked are
   * one digit in the table, and this is the case that would notice if they had
   * been coded apart — a corner has three of its four lines cut short.
   */
  it("counts the edge as blocking, exactly as running off the board did", () => {
    const size = 9;
    const board: Cell[] = new Array(size * size).fill(null);
    const corner = { row: 0, col: 0 };
    expect(spanScore(board, size, 5, STONES.black, corner)).toBe(
      scanPoint(board, size, 5, STONES.black, corner),
    );
    /*
     * Three of the four lines lead away from the top-left corner and hold one
     * empty window each, worth one apiece; the fourth runs off the board at
     * both ends and holds none. Stated as a number as well as against the scan,
     * so a table that agreed with a broken scan would still be caught here.
     */
    expect(spanScore(board, size, 5, STONES.black, corner)).toBe(3);
  });

  it("is what shapeScore answers, so the swap changed no number", () => {
    const size = 11;
    const board = litteredBoard(size, 4242);
    const state = createGame({ variant: RULE_VARIANTS.freestyle, size, winLength: 5 });
    const settings = state.settings;
    for (const stone of COLOURS) {
      for (let row = 0; row < size; row += 1) {
        for (let col = 0; col < size; col += 1) {
          const point = { row, col };
          expect(shapeScore(board, settings, stone, point)).toBe(
            scanPoint(board, size, 5, stone, point),
          );
        }
      }
    }
  });
});

describe("boardShapeScore", () => {
  it("gives what the whole-board scan gives, littered boards and all", () => {
    for (const winLength of [3, 4, 5, 6, 8]) {
      for (const size of [6, 8, 11, 15]) {
        const board = litteredBoard(size, size * 31 + winLength);
        for (const stone of COLOURS) {
          expect(boardShapeScore(board, size, winLength, stone)).toBe(
            scanBoard(board, size, winLength, stone),
          );
        }
      }
    }
  });

  it("counts nothing on an empty board, where the point reading counts one a window", () => {
    const size = 9;
    const board: Cell[] = new Array(size * size).fill(null);
    expect(boardShapeScore(board, size, 5, STONES.black)).toBe(0);
    expect(scanBoard(board, size, 5, STONES.black)).toBe(0);
    // The same window is worth one to a point's reading, which counts the empty.
    expect(spanScore(board, size, 5, STONES.black, { row: 4, col: 4 })).toBeGreaterThan(0);
  });

  it("counts nothing on a board too small to hold a window", () => {
    for (const size of [1, 2, 3, 4]) {
      const board = litteredBoard(size, size);
      expect(boardShapeScore(board, size, 5, STONES.black)).toBe(
        scanBoard(board, size, 5, STONES.black),
      );
    }
  });
});

/**
 * The refusals, which are the half of this module that must not be got wrong.
 *
 * A shape score of zero is a real answer — it means nothing is going on here —
 * so a table that cannot cover a line length has to say NOTHING rather than
 * nought, and the caller has to notice and fall back. Both halves are checked:
 * that the table refuses, and that the number the caller ends up with is still
 * the scan's.
 */
describe("what the tables will not answer", () => {
  it("has no centred table for a line longer than six", () => {
    expect(spanTable(7)).toBeNull();
    expect(spanTable(19)).toBeNull();
    expect(spanScore(litteredBoard(9, 1), 9, 7, STONES.black, { row: 4, col: 4 })).toBeNull();
  });

  it("has no window table for a line longer than eight", () => {
    expect(windowTable(9)).toBeNull();
    expect(windowTable(19)).toBeNull();
    expect(boardShapeScore(litteredBoard(9, 2), 9, 9, STONES.black)).toBeNull();
  });

  it("refuses a line length that is not a whole number of cells", () => {
    for (const asked of [0, 1, -5, 2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(spanTable(asked)).toBeNull();
      expect(windowTable(asked)).toBeNull();
    }
  });

  it("still gives the scan's number where it refuses, through shapeScore", () => {
    const size = 15;
    const board = litteredBoard(size, 777);
    // Seven is reachable: six from the settings, one more from the handicap.
    const state = createGame({ variant: RULE_VARIANTS.freestyle, size, winLength: 7 });
    expect(spanScore(board, size, 7, STONES.black, { row: 7, col: 7 })).toBeNull();
    for (const stone of COLOURS) {
      for (const point of [{ row: 7, col: 7 }, { row: 0, col: 0 }, { row: 14, col: 3 }]) {
        expect(shapeScore(board, state.settings, stone, point)).toBe(
          scanPoint(board, size, 7, stone, point),
        );
      }
    }
  });
});

describe("built once", () => {
  it("hands back the same table rather than building it again", () => {
    expect(spanTable(5)).toBe(spanTable(5));
    expect(windowTable(5)).toBe(windowTable(5));
    // A refusal is remembered too, so a game outside the tables asks once.
    expect(spanTable(11)).toBeNull();
    expect(spanTable(11)).toBeNull();
  });

  it("is the size the comments claim, so the byte cost stays honest", () => {
    expect(spanTable(5)?.length).toBe(3 ** 9);
    expect(spanTable(6)?.length).toBe(3 ** 11);
    expect(windowTable(5)?.length).toBe(3 ** 5);
    expect(windowTable(8)?.length).toBe(3 ** 8);
  });

  /*
   * Int16 is what makes the centred table 354 KB rather than 708 KB at six, and
   * it is only safe while the largest entry fits. This is the entry: a span with
   * every cell this colour's, where all six windows are full.
   */
  it("holds the largest score a full span can reach", () => {
    const winLength = 6;
    const span = 2 * winLength - 1;
    /*
     * Every cell of the span this colour's. Each cell codes as 1, so the index
     * is 1 in every base-3 place, which is (3^span - 1) / 2 — and the entry is
     * all six windows full.
     */
    const everyCellMine = (3 ** span - 1) / 2;
    expect(spanTable(winLength)?.[everyCellMine]).toBe(winLength * SHAPE_BASE ** winLength);
    expect(winLength * SHAPE_BASE ** winLength).toBeLessThan(32_768);
  });
});
