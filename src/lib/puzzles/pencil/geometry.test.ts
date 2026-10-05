import { drawAkari } from "@johnmorrisdotca/kazu/akari/draw";
import { drawFillomino } from "@johnmorrisdotca/kazu/fillomino/draw";
import { drawHitori } from "@johnmorrisdotca/kazu/hitori/draw";
import { drawKakuro } from "@johnmorrisdotca/kazu/kakuro/draw";
import { drawShikaku } from "@johnmorrisdotca/kazu/shikaku/draw";
import { drawSlitherlink } from "@johnmorrisdotca/kazu/slitherlink/draw";
import { slitherlinkCellEdges } from "@johnmorrisdotca/kazu/slitherlink";
import { describe, expect, it } from "vitest";

import { akariBoardOf } from "./akari";
import { cellAt, edgeAt, PENCIL_GEOMETRY } from "./geometry";
import { fillominoBoardOf } from "./fillomino";
import { hitoriBoardOf } from "./hitori";
import { kakuroBoardOf } from "./kakuro";
import { pencilEngine } from "./engines";
import { shikakuBoardOf } from "./shikaku";
import { slitherlinkBoardOf } from "./slitherlink";
import type { PencilKind } from "./pencil.types";

/** The viewBox a drawing says it has, and the side of a cell as the package draws it. */
function viewBoxOf(svg: string): number[] {
  return /viewBox="([^"]+)"/.exec(svg)![1]!.split(" ").map(Number);
}

describe("the geometry is the package's drawing's", () => {
  const SIZES: Record<PencilKind, number> = { shikaku: 7, akari: 7, loop: 5, hitori: 5, regions: 5, crossSums: 10 };
  const drawn = (kind: PencilKind): string => {
    const size = SIZES[kind];
    const { givens } = pencilEngine(kind).make(size, "easy", 3);
    switch (kind) {
      case "shikaku": return drawShikaku(shikakuBoardOf(size, givens)!);
      case "akari": return drawAkari(akariBoardOf(size, givens)!);
      case "loop": return drawSlitherlink(slitherlinkBoardOf(size, givens)!);
      case "hitori": return drawHitori(hitoriBoardOf(size, givens)!);
      case "regions": return drawFillomino(fillominoBoardOf(size, givens)!);
      case "crossSums": return drawKakuro(kakuroBoardOf(size, givens)!);
    }
  };

  it.each(Object.keys(SIZES) as PencilKind[])("%s: a viewBox that starts `pad` before the board and is a board and two pads across", (kind) => {
    const size = SIZES[kind];
    const { unit, pad } = PENCIL_GEOMETRY[kind];
    const [x, y, width, height] = viewBoxOf(drawn(kind));
    expect([x! + pad, y! + pad]).toEqual([0, 0]);
    expect([width, height]).toEqual([size * unit + 2 * pad, size * unit + 2 * pad]);
  });
});

describe("a press is a cell", () => {
  it("is the cell under the point, and none outside the board", () => {
    const size = 5;
    const { unit, pad } = PENCIL_GEOMETRY.akari;
    const whole = size * unit + 2 * pad;
    const centre = (column: number, row: number) => ({ x: (pad + (column + 0.5) * unit) / whole, y: (pad + (row + 0.5) * unit) / whole });
    expect(cellAt("akari", size, centre(0, 0))).toBe(0);
    expect(cellAt("akari", size, centre(4, 0))).toBe(4);
    expect(cellAt("akari", size, centre(2, 3))).toBe(17);
    expect(cellAt("akari", size, { x: 0, y: 0 })).toBeNull();
    expect(cellAt("akari", size, { x: 0.999, y: 0.5 })).toBeNull();
  });
});

describe("a press on a Loop (Slitherlink) board is an edge", () => {
  const size = 5;
  const { unit, pad } = PENCIL_GEOMETRY.loop;
  const whole = size * unit + 2 * pad;
  const at = (column: number, row: number, lu: number, lv: number) => ({ x: (pad + (column + lu) * unit) / whole, y: (pad + (row + lv) * unit) / whole });

  it("is the side of the cell it is nearest, and Kazu's own number for that side", () => {
    const board = slitherlinkBoardOf(size, ".".repeat(size * size))!;
    for (let cell = 0; cell < size * size; cell += 1) {
      const column = cell % size;
      const row = Math.floor(cell / size);
      const [top, right, bottom, left] = slitherlinkCellEdges(board, cell)!;
      expect(edgeAt(size, at(column, row, 0.5, 0.1))).toBe(top);
      expect(edgeAt(size, at(column, row, 0.9, 0.5))).toBe(right);
      expect(edgeAt(size, at(column, row, 0.5, 0.9))).toBe(bottom);
      expect(edgeAt(size, at(column, row, 0.1, 0.5))).toBe(left);
    }
  });

  it("is none outside the board", () => {
    expect(edgeAt(size, { x: 0, y: 0 })).toBeNull();
    expect(edgeAt(size, { x: 1, y: 1 })).toBeNull();
  });
});
