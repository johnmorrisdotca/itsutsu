import { expect, test, type Page } from "@playwright/test";

import { decodeLayout, inHex } from "@johnmorrisdotca/tsunagi";
import { tsunagiRole } from "@johnmorrisdotca/tsunagi";
import { linesOfAnswer } from "@johnmorrisdotca/tsunagi";
import { TSUNAGI_7 } from "@johnmorrisdotca/tsunagi/levels-7";
import { ready } from "./support";

/**
 * TSUNAGI ON A HEXAGON, played by dragging. John, 2026-09-26: Tsunagi on a
 * honeycomb, Hexversi's hex lattice, lines running between six neighbours. The
 * spec draws the answer through the centres of the hexagons as the page shows
 * them — along the slants too — and finishes the level; at a phone's width it
 * checks the board fits and a drag never scrolls the page.
 */
const AT = "/games/tsunagi";
const SIZE = 7;

/** The first 7×7 hexagon level in a role. */
function hexLevel(role: "teaches" | "tests"): number {
  return TSUNAGI_7.findIndex(([layout], index) => layout.endsWith("|hex") && tsunagiRole(SIZE, index + 1)?.role === role) + 1;
}

async function playLevel(page: Page, level: number) {
  await page.addInitScript(
    ([size, last]) => window.localStorage.setItem(`itsutsu.tsunagi.solved.${size}@2026-09-26`, JSON.stringify(Object.fromEntries(Array.from({ length: last }, (_, at) => [at + 1, 60_000])))),
    [SIZE, level - 1],
  );
  await page.goto(`${AT}/play?size=${SIZE}&seed=${level}`);
  await ready(page, "puzzle-play");
  if ((await page.getByTestId("puzzle-play").getAttribute("data-reviewing")) === "true") await page.getByTestId("tsunagi-restart-solved").click();
  await expect(page.getByTestId("tsunagi-line")).toHaveCount(0);
}

/** A line drawn through the middle of each cell as the page draws it. */
async function drag(page: Page, cells: readonly number[]) {
  await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
  const centre = async (cell: number) => {
    const box = (await page.locator(`[data-testid="puzzle-cell"][data-index="${cell}"]`).boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  const from = await centre(cells[0]!);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (const cell of cells.slice(1)) {
    const to = await centre(cell);
    await page.mouse.move(to.x, to.y, { steps: 4 });
  }
  await page.mouse.up();
}

test.describe("Tsunagi on a hexagon", () => {
  test("a block's 15th teaches the hexagon: six neighbours a cell, and the level solved along the slants", async ({ page }) => {
    const level = hexLevel("teaches");
    expect(level).toBeGreaterThan(0);
    const [code, answer] = TSUNAGI_7[level - 1]!;
    const layout = decodeLayout(code, SIZE)!;
    await playLevel(page, level);
    await expect(page.getByTestId("tsunagi-board")).toHaveAttribute("data-hex", "true");
    await expect(page.getByTestId("tsunagi-chip-hexagon")).toBeVisible();
    await expect(page.getByTestId("tsunagi-chip-teaches")).toContainText("Hexagon");
    // The hexagon's 37 cells, and none of the square's corners.
    await expect(page.getByTestId("puzzle-cell")).toHaveCount(Array.from({ length: SIZE * SIZE }, (_, at) => at).filter((at) => inHex(SIZE, at)).length);
    await expect(page.getByTestId("tsunagi-hex-cell")).toHaveCount(37);
    const lines = linesOfAnswer(layout, answer)!;
    // The answer takes a slanting step somewhere: the whole point of the board.
    expect(lines.some((line) => line.some((cell, at) => at > 0 && Math.abs(cell - line[at - 1]!) === SIZE - 1))).toBe(true);
    for (const line of lines) await drag(page, line);
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });

  test("its partner tests it, and at a phone's width the board fits and a drag never scrolls the page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const level = hexLevel("tests");
    expect(level).toBeGreaterThan(0);
    const [code, answer] = TSUNAGI_7[level - 1]!;
    await playLevel(page, level);
    await expect(page.getByTestId("tsunagi-chip-tests")).toBeVisible();
    const box = (await page.getByTestId("tsunagi-board").boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const lines = linesOfAnswer(decodeLayout(code, SIZE)!, answer)!;
    await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    await drag(page, lines[0]!);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
    for (const line of lines.slice(1)) await drag(page, line);
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });
});
