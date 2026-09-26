import { beforeAll, describe, expect, it } from "vitest";

import { decodeLayout, hexNeighboursOf, inHex, layoutStep } from "./code";
import { symmetryKey } from "./generate";
import { challengesOf, tsunagiRole } from "./ladder";
import { loadEveryTsunagiLevel, TSUNAGI_SIZES, tsunagiLevelsOf } from "./levels";
import { decodeLines, dragTo, encodeLines, linesOfAnswer, pressAt } from "./lines";
import { countSolutions } from "./solve";

/**
 * TSUNAGI ON A HEXAGON: Hexversi's honeycomb, six neighbours a cell. The
 * shape, the steps, the drawing and the ladder, on the site's own levels and
 * on boards made to show a rule.
 */
beforeAll(loadEveryTsunagiLevel);

/** A 5×5 hexagon (radius 2): the corners off the board, a pair along each slant. */
const FIVE = "##A.A#....B...B....#...##|hex";

describe("the hexagon's shape", () => {
  it("is the cells within R steps of the middle: 19, 37 and 61 at 5, 7 and 9", () => {
    for (const [size, cells] of [
      [5, 19],
      [7, 37],
      [9, 61],
    ] as const) {
      expect(Array.from({ length: size * size }, (_, at) => at).filter((at) => inHex(size, at))).toHaveLength(cells);
    }
  });

  it("reads `hex` only on an odd board whose corners are `#`, with no walls, bridges or wrap", () => {
    expect(decodeLayout(FIVE, 5)!.hex).toBe(true);
    expect(decodeLayout(FIVE.replace("|hex", ""), 5)!.hex).toBe(false);
    // A corner left open, a wrap, a wall: none of them a hexagon.
    expect(decodeLayout(`.${FIVE.slice(1)}`, 5)).toBeNull();
    expect(decodeLayout(`${FIVE}|wrap`, 5)).toBeNull();
    expect(decodeLayout(FIVE.replace("|hex", "|2-3|hex"), 5)).toBeNull();
    // In its place among the words after the cells: first, and an explosion may follow it.
    expect(decodeLayout(`${FIVE}|boom3`, 5)!.explosions).toEqual({ every: 3, blast: false });
    expect(decodeLayout(FIVE.replace("|hex", "|boom3|hex"), 5)).toBeNull();
  });

  it("is a challenge of its own; its corners are not walls", () => {
    expect(challengesOf(FIVE)).toEqual(["hexagon"]);
    expect(challengesOf(`${FIVE}|boom3`)).toEqual(["explosions", "hexagon"]);
  });
});

describe("six neighbours a cell", () => {
  it("has the four of a square and the two along the slant, up-right and down-left", () => {
    expect(hexNeighboursOf(5, 12).sort((a, b) => a - b)).toEqual([7, 8, 11, 13, 16, 17]);
    const layout = decodeLayout(FIVE, 5)!;
    expect(layoutStep(layout, 12, 8)).toBe(-4);
    expect(layoutStep(layout, 12, 16)).toBe(4);
    // The other diagonal is two steps on a hexagon, never one.
    expect(layoutStep(layout, 12, 6)).toBe(0);
    expect(layoutStep(layout, 12, 18)).toBe(0);
  });

  it("lets a line step along the slant on a hexagon and never on a square", () => {
    const hex = decodeLayout(FIVE, 5)!;
    const started = pressAt(hex, hex.ends.map(() => []), 10);
    expect(dragTo(hex, started.lines, started.drawing!, 6)[started.drawing!]).toEqual([10, 6]);
    const square = decodeLayout(FIVE.replace(/#/g, ".").replace("|hex", ""), 5)!;
    const onSquare = pressAt(square, square.ends.map(() => []), 10);
    expect(dragTo(square, onSquare.lines, onSquare.drawing!, 6)[onSquare.drawing!]).toEqual([10]);
  });
});

describe("the hexagon levels", () => {
  const hexLevels = () => TSUNAGI_SIZES.flatMap((size) => tsunagiLevelsOf(size).flatMap(([layout, answer], at) => (decodeLayout(layout, size)!.hex ? [{ size, level: at + 1, layout, answer }] : [])));

  it("are at the odd sizes, as the 15th and 16th of their blocks", () => {
    const levels = hexLevels();
    expect(levels.length).toBeGreaterThan(0);
    for (const { size, level } of levels) {
      expect(size % 2, `${size}×${size} level ${level}`).toBe(1);
      expect(tsunagiRole(size, level), `${size}×${size} level ${level}`).not.toBeNull();
    }
  });

  it("have one answer each, which reads back as lines and is kept and read back as progress", () => {
    for (const { size, level, layout: code, answer } of hexLevels()) {
      const layout = decodeLayout(code, size)!;
      const solved = countSolutions(layout, 2);
      expect(solved.count, `${size}×${size} level ${level}`).toBe(1);
      const lines = linesOfAnswer(layout, answer)!;
      expect(lines, `${size}×${size} level ${level}`).not.toBeNull();
      expect(decodeLines(layout, encodeLines(layout, lines))).toEqual(lines);
      // A slanting step is kept as one: `u` or `v`.
      expect(encodeLines(layout, lines)).toMatch(/[uv]/);
    }
  });

  it("are told apart from each other only by the turns that keep the lattice", () => {
    for (const { size, layout } of hexLevels()) {
      const key = symmetryKey(layout, size);
      expect(decodeLayout(key, size), key).not.toBeNull();
      expect(decodeLayout(key, size)!.hex).toBe(true);
    }
  });
});
