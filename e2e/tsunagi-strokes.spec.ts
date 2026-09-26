import { expect, test, type Page } from "@playwright/test";

import { decodeLayout } from "../src/lib/puzzles/tsunagi/code";
import { tsunagiRole } from "../src/lib/puzzles/tsunagi/ladder";
import { linesOfAnswer } from "../src/lib/puzzles/tsunagi/lines";
import { TSUNAGI_6 } from "../src/lib/puzzles/tsunagi/levels/size6.data";
import { ready } from "./support";

/**
 * HARDER WITHOUT NEW RULES, played by dragging: a stroke limit, where every
 * lift that changed the board spends one, and a sparse board of few, long
 * lines. John, 2026-09-26. The spec solves a limited level inside its limit,
 * runs out on its partner and is let back in only by Restart, and solves a
 * sparse board.
 */
const AT = "/games/tsunagi";
const SIZE = 6;

function levelWith(word: RegExp, role: "teaches" | "tests"): number {
  return TSUNAGI_6.findIndex(([layout], index) => word.test(layout) && tsunagiRole(SIZE, index + 1)?.role === role) + 1;
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

async function drag(page: Page, cells: readonly number[]) {
  await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
  const box = (await page.getByTestId("tsunagi-board").boundingBox())!;
  const centre = (cell: number) => ({ x: box.x + (((cell % SIZE) + 0.5) * box.width) / SIZE, y: box.y + ((Math.floor(cell / SIZE) + 0.5) * box.height) / SIZE });
  const from = centre(cells[0]!);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (const cell of cells.slice(1)) {
    const to = centre(cell);
    await page.mouse.move(to.x, to.y, { steps: 4 });
  }
  await page.mouse.up();
}

test.describe("Tsunagi: harder without new rules", () => {
  test("a stroke limit counts every lift down, and the level is solved inside it", async ({ page }) => {
    const level = levelWith(/\|strokes\d+$/, "teaches");
    expect(level).toBeGreaterThan(0);
    const [code, answer] = TSUNAGI_6[level - 1]!;
    const layout = decodeLayout(code, SIZE)!;
    await playLevel(page, level);
    await expect(page.getByTestId("tsunagi-chip-strokes")).toBeVisible();
    const left = page.getByTestId("tsunagi-strokes-left");
    await expect(left).toHaveAttribute("data-left", String(layout.strokes));
    const lines = linesOfAnswer(layout, answer)!;
    // A stroke spent on half a line, then the line again, whole: two strokes for one line, and Undo gives none back.
    await drag(page, lines[0]!.slice(0, 2));
    await expect(left).toHaveAttribute("data-left", String(layout.strokes! - 1));
    await page.getByTestId("tsunagi-undo").click();
    await expect(left).toHaveAttribute("data-left", String(layout.strokes! - 1));
    for (const line of lines) await drag(page, line);
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });

  test("its partner has no stroke to spare: one wasted, the board runs out, and only Restart lets you in again", async ({ page }) => {
    const level = levelWith(/\|strokes\d+$/, "tests");
    expect(level).toBeGreaterThan(0);
    const [code, answer] = TSUNAGI_6[level - 1]!;
    const layout = decodeLayout(code, SIZE)!;
    const lines = linesOfAnswer(layout, answer)!;
    // A board that wraps needs extra strokes for its joins; this spec takes one that does not.
    expect(layout.wrap).toBe(false);
    expect(layout.strokes).toBe(lines.length);
    await playLevel(page, level);
    const left = page.getByTestId("tsunagi-strokes-left");
    // One stroke wasted on half a line, then every line but that one drawn whole.
    await drag(page, lines[0]!.slice(0, 2));
    for (const line of lines.slice(1)) await drag(page, line);
    await expect(left).toHaveAttribute("data-left", "0");
    await expect(left).toContainText("Out of strokes");
    // The board takes nothing now: the last line drawn changes nothing.
    await drag(page, lines[0]!);
    await expect(page.locator(`[data-testid="tsunagi-line"][data-pair="0"]`)).toHaveAttribute("data-cells", "2");
    await expect(page.getByTestId("tsunagi-undo")).toBeDisabled();
    // Restart gives every stroke back, and a clean run solves it.
    await page.getByTestId("tsunagi-restart").click();
    await expect(left).toHaveAttribute("data-left", String(layout.strokes));
    for (const line of lines) await drag(page, line);
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });

  test("a sparse board has few, long lines, says so, and is solved by dragging", async ({ page }) => {
    const level = levelWith(/\|sparse$/, "teaches");
    expect(level).toBeGreaterThan(0);
    const [code, answer] = TSUNAGI_6[level - 1]!;
    const layout = decodeLayout(code, SIZE)!;
    expect(layout.ends.length).toBeLessThanOrEqual(4);
    await playLevel(page, level);
    await expect(page.getByTestId("tsunagi-chip-sparse")).toBeVisible();
    await expect(page.getByTestId("tsunagi-chip-teaches")).toContainText("Few lines");
    for (const line of linesOfAnswer(layout, answer)!) await drag(page, line);
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });
});
