import { expect, test, type Page } from "@playwright/test";

import { decodeLayout } from "../src/lib/puzzles/tsunagi/code";
import { linesOfAnswer } from "../src/lib/puzzles/tsunagi/lines";
import { TSUNAGI_10 } from "../src/lib/puzzles/tsunagi/levels/size10.data";
import { ready } from "./support";

/**
 * TSUNAGI'S BIG BOARDS ON A PHONE. John, 2026-09-26: boards bigger than a phone
 * comfortably shows, played with Kumimoji's zoom, pan and Fit, and "never page
 * scrolling while dragging". At 390 wide: a 10×10 level solved by dragging, the
 * page not moving under a finger drawing a line, the pad and Fit, and the wheel
 * zooming the board rather than the page.
 */
const SIZE = 10;
const PHONE = { width: 390, height: 844 };

async function openLevel(page: Page, level: number) {
  await page.goto(`/games/tsunagi/play?size=${SIZE}&seed=${level}`);
  await ready(page, "puzzle-play");
  if ((await page.getByTestId("puzzle-play").getAttribute("data-reviewing")) === "true") await page.getByTestId("tsunagi-restart-solved").click();
  await expect(page.getByTestId("tsunagi-line")).toHaveCount(0);
}

async function centre(page: Page, cell: number) {
  const box = (await page.getByTestId("tsunagi-board").boundingBox())!;
  return { x: box.x + (((cell % SIZE) + 0.5) * box.width) / SIZE, y: box.y + ((Math.floor(cell / SIZE) + 0.5) * box.height) / SIZE };
}

test.describe("Tsunagi at 10×10 on a phone", () => {
  test.use({ viewport: PHONE, hasTouch: true, isMobile: true });

  test("a level is solved by dragging at Fit, and nothing scrolls sideways", async ({ page }) => {
    const [code, answer] = TSUNAGI_10[0]!;
    const lines = linesOfAnswer(decodeLayout(code, SIZE)!, answer)!;
    await openLevel(page, 1);
    await expect(page.getByTestId("tsunagi-viewport")).toHaveAttribute("data-zoom", "1.00");
    await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
    for (const line of lines) {
      const from = await centre(page, line[0]!);
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      for (const cell of line.slice(1)) {
        const to = await centre(page, cell);
        await page.mouse.move(to.x, to.y, { steps: 3 });
      }
      await page.mouse.up();
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(PHONE.width);
  });

  test("a finger drawing a line never scrolls the page", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Touches are sent through Chromium's own input protocol.");
    const [code, answer] = TSUNAGI_10[1]!;
    const line = linesOfAnswer(decodeLayout(code, SIZE)!, answer)![0]!;
    await openLevel(page, 2);
    await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    const cdp = await page.context().newCDPSession(page);
    const first = await centre(page, line[0]!);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: first.x, y: first.y }] });
    for (const cell of line.slice(1)) {
      const to = await centre(page, cell);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: to.x, y: to.y }] });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.getByTestId("tsunagi-line")).toHaveAttribute("data-cells", String(line.length));
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test("the pad zooms and moves the board, Fit shows it whole again, and a line drawn zoomed lands where the finger is", async ({ page }) => {
    const [code, answer] = TSUNAGI_10[2]!;
    const lines = linesOfAnswer(decodeLayout(code, SIZE)!, answer)!;
    await openLevel(page, 3);
    const viewport = page.getByTestId("tsunagi-viewport");
    await page.getByTestId("tsunagi-pad-in").click();
    await expect(viewport).toHaveAttribute("data-zoom", "1.50");
    await expect(page.getByTestId("tsunagi-fit")).toHaveAttribute("aria-pressed", "false");
    // Zoomed, the board's cells are half as big again as the box shows at Fit.
    const zoomed = (await page.getByTestId("tsunagi-board").boundingBox())!;
    const shown = (await viewport.boundingBox())!;
    expect(zoomed.width).toBeGreaterThan(shown.width * 1.3);
    // A line whose cells are all in view is drawn where the finger goes, the board's zoom and offset read through.
    const inView = async (cell: number) => {
      const at = await centre(page, cell);
      return at.x > shown.x + 40 && at.x < shown.x + shown.width - 40 && at.y > shown.y + 40 && at.y < shown.y + shown.height - 40;
    };
    let drawn = false;
    for (const line of lines) {
      if (!(await Promise.all(line.map(inView))).every(Boolean)) continue;
      const from = await centre(page, line[0]!);
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      for (const cell of line.slice(1)) {
        const to = await centre(page, cell);
        await page.mouse.move(to.x, to.y, { steps: 3 });
      }
      await page.mouse.up();
      await expect(page.locator(`[data-testid="tsunagi-line"][data-cells="${line.length}"]`)).toHaveCount(1);
      drawn = true;
      break;
    }
    expect(drawn, "a line lies wholly in view once zoomed").toBe(true);
    await page.getByTestId("tsunagi-pad-left").click();
    await page.getByTestId("tsunagi-fit").click();
    await expect(viewport).toHaveAttribute("data-zoom", "1.00");
    await expect(page.getByTestId("tsunagi-fit")).toHaveAttribute("aria-pressed", "true");
  });

  test("the wheel over the board zooms it, and the page stays where it is", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openLevel(page, 4);
    const viewport = page.getByTestId("tsunagi-viewport");
    const box = (await viewport.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, -300);
    await expect.poll(async () => Number(await viewport.getAttribute("data-zoom"))).toBeGreaterThan(1);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });
});
