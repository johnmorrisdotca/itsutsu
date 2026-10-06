import type { CDPSession, Page } from "@playwright/test";

import type { LinkLayout } from "@johnmorrisdotca/tsunagi";

/**
 * A FINGER DRAWING A TSUNAGI LINE, for the browser specs: where a finger goes to draw a line of an answer, and the
 * touches that send it through Chromium's own input protocol, which is how a phone's finger arrives (a mouse the
 * page sees as a mouse).
 *
 * Through a portal the finger does not follow the line: it goes into the first ring, and the line comes out of the
 * other by itself, going on where the finger, a step on, then moves it (`dragFinger`'s reach). So a finger's way
 * is the line's own steps with a portal passage counted as the one step into its ring, and where that way would
 * leave the board the finger is let go and takes the line up again by its end: a stroke each. (A board that wraps
 * is not drawn this way: a line across its join is the finger's own step onto the ghost of the far edge.)
 */
export type Stroke = { start: number; cells: number[] };

/** The strokes that draw `line` on a board: each starts on a cell of the line and goes through the cells the finger crosses. */
export function strokesOf(layout: LinkLayout, line: readonly number[]): Stroke[] {
  const size = layout.size;
  const strokes: Stroke[] = [];
  let stroke: Stroke = { start: line[0]!, cells: [] };
  let row = Math.floor(line[0]! / size);
  let col = line[0]! % size;
  for (let at = 1; at < line.length; at += 1) {
    const [before, cell] = [line[at - 1]!, line[at]!];
    // The line comes out of the second ring and on into the cell beyond it by itself: neither is a step of the finger's.
    if (layout.portals.has(before)) continue;
    const [dr, dc] = [Math.floor(cell / size) - Math.floor(before / size), (cell % size) - (before % size)];
    if (row + dr < 0 || row + dr >= size || col + dc < 0 || col + dc >= size) {
      // Off the board: let go, and take the line up again by its end, where it is.
      strokes.push(stroke);
      stroke = { start: before, cells: [] };
      row = Math.floor(before / size);
      col = before % size;
    }
    row += dr;
    col += dc;
    stroke.cells.push(row * size + col);
  }
  strokes.push(stroke);
  // A stroke that goes nowhere is a tap, which would clear what it is on.
  return strokes.filter((each) => each.cells.length > 0);
}

/** Where a cell's middle is on the page, read as the board stands now. */
export type Where = (cell: number) => Promise<{ x: number; y: number }>;

/** A finger (a mouse) drawing each stroke: down on its first cell, moved through the rest, and let go. */
export async function drawWithMouse(page: Page, where: Where, strokes: readonly Stroke[]) {
  for (const stroke of strokes) {
    const from = await where(stroke.start);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    for (const cell of stroke.cells) {
      const to = await where(cell);
      await page.mouse.move(to.x, to.y, { steps: 3 });
    }
    await page.mouse.up();
  }
}

/** The same with a touch: Chromium's own touch events, as a phone's finger sends them. */
export async function drawWithTouch(session: CDPSession, where: Where, strokes: readonly Stroke[]) {
  for (const stroke of strokes) {
    const from = await where(stroke.start);
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from.x, y: from.y }] });
    for (const cell of stroke.cells) {
      const to = await where(cell);
      await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: to.x, y: to.y }] });
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
}
