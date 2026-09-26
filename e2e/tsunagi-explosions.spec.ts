import { expect, test, type Page } from "@playwright/test";

import { decodeLayout } from "../src/lib/puzzles/tsunagi/code";
import { explosionAfter } from "../src/lib/puzzles/tsunagi/explosions";
import { challengesOf, tsunagiRole } from "../src/lib/puzzles/tsunagi/ladder";
import { linesOfAnswer, type Lines } from "../src/lib/puzzles/tsunagi/lines";
import { TSUNAGI_6 } from "../src/lib/puzzles/tsunagi/levels/size6.data";
import { TSUNAGI_7 } from "../src/lib/puzzles/tsunagi/levels/size7.data";
import { ready } from "./support";

/**
 * TSUNAGI'S EXPLOSIONS, played by dragging. John's row: every so many strokes
 * a drawn line is broken, with a warning first, and which line is decided by
 * the level and the strokes made. The spec draws the answer a line a stroke,
 * reads the warning a stroke before, and checks the page broke exactly the line
 * `explosionAfter` says — then finishes the level, so an explosion level is
 * shown to be solvable by a finger, not only by a solver.
 */
const AT = "/games/tsunagi";

/** The first level at a size that holds an explosion in the given role. */
function explosionLevel(levels: readonly (readonly [string, string])[], size: number, role: "teaches" | "tests"): number {
  return levels.findIndex(([layout], index) => challengesOf(layout).includes("explosions") && tsunagiRole(size, index + 1)?.role === role) + 1;
}

async function drag(page: Page, size: number, cells: readonly number[]) {
  // The whole board in the window: a mouse cannot drag below its edge, and a 6×6 board's last row is there on a laptop's height.
  await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
  const box = (await page.getByTestId("tsunagi-board").boundingBox())!;
  const centre = (cell: number) => ({ x: box.x + (((cell % size) + 0.5) * box.width) / size, y: box.y + ((Math.floor(cell / size) + 0.5) * box.height) / size });
  const from = centre(cells[0]!);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (const cell of cells.slice(1)) {
    const to = centre(cell);
    await page.mouse.move(to.x, to.y, { steps: 4 });
  }
  await page.mouse.up();
}

/** Opens a level with every level before it solved in this browser, fresh even where the account solved it before. */
async function playLevel(page: Page, size: number, level: number) {
  await page.addInitScript(
    ([at, last]) => window.localStorage.setItem(`itsutsu.tsunagi.solved.${at}@2026-09-26`, JSON.stringify(Object.fromEntries(Array.from({ length: last }, (_, each) => [each + 1, 60_000])))),
    [size, level - 1],
  );
  await page.goto(`${AT}/play?size=${size}&seed=${level}`);
  await ready(page, "puzzle-play");
  if ((await page.getByTestId("puzzle-play").getAttribute("data-reviewing")) === "true") await page.getByTestId("tsunagi-restart-solved").click();
  await expect(page.getByTestId("tsunagi-line")).toHaveCount(0);
}

/** How many cells each pair's line has on the page, 0 for none. */
async function drawnOnPage(page: Page, pairs: number): Promise<number[]> {
  const out = new Array<number>(pairs).fill(0);
  for (const line of await page.getByTestId("tsunagi-line").all()) out[Number(await line.getAttribute("data-pair"))] = Number(await line.getAttribute("data-cells"));
  return out;
}

/**
 * Draws the answer a line a stroke up to the stroke that sets off the first
 * explosion, checks the warning before it and the lines after it against the
 * rule, then redraws until the level is solved.
 */
async function explodeThenSolve(page: Page, size: number, level: number, code: string, answer: string, word: "Boom!" | "Blast!") {
  const layout = decodeLayout(code, size)!;
  const every = layout.explosions!.every;
  const lines = linesOfAnswer(layout, answer)!;
  const countdown = page.getByTestId("tsunagi-boom-countdown");
  await expect(countdown).toHaveAttribute("data-left", String(every));
  let now: Lines = lines.map(() => []);
  for (let stroke = 1; stroke < every; stroke += 1) {
    await drag(page, size, lines[stroke - 1]!);
    now = now.map((line, pair) => (pair === stroke - 1 ? lines[pair]! : line));
    await expect(countdown).toHaveAttribute("data-strokes", String(stroke));
  }
  // The warning beat: the next stroke sets one off.
  await expect(countdown).toHaveAttribute("data-left", "1");
  await expect(countdown).toContainText("The next stroke sets off an explosion");
  await drag(page, size, lines[every - 1]!);
  now = now.map((line, pair) => (pair === every - 1 ? lines[pair]! : line));
  const expected = explosionAfter(layout, code, now, every)!;
  await expect(countdown).toContainText(word);
  await expect(page.getByTestId("tsunagi-blast").first()).toBeVisible();
  // Exactly the line (or lines) the rule chose, broken as it says; the rest as drawn.
  await expect.poll(() => drawnOnPage(page, lines.length)).toEqual(expected.lines.map((line) => line.length));
  // An explosion is not taken back.
  await expect(page.getByTestId("tsunagi-undo")).toBeDisabled();
  await expect(countdown).toHaveAttribute("data-left", String(every));
  // Redraw whatever is not whole, a line a stroke, until the level is solved.
  for (let round = 0; round < 6 && !(await page.getByTestId("puzzle-done").isVisible()); round += 1) {
    const onPage = await drawnOnPage(page, lines.length);
    for (const [pair, line] of lines.entries()) {
      if (await page.getByTestId("puzzle-done").isVisible()) break;
      if (onPage[pair] !== line.length) await drag(page, size, line);
    }
  }
  await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  expect(level).toBeGreaterThan(0);
}

test.describe("Tsunagi explosions", () => {
  test("a block's 15th teaches them: a count, a warning, a boom that halves the line the rule chose, and the level still solved", async ({ page }) => {
    const level = explosionLevel(TSUNAGI_6, 6, "teaches");
    const [code, answer] = TSUNAGI_6[level - 1]!;
    await playLevel(page, 6, level);
    await expect(page.getByTestId("tsunagi-chip-explosions")).toBeVisible();
    await expect(page.getByTestId("tsunagi-chip-teaches")).toContainText("Explosions");
    await explodeThenSolve(page, 6, level, code, answer, "Boom!");
  });

  test("a block's 16th tests them with a blast: a line wiped and the one beside it cut", async ({ page }) => {
    const level = TSUNAGI_7.findIndex(([layout], index) => /\|blast\d+$/.test(layout) && tsunagiRole(7, index + 1)?.role === "tests") + 1;
    expect(level).toBeGreaterThan(0);
    const [code, answer] = TSUNAGI_7[level - 1]!;
    await playLevel(page, 7, level);
    await expect(page.getByTestId("tsunagi-chip-tests")).toBeVisible();
    await explodeThenSolve(page, 7, level, code, answer, "Blast!");
  });

  test("Restart starts the count again", async ({ page }) => {
    const level = explosionLevel(TSUNAGI_6, 6, "teaches");
    const [code, answer] = TSUNAGI_6[level - 1]!;
    const layout = decodeLayout(code, 6)!;
    await playLevel(page, 6, level);
    const countdown = page.getByTestId("tsunagi-boom-countdown");
    await drag(page, 6, linesOfAnswer(layout, answer)![0]!);
    await expect(countdown).toHaveAttribute("data-strokes", "1");
    await page.getByTestId("tsunagi-restart").click();
    await expect(countdown).toHaveAttribute("data-strokes", "0");
    await expect(countdown).toHaveAttribute("data-left", String(layout.explosions!.every));
  });
});
