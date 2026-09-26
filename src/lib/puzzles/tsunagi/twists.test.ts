import { beforeAll, describe, expect, it } from "vitest";

import { checkTsunagi } from "./check";
import { CELL_BRIDGE, decodeLayout, encodeLayout } from "./code";
import { isTwist } from "./ladder";
import { loadEveryTsunagiLevel, TSUNAGI_SIZES, tsunagiLevelsOf } from "./levels";
import { allJoined, answerOf, decodeLines, dragTo, encodeLines, letGo, linesOfAnswer, noLines, overBridge, pressAt, type Lines } from "./lines";
import { countSolutions } from "./solve";
import { relettered, transformed } from "./generate";

/**
 * BRIDGES AND WALLS, EVERYWHERE A LINE IS READ. Every twist level the site
 * plays is drawn by dragging along its answer, read back from its answer, kept
 * and read back as a run's progress, and checked as the server checks a solve;
 * and the rules of a bridge and a wall are shown on boards made to show them.
 */
beforeAll(loadEveryTsunagiLevel);

/** Every twist level: its size, number, layout and answer. */
function twistLevels() {
  return TSUNAGI_SIZES.flatMap((size) => tsunagiLevelsOf(size).flatMap(([layout, answer], at) => (isTwist(layout) ? [{ size, level: at + 1, layout, answer }] : [])));
}

/** A line drawn as a finger draws it: a press on its first cell, a step into each after, let go. */
function draw(layout: ReturnType<typeof decodeLayout> & object, lines: Lines, cells: readonly number[]): Lines {
  const pressed = pressAt(layout, lines, cells[0]!);
  let now = pressed.lines;
  for (const cell of cells.slice(1)) now = dragTo(layout, now, pressed.drawing!, cell);
  return letGo(now, layout);
}

describe("every twist level", () => {
  it("has twists to test at every size", () => {
    for (const size of TSUNAGI_SIZES) expect(twistLevels().filter((each) => each.size === size).length, `${size}×${size}`).toBeGreaterThan(0);
  });

  it("reads back from its answer, drawn by dragging, kept as progress and checked as a solve", () => {
    for (const { size, level, layout: code, answer } of twistLevels()) {
      const where = `${size}×${size} level ${level}`;
      const layout = decodeLayout(code, size)!;
      const lines = linesOfAnswer(layout, answer);
      expect(lines, where).not.toBeNull();
      expect(allJoined(layout, lines!), where).toBe(true);
      expect(answerOf(layout, lines!), where).toBe(answer);
      expect(checkTsunagi(size, code, answer), where).toEqual({ ok: true });
      expect(decodeLines(layout, encodeLines(layout, lines!)), where).toEqual(lines);
      // Drawn line by line with the pointer's rules, it comes to the same board.
      let drawn = noLines(layout);
      for (const line of lines!) drawn = draw(layout, drawn, line);
      expect(answerOf(layout, drawn), where).toBe(answer);
      expect(allJoined(layout, drawn), where).toBe(true);
    }
  });

  it("turns with its walls: the same board under a quarter turn is still one board with one answer", () => {
    const { size, layout } = twistLevels().find((each) => each.layout.includes("|"))!;
    const turned = decodeLayout(relettered(transformed(layout, size, 1, false)), size);
    expect(turned).not.toBeNull();
    expect(countSolutions(turned!, 2).count).toBe(1);
  });
});

describe("the rules of a bridge", () => {
  // 5×5: A crosses the middle row, B goes down the middle column over the bridge at the centre.
  //  . . B . .
  //  . . . . .
  //  A . + . A
  //  . . . . .
  //  . . B . .
  const cells = new Array<number>(25).fill(-1);
  cells[2] = 0;
  cells[10] = 1;
  cells[14] = 1;
  cells[22] = 0;
  cells[12] = CELL_BRIDGE;
  const layout = decodeLayout(encodeLayout(cells), 5)!;
  // After lettering in reading order: the stone at 2 is A (down the middle), the one at 10 is B (across).
  const down = [2, 7, 12, 17, 22];
  const across = [10, 11, 12, 13, 14];

  it("lets one line go across and another down, and knows which went which way", () => {
    let lines = draw(layout, noLines(layout), down);
    lines = draw(layout, lines, across);
    expect(overBridge(lines, 12)).toEqual({ across: 1, down: 0 });
  });

  it("never lets a line turn on a bridge", () => {
    const pressed = pressAt(layout, noLines(layout), 10);
    let lines = dragTo(layout, pressed.lines, 1, 11);
    lines = dragTo(layout, lines, 1, 12);
    expect(dragTo(layout, lines, 1, 7)).toBe(lines);
    expect(dragTo(layout, lines, 1, 13)[1]).toEqual([10, 11, 12, 13]);
  });

  it("ends a line let go on a bridge before it, and cuts back another line going the same way over it", () => {
    const pressed = pressAt(layout, noLines(layout), 10);
    const onBridge = dragTo(layout, dragTo(layout, pressed.lines, 1, 11), 1, 12);
    expect(letGo(onBridge, layout)[1]).toEqual([10, 11]);
    // A second line across the same way cuts the first back before the bridge.
    const first = draw(layout, noLines(layout), across);
    const second = pressAt(layout, first, 14);
    const cut = dragTo(layout, dragTo(layout, second.lines, 1, 13), 1, 12);
    expect(cut[1]).toEqual([14, 13, 12]);
  });

  it("presses on a bridge to no effect: two lines may be there", () => {
    const lines = draw(layout, draw(layout, noLines(layout), down), across);
    expect(pressAt(layout, lines, 12)).toEqual({ lines, drawing: null });
  });
});

describe("the rules of a wall", () => {
  // 3×3 with a wall between cells 0 and 1: A cannot step across it.
  const layout = decodeLayout("A.A......|0-1", 3)!;

  it("reads a wall list, and refuses one that is not two neighbouring cells in order", () => {
    expect(layout.walls.has("0-1")).toBe(true);
    expect(decodeLayout("A.A......|0-2", 3)).toBeNull();
    expect(decodeLayout("A.A......|3-4,0-1", 3)).toBeNull();
    expect(decodeLayout("A.A......|", 3)).toBeNull();
  });

  it("stops a drag across it, and lets the line go round", () => {
    const pressed = pressAt(layout, noLines(layout), 0);
    expect(dragTo(layout, pressed.lines, 0, 1)).toBe(pressed.lines);
    expect(dragTo(layout, pressed.lines, 0, 3)[0]).toEqual([0, 3]);
  });

  it("never sits beside a bridge", () => {
    const board = "....A.......+...B....B..A";
    expect(decodeLayout(board, 5), "the board is one without the wall").not.toBeNull();
    expect(decodeLayout(`${board}|7-12`, 5)).toBeNull();
  });
});
