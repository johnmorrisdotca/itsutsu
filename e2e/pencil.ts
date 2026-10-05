import { expect, type Page } from "@playwright/test";

import { PENCIL_GEOMETRY } from "../src/lib/puzzles/pencil/geometry";
import { pencilEngine } from "../src/lib/puzzles/pencil/engines";
import type { PencilKind } from "../src/lib/puzzles/pencil/pencil.types";
import { shikakuRectsOf } from "../src/lib/puzzles/pencil/shikaku";

/**
 * Driving a pencil puzzle the way a reader does: presses on the drawn board.
 * The board is Kazu's SVG, with no element per cell to click, so a press is
 * a mouse click at the point a cell or an edge is drawn at, worked out from the
 * board's own box and the package's geometry (`geometry.ts`, held to the
 * drawing by `geometry.test.ts`).
 */

/** The board's drawing on the page, scrolled into view. */
async function drawing(page: Page) {
  const svg = page.getByTestId("puzzle-grid").locator("svg").first();
  await svg.scrollIntoViewIfNeeded();
  return svg;
}

/** A click at a point of the board given in the drawing's own units (a cell is `unit` across, the board starts at 0). */
async function clickAt(page: Page, kind: PencilKind, size: number, u: number, v: number) {
  const { unit, pad } = PENCIL_GEOMETRY[kind];
  const box = (await (await drawing(page)).boundingBox())!;
  const whole = size * unit + 2 * pad;
  await page.mouse.click(box.x + ((u * unit + pad) / whole) * box.width, box.y + ((v * unit + pad) / whole) * box.height);
}

/** A press on a cell, at its middle. */
export async function pressCell(page: Page, kind: PencilKind, size: number, cell: number) {
  await clickAt(page, kind, size, (cell % size) + 0.5, Math.floor(cell / size) + 0.5);
}

/**
 * A press on an edge of a Loop board, a little inside the cell it borders (on the side the board has), where the
 * press means exactly that edge: the nearest side of the cell under it (`edgeAt`). Horizontal edges are numbered
 * first, `size + 1` rows of `size`, and then the vertical ones, `size` rows of `size + 1`.
 */
export async function pressEdge(page: Page, size: number, edge: number) {
  const horizontal = size * (size + 1);
  const inset = 0.15;
  if (edge < horizontal) {
    const row = Math.floor(edge / size);
    await clickAt(page, "loop", size, (edge % size) + 0.5, row < size ? row + inset : row - inset);
  } else {
    const at = edge - horizontal;
    const column = at % (size + 1);
    await clickAt(page, "loop", size, column < size ? column + inset : column - inset, Math.floor(at / (size + 1)) + 0.5);
  }
}

/** The code the board holds, as the page says it. */
export async function codeOnPage(page: Page): Promise<string> {
  return (await page.getByTestId("puzzle-play").getAttribute("data-code")) ?? "";
}

/**
 * Makes the next right mark of the answer, as a reader would, and waits for the
 * board to say it was made. Returns the code the page now holds, or null when the
 * board already is the answer.
 */
export async function makeNextMark(page: Page, kind: PencilKind, size: number, solution: string): Promise<string | null> {
  const before = await codeOnPage(page);
  const next = pencilEngine(kind).fix(size, before, solution);
  if (next === null) return null;
  if (kind === "shikaku") {
    const rect = shikakuRectsOf(size, solution)!.find((each) => each.y * size + each.x === next.at)!;
    await pressCell(page, kind, size, next.at);
    await pressCell(page, kind, size, (rect.y + rect.height - 1) * size + rect.x + rect.width - 1);
  } else if (kind === "regions" || kind === "crossSums") {
    await pressCell(page, kind, size, next.at);
    const digit = solution[next.at]!;
    await page.getByTestId(digit === "." ? "puzzle-key-clear" : `puzzle-key-${Number.parseInt(digit, 36)}`).click();
  } else if (kind === "loop") {
    await pressEdge(page, size, next.at);
  } else {
    // A bulb or a shade: one press on the square.
    await pressCell(page, kind, size, next.at);
  }
  await expect.poll(() => codeOnPage(page)).toBe(next.code);
  return next.code;
}

/** Makes a mark the answer does not have, by pressing the board: a rectangle, a bulb, a shade, a line or a wrong number. */
export async function makeWrongMark(page: Page, kind: PencilKind, size: number, givens: string, solution: string): Promise<void> {
  const before = await codeOnPage(page);
  const first = (test: (place: number) => boolean): number => [...before].findIndex((_, place) => test(place));
  if (kind === "shikaku") {
    // A rectangle of one cell where no number is: never part of the answer.
    const cell = first((place) => givens[place] === "." && before[place] === ".");
    await pressCell(page, kind, size, cell);
    await pressCell(page, kind, size, cell);
  } else if (kind === "akari" || kind === "hitori" || kind === "loop") {
    // A bulb, a shade or a line where the answer has none: the first place the answer leaves blank that a press can mark.
    const place = first((at) => solution[at] === "." && before[at] === "." && (kind !== "akari" || givens[at] === "."));
    if (kind === "loop") await pressEdge(page, size, place);
    else await pressCell(page, kind, size, place);
  } else {
    // The code, not the givens, says which cell is empty: a Cross Sums board's givens are longer than its cells.
    const cell = first((place) => before[place] === ".");
    await pressCell(page, kind, size, cell);
    const right = Number.parseInt(solution[cell]!, 36);
    await page.getByTestId(`puzzle-key-${right === 9 ? 1 : right + 1}`).click();
  }
  await expect.poll(() => codeOnPage(page)).not.toBe(before);
}
