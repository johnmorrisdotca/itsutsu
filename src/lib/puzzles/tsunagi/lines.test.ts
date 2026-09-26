import { beforeAll, describe, expect, it } from "vitest";

import { checkTsunagi } from "./check";
import { decodeLayout } from "./code";
import { loadTsunagiLevels, tsunagiLevelsOf } from "./levels";
import { allJoined, answerOf, decodeLines, dragThrough, dragTo, encodeLines, letGo, noLines, pressAt, type Lines } from "./lines";

/**
 * How a finger draws a Tsunagi line: the rules the grid hands every press and
 * drag to (`lines.ts`), on a board made to show them, and a real level solved
 * along its stored answer, kept half way, and handed to the server's check.
 */
beforeAll(() => loadTsunagiLevels(4));

function level(n: number) {
  const [givens, answer] = tsunagiLevelsOf(4)[n - 1]!;
  return { layout: decodeLayout(givens, 4)!, givens, answer };
}

/** The cells of one pair's line in the stored answer, in order from its first stone. */
function answerLine(n: number, pair: number): number[] {
  const { layout, answer } = level(n);
  const letter = answer[layout.ends[pair]![0]]!;
  const line = [layout.ends[pair]![0]];
  for (;;) {
    const at = line[line.length - 1]!;
    const next = [at - 4, at + 1, at + 4, at - 1].find(
      (cell) => cell >= 0 && cell < 16 && answer[cell] === letter && !line.includes(cell) && (Math.abs(cell - at) === 4 || Math.floor(cell / 4) === Math.floor(at / 4)),
    );
    if (next === undefined) return line;
    line.push(next);
  }
}

function draw(n: number, lines: Lines, cells: readonly number[]): Lines {
  const { layout } = level(n);
  const pressed = pressAt(layout, lines, cells[0]!);
  let now = pressed.lines;
  for (const cell of cells.slice(1)) now = dragTo(layout, now, pressed.drawing!, cell);
  return letGo(now);
}

describe("drawing a tsunagi line", () => {
  it("joins every pair along the answer, and the level is solved when the last one closes", () => {
    const { layout, answer } = level(1);
    let lines = noLines(layout);
    layout.ends.forEach((_, pair) => {
      expect(allJoined(layout, lines)).toBe(false);
      lines = draw(1, lines, answerLine(1, pair));
    });
    expect(allJoined(layout, lines)).toBe(true);
    expect(answerOf(layout, lines)).toBe(answer);
    expect(checkTsunagi(4, level(1).givens, answerOf(layout, lines))).toEqual({ ok: true });
  });

});

/*
 * The drawing rules on a board made for them, 5×5 with two pairs down its sides:
 *
 *   A . . . B     cells  0  1  2  3  4
 *   . . . . .            5  6  7  8  9
 *   . . . . .           10 11 12 13 14
 *   . . . . .           15 16 17 18 19
 *   A . . . B           20 21 22 23 24
 */
const SIDES = decodeLayout("A...B...............A...B", 5)!;

function drawOn(lines: Lines, cells: readonly number[], lift = true): Lines {
  const pressed = pressAt(SIDES, lines, cells[0]!);
  let now = pressed.lines;
  for (const cell of cells.slice(1)) now = dragTo(SIDES, now, pressed.drawing!, cell);
  return lift ? letGo(now) : now;
}

describe("the drawing rules", () => {
  it("shortens a line dragged back over itself, cell by cell, without letting go", () => {
    const out = drawOn(noLines(SIDES), [0, 5, 10, 15], false);
    expect(out[0]).toEqual([0, 5, 10, 15]);
    const back = dragTo(SIDES, out, 0, 10);
    expect(back[0]).toEqual([0, 5, 10]);
    expect(dragTo(SIDES, back, 0, 5)[0]).toEqual([0, 5]);
  });

  it("cuts another pair's line back where this one is drawn through it", () => {
    const a = drawOn(noLines(SIDES), [0, 1, 2, 7, 12]);
    const crossed = drawOn(a, [4, 9, 8, 7]);
    expect(crossed[0]).toEqual([0, 1, 2]);
    expect(crossed[1]).toEqual([4, 9, 8, 7]);
  });

  it("drops a line cut back to nothing but its stone", () => {
    const a = drawOn(noLines(SIDES), [0, 1]);
    expect(drawOn(a, [4, 3, 2, 1])[0]).toEqual([]);
  });

  it("refuses another pair's stone, a cell not beside the end, and anything past its own far stone", () => {
    const along = drawOn(noLines(SIDES), [0, 1, 2, 3], false);
    expect(dragTo(SIDES, along, 0, 4)).toBe(along);
    expect(dragTo(SIDES, along, 0, 13)).toBe(along);
    const joined = drawOn(noLines(SIDES), [0, 5, 10, 15, 20], false);
    expect(dragTo(SIDES, joined, 0, 21)).toBe(joined);
  });

  it("clears a line when its stone is tapped, and starts afresh from the other stone", () => {
    const lines = drawOn(noLines(SIDES), [0, 5, 10]);
    expect(drawOn(lines, [0])[0]).toEqual([]);
    expect(drawOn(lines, [20, 15])[0]).toEqual([20, 15]);
  });

  it("goes on from a line's end, and cuts back to wherever the line is pressed", () => {
    const lines = drawOn(noLines(SIDES), [0, 5, 10]);
    expect(drawOn(lines, [10, 15])[0]).toEqual([0, 5, 10, 15]);
    expect(drawOn(lines, [5, 6])[0]).toEqual([0, 5, 6]);
  });

  it("walks a quick flick one cell at a time, and stops where a step is refused", () => {
    const pressed = pressAt(SIDES, noLines(SIDES), 0);
    expect(dragThrough(SIDES, pressed.lines, 0, 15)[0]).toEqual([0, 5, 10, 15]);
    expect(dragThrough(SIDES, pressed.lines, 0, 4)[0]).toEqual([0, 1, 2, 3]);
  });
});

describe("a half-drawn level, kept and opened again", () => {
  it("reads back exactly the lines it was written from", () => {
    const { layout } = level(3);
    const lines = draw(3, draw(3, noLines(layout), answerLine(3, 0)), answerLine(3, 1).slice(0, 2));
    const code = encodeLines(layout, lines);
    expect(code).toHaveLength(16);
    expect(decodeLines(layout, code)).toEqual(lines);
  });

  it("refuses a code that is not lines on this layout", () => {
    const { layout } = level(3);
    expect(decodeLines(layout, "x".repeat(16))).toBeNull();
    expect(decodeLines(layout, "*".repeat(16))).toBeNull();
    expect(decodeLines(layout, "n".padEnd(16, "."))).toBeNull();
  });
});

describe("the check the server makes", () => {
  it("refuses a grid with a line broken, a stone moved, or a layout that is no level", () => {
    const { givens, answer } = level(2);
    expect(checkTsunagi(4, givens, answer)).toEqual({ ok: true });
    expect(checkTsunagi(4, givens, answer.replace(/^./, ".")).ok).toBe(false);
    const swapped = answer[0] === "A" ? `B${answer.slice(1)}` : `A${answer.slice(1)}`;
    expect(checkTsunagi(4, givens, swapped).ok).toBe(false);
    expect(checkTsunagi(4, `${givens.slice(1)}${givens[0]}`, answer).ok).toBe(false);
  });
});
