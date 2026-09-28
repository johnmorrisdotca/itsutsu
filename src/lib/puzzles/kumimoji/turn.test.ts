import { describe, expect, it } from "vitest";

import type { Turn } from "./kumimoji.types";
import { squareAt } from "./grid";
import { tableArea } from "./tableView";
import { arrowStep, nextTurn, turnArea, turnPlace, turnView, typingWay, unturnPlace } from "./turn";

const TURNS: readonly Turn[] = [0, 1, 2, 3];

/** Where a view draws the middle of the grid's square (row, col), turned. */
function drawnAt(view: { tile: number; x: number; y: number }, row: number, col: number, turn: Turn) {
  const at = turnPlace(row, col, turn);
  return { x: view.x + (at.col + 0.5) * view.tile, y: view.y + (at.row + 0.5) * view.tile };
}

describe("turning the kumimoji table", () => {
  it("turns a quarter clockwise a press, and four presses come back", () => {
    expect([0, 1, 2, 3].map((turn) => nextTurn(turn as Turn))).toEqual([1, 2, 3, 0]);
  });

  it("draws a word across running right, down, left and up at the four turns", () => {
    // CAT across from (0, 0): its C, A and T, drawn at each turn.
    const cat = (turn: Turn) => [0, 1, 2].map((col) => turnPlace(0, col, turn));
    expect(cat(0)).toEqual([{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]);
    expect(cat(1)).toEqual([{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }]);
    expect(cat(2)).toEqual([{ row: 0, col: 0 }, { row: 0, col: -1 }, { row: 0, col: -2 }]);
    expect(cat(3)).toEqual([{ row: 0, col: 0 }, { row: -1, col: 0 }, { row: -2, col: 0 }]);
    // A word down turns to one running left at a quarter.
    expect(turnPlace(2, 0, 1)).toEqual({ row: 0, col: -2 });
    // Never a "-0" square.
    expect(squareAt(turnPlace(0, 0, 2).row, turnPlace(0, 0, 2).col)).toBe("0,0");
  });

  it("gives back the square it was given, turned and un-turned, at every turn", () => {
    for (const turn of TURNS) {
      for (const [row, col] of [[0, 0], [3, -2], [-5, 7], [1, 1]] as const) {
        const there = turnPlace(row, col, turn);
        expect(unturnPlace(there.row, there.col, turn)).toEqual({ row, col });
        const back = unturnPlace(row, col, turn);
        expect(turnPlace(back.row, back.col, turn)).toEqual({ row, col });
      }
    }
  });

  it("turns twice a turn of one, so each press adds a quarter to what is shown", () => {
    for (const turn of TURNS) {
      const once = turnPlace(4, -3, turn);
      expect(turnPlace(once.row, once.col, 1)).toEqual(turnPlace(4, -3, nextTurn(turn)));
    }
  });

  it("shows the grid's area turned: rows and columns swap at a quarter, and every tile is still inside it", () => {
    const tiles = new Map([[squareAt(0, 0), "c"], [squareAt(0, 1), "a"], [squareAt(0, 2), "t"], [squareAt(1, 0), "o"]]);
    const area = tableArea(tiles);
    for (const turn of TURNS) {
      const shown = turnArea(area, turn);
      expect(shown.rows * shown.cols).toBe(area.rows * area.cols);
      expect([shown.rows, shown.cols]).toEqual(turn % 2 === 0 ? [area.rows, area.cols] : [area.cols, area.rows]);
      for (const square of tiles.keys()) {
        const [row, col] = square.split(",").map(Number) as [number, number];
        const at = turnPlace(row, col, turn);
        expect(at.row).toBeGreaterThanOrEqual(shown.top);
        expect(at.row).toBeLessThan(shown.top + shown.rows);
        expect(at.col).toBeGreaterThanOrEqual(shown.left);
        expect(at.col).toBeLessThan(shown.left + shown.cols);
      }
    }
  });

  it("turns a zoomed view about the middle of its box, keeping the zoom and the square in the middle", () => {
    const view = { tile: 40, x: 37, y: -12 };
    const [width, height] = [358, 480];
    for (const turn of TURNS) {
      const turned = turnView(view, width, height);
      expect(turned.tile).toBe(view.tile);
      // A square drawn a tile right of the middle is drawn a tile below it after a quarter turn.
      const before = drawnAt(view, 2, 3, turn);
      const after = drawnAt(turned, 2, 3, nextTurn(turn));
      expect(after.x - width / 2).toBeCloseTo(-(before.y - height / 2), 6);
      expect(after.y - height / 2).toBeCloseTo(before.x - width / 2, 6);
    }
  });

  it("points the typing cursor the way the letters run on the screen", () => {
    expect(TURNS.map((turn) => typingWay(true, turn).arrow)).toEqual(["→", "↓", "←", "↑"]);
    expect(TURNS.map((turn) => typingWay(false, turn).arrow)).toEqual(["↓", "←", "↑", "→"]);
    expect(typingWay(true, 2).name).toBe("left");
  });

  it("moves the cursor with the arrow keys the way they point on the screen", () => {
    expect(arrowStep("ArrowRight", 0)).toEqual({ row: 0, col: 1 });
    expect(arrowStep("ArrowRight", 2)).toEqual({ row: 0, col: -1 });
    expect(arrowStep("ArrowDown", 1)).toEqual({ row: 0, col: 1 });
    expect(arrowStep("ArrowUp", 3)).toEqual({ row: 0, col: 1 });
    expect(arrowStep("Enter", 0)).toBeNull();
    // Whatever the turn, the grid square an arrow reaches is drawn that way on the screen.
    for (const turn of TURNS) {
      const step = arrowStep("ArrowLeft", turn)!;
      expect(turnPlace(step.row, step.col, turn)).toEqual({ row: 0, col: -1 });
    }
  });
});
