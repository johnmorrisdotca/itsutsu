import { describe, expect, it } from "vitest";

import { decodeLayout, encodeLayout, layoutCells } from "./code";
import { explosionAfter, strokesToExplosion } from "./explosions";
import { relettered, transformed } from "./generate";
import { challengesOf } from "./ladder";
import type { Lines } from "./lines";

/**
 * EXPLOSIONS: the rule on boards made to show it. Three pairs on a 4×4, each
 * along its own row, and a fourth row empty: A at 0 and 3, B at 4 and 7, C at
 * 8 and 11.
 */
const CELLS = "A..AB..BC..C....";
const board = (tail: string) => decodeLayout(CELLS + tail, 4)!;
const drawn: Lines = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10],
];

describe("the layout says how often, and how hard", () => {
  it("reads boom and blast after the walls and wrap, once, and nowhere else", () => {
    expect(board("|boom4").explosions).toEqual({ every: 4, blast: false });
    expect(board("|blast5").explosions).toEqual({ every: 5, blast: true });
    expect(board("|1-2|wrap|boom3").explosions).toEqual({ every: 3, blast: false });
    expect(board("|1-2|wrap|boom3").wrap).toBe(true);
    expect(board("").explosions).toBeNull();
    expect(decodeLayout(`${CELLS}|boom3|wrap`, 4)).toBeNull();
    expect(decodeLayout(`${CELLS}|boom3|blast3`, 4)).toBeNull();
    expect(decodeLayout(`${CELLS}|boom0`, 4)).toBeNull();
    expect(decodeLayout(`${CELLS}|boom`, 4)).toBeNull();
  });

  it("writes them back the one way, and a turned board keeps them", () => {
    const layout = board("|1-2|blast5");
    expect(encodeLayout(layout.cells.map((cell) => (cell >= 0 ? cell : -1)), layout.walls, { explosions: layout.explosions })).toBe(`${CELLS}|1-2|blast5`);
    const turned = relettered(transformed(`${CELLS}|1-2|blast5`, 4, 1, false));
    expect(turned.endsWith("|blast5")).toBe(true);
    expect(decodeLayout(turned, 4)!.explosions).toEqual({ every: 5, blast: true });
  });

  it("is a challenge of its own, never taken for walls", () => {
    expect(challengesOf(`${CELLS}|boom4`)).toEqual(["explosions"]);
    expect(challengesOf(`${CELLS}|1-2|blast5`)).toEqual(["walls", "explosions"]);
    expect(layoutCells(`${CELLS}|boom4`)).toBe(CELLS);
  });
});

describe("an explosion", () => {
  it("counts down to the stroke that sets it off, and starts again after", () => {
    const layout = board("|boom3");
    expect([0, 1, 2, 3, 4].map((strokes) => strokesToExplosion(layout, strokes))).toEqual([3, 2, 1, 3, 2]);
    expect(strokesToExplosion(board(""), 2)).toBeNull();
  });

  it("goes off only on every n-th stroke, and never on a board without them", () => {
    const layout = board("|boom3");
    expect(explosionAfter(layout, CELLS + "|boom3", drawn, 1)).toBeNull();
    expect(explosionAfter(layout, CELLS + "|boom3", drawn, 2)).toBeNull();
    expect(explosionAfter(layout, CELLS + "|boom3", drawn, 3)).not.toBeNull();
    expect(explosionAfter(layout, CELLS + "|boom3", drawn, 6)).not.toBeNull();
    expect(explosionAfter(board(""), CELLS, drawn, 3)).toBeNull();
  });

  it("with nothing drawn, breaks nothing", () => {
    expect(explosionAfter(board("|boom3"), CELLS + "|boom3", [[], [], []], 3)).toBeNull();
  });

  it("boom: cuts one drawn line back to half, and leaves the others and its input alone", () => {
    const layout = board("|boom3");
    const before = JSON.stringify(drawn);
    const blown = explosionAfter(layout, CELLS + "|boom3", drawn, 3)!;
    expect(blown.hit).toHaveLength(1);
    const pair = blown.hit[0]!;
    expect(blown.lines[pair]).toEqual(drawn[pair]!.length / 2 >= 2 ? drawn[pair]!.slice(0, Math.floor(drawn[pair]!.length / 2)) : []);
    blown.lines.forEach((line, other) => other !== pair && expect(line).toEqual(drawn[other]));
    expect(blown.cells.every((cell) => drawn[pair]!.includes(cell) && !blown.lines[pair]!.includes(cell))).toBe(true);
    expect(JSON.stringify(drawn)).toBe(before);
  });

  it("blast: wipes one line and cuts a line beside it back to half", () => {
    const layout = board("|blast3");
    const blown = explosionAfter(layout, CELLS + "|blast3", drawn, 3)!;
    expect(blown.hit).toHaveLength(2);
    const [wiped, beside] = blown.hit as [number, number];
    expect(blown.lines[wiped]).toEqual([]);
    // Rows are neighbours only one apart: A and C never touch.
    expect(Math.abs(wiped - beside)).toBe(1);
    expect(blown.lines[beside]!.length).toBeLessThan(drawn[beside]!.length);
  });

  it("chooses the same line for the same board and strokes, and not always the same one", () => {
    const layout = board("|boom1");
    const code = CELLS + "|boom1";
    expect(explosionAfter(layout, code, drawn, 5)).toEqual(explosionAfter(layout, code, drawn, 5));
    const chosen = new Set(Array.from({ length: 30 }, (_, at) => explosionAfter(layout, code, drawn, at + 1)!.hit[0]));
    expect(chosen.size).toBe(3);
  });

  it("never leaves a line ending on a bridge", () => {
    // A runs down the second column over a bridge at 5; halved, it would end on it.
    const code = ".A..B+.B.A......|boom1";
    const layout = decodeLayout(code, 4)!;
    const lines: Lines = [[1, 5, 9], [4, 5, 6, 7]];
    for (let stroke = 1; stroke <= 20; stroke += 1) {
      const blown = explosionAfter(layout, code, lines, stroke)!;
      for (const line of blown.lines) if (line.length > 0) expect(layout.cells[line[line.length - 1]!]).not.toBe(-3);
    }
  });
});
