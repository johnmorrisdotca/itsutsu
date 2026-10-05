import { expect, type Page } from "@playwright/test";

import { generatePuzzle } from "../src/lib/puzzles/generate";
import { COVERED, FLAG, jiraiMissing, jiraiWrong } from "../src/lib/puzzles/jirai/board";
import { pencilEngine } from "../src/lib/puzzles/pencil/engines";
import { isPencilKind } from "../src/lib/puzzles/pencil/pencil.constants";
import type { PencilKind } from "../src/lib/puzzles/pencil/pencil.types";
import type { PuzzleKind } from "../src/lib/puzzles/puzzles.types";
import { codeOnPage, makeNextMark, makeWrongMark, pressCell, pressEdge } from "./pencil";

/**
 * THE PUZZLES THAT ARE DRAWN, MOVED BY THE SPECS THAT LOOP OVER EVERY PUZZLE.
 *
 * `puzzle-checks.spec.ts` and `puzzle-hints.spec.ts` run each kind of puzzle
 * through Check, Show and Hint, and reach a number grid's cell by its testid
 * (`puzzle-cell`, `data-value`) and its key. The Pencil puzzles and Jirai have
 * no such element: Kazu draws a board as one SVG and Jirai's squares are
 * buttons of their own (`jirai-cell`). So the three steps those specs make — a
 * first entry, one wrong entry, and what Show and Hint then do to it — are made
 * here for all seven, by pressing the board as a reader does, and the loops call
 * these for them. Every kind still goes through every step; none is skipped.
 *
 * What each board offers instead of a `puzzle-cell`:
 * - `puzzle-play` carries `data-wrong`, the places Show has marked (comma apart, empty when none), for both. The
 *   boards themselves are watched by the pictures' fingerprint (`puzzleArtFingerprint.ts`), so it is on the screen's
 *   section and not on them.
 */
export type DrawnKind = PencilKind | "jirai";

/** Whether a kind is one of the seven these helpers move. */
export function isDrawn(kind: PuzzleKind): kind is DrawnKind {
  return kind === "jirai" || isPencilKind(kind);
}

const square = (page: Page, cell: number) => page.locator(`[data-testid="jirai-cell"][data-cell="${cell}"]`);

/** The answer of the puzzle the specs asked for: they open every grid at the level easy. */
const solutionOf = (kind: DrawnKind, size: number, seed: number) => generatePuzzle(kind, size, "easy", seed);

/** The first covered square that holds no mine. */
async function safeSquare(page: Page, solution: string): Promise<number> {
  const code = await codeOnPage(page);
  return [...code].findIndex((character, cell) => character === COVERED && solution[cell] !== FLAG);
}

/** A flag laid on a square, as a reader lays one: Flag on, a tap, Flag off. */
async function flag(page: Page, cell: number) {
  await page.getByTestId("jirai-flag").click();
  await square(page, cell).click();
  await page.getByTestId("jirai-flag").click();
}

/**
 * The first entry, the one that starts the clock: a Pencil puzzle's first right mark (a number in an empty cell,
 * a rectangle round a printed number), a Jirai square uncovered where no mine is.
 */
export async function firstEntry(page: Page, kind: DrawnKind, size: number, seed: number): Promise<void> {
  const puzzle = solutionOf(kind, size, seed);
  const before = await codeOnPage(page);
  if (kind === "jirai") {
    await square(page, await safeSquare(page, puzzle.solution)).click();
  } else {
    await makeNextMark(page, kind, size, puzzle.solution);
  }
  await expect.poll(() => codeOnPage(page)).not.toBe(before);
}

/** One wrong entry, as a reader makes one, and the place it is on (a cell; on Shikaku the cell the rectangle was drawn on). */
export async function wrongEntry(page: Page, kind: DrawnKind, size: number, seed: number): Promise<number> {
  const puzzle = solutionOf(kind, size, seed);
  if (kind === "jirai") {
    const cell = await safeSquare(page, puzzle.solution);
    await flag(page, cell);
    await expect.poll(async () => (await codeOnPage(page))[cell]).toBe(FLAG);
    return cell;
  }
  await makeWrongMark(page, kind, size, puzzle.givens, puzzle.solution);
  const wrong = pencilEngine(kind).wrong(size, await codeOnPage(page), puzzle.solution);
  expect(wrong, "the wrong mark the spec made is not one the engine finds wrong").not.toHaveLength(0);
  return wrong[0]!;
}

const placeIn = (place: number) => new RegExp(`(^|,)${place}(,|$)`);

/** What Show has put on the board: the place is marked. */
export async function expectMarked(page: Page, place: number): Promise<void> {
  await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-wrong", placeIn(place));
}

/** The mark is gone from the place. */
export async function expectUnmarked(page: Page, place: number): Promise<void> {
  await expect(page.getByTestId("puzzle-play")).not.toHaveAttribute("data-wrong", placeIn(place));
}

/** The wrong entry changed, as a reader changes one: a flag lifted, a number cleared, a rectangle removed. */
export async function changeEntry(page: Page, kind: DrawnKind, size: number, place: number): Promise<void> {
  const before = await codeOnPage(page);
  if (kind === "jirai") await flag(page, place);
  else if (kind === "shikaku") {
    await page.getByTestId("shikaku-remove").click();
    await pressCell(page, kind, size, place);
  } else if (kind === "loop") {
    // A line drawn is a line pressed again.
    await pressEdge(page, size, place);
  } else if (kind === "akari" || kind === "hitori") {
    // A bulb or a shade is put out by pressing the square again.
    await pressCell(page, kind, size, place);
  } else {
    await pressCell(page, kind, size, place);
    await page.getByTestId("puzzle-key-clear").click();
  }
  await expect.poll(() => codeOnPage(page)).not.toBe(before);
}

/**
 * How far the board is from the answer: the marks that are wrong plus the ones still to make. A hint takes this
 * down, by taking a wrong mark off or putting a right one on, and by no more than one on a number (Regions,
 * Cross Sums). A Shikaku hint draws the whole rectangle, and a Jirai hint uncovers a square that may open its
 * neighbours, so on those two it is "at least one", never "none".
 */
export async function distance(page: Page, kind: DrawnKind, size: number, seed: number): Promise<number> {
  const { solution } = solutionOf(kind, size, seed);
  const code = await codeOnPage(page);
  if (kind === "jirai") return jiraiWrong(code, solution).length + jiraiMissing(code, solution);
  const engine = pencilEngine(kind);
  return engine.wrong(size, code, solution).length + engine.missing(size, code, solution);
}

/** Whether a hint on the kind moves the board exactly one mark nearer, or at least one (see `distance`). */
export const HINT_STEP: Record<DrawnKind, "one" | "some"> = { regions: "one", crossSums: "one", akari: "one", loop: "one", hitori: "one", shikaku: "some", jirai: "some" };
