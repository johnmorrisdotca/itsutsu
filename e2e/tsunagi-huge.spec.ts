import { PrismaClient } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";

import { decodeLayout, linesOfAnswer } from "@johnmorrisdotca/tsunagi";
import { TSUNAGI_20 } from "@johnmorrisdotca/tsunagi/levels-20";
import { TSUNAGI_25 } from "@johnmorrisdotca/tsunagi/levels-25";
import { TSUNAGI_30 } from "@johnmorrisdotca/tsunagi/levels-30";
import { suiteOperator } from "./operator";
import { ready } from "./support";
import { viewStillMovesAfterSolve } from "./viewAfterSolve";
import { drawWithMouse, drawWithTouch, strokesOf } from "./tsunagiFinger";

/*
 * TSUNAGI'S THREE BIGGEST BOARDS (1.5.0, 2026-10-05): 20×20, 25×25 and 30×30, up to dozens of lines. John, 2026-10-05:
 * boards up to 30×30. Held here: the set-up offers them on a shelf of its own and never changes height; a level is
 * drawn inside a phone's width and drawn on, by a finger, at Fit and zoomed; two fingers pinch and move the view;
 * a finger's moves are answered quickly (the board redraws only the cells that changed); and the whole of a level is
 * solved by dragging along its answer. The levels are the package's, each proved to have one answer; the site's own
 * part is what is checked.
 */
async function forgetOperatorTsunagi() {
  const prisma = new PrismaClient();
  try {
    const member = await prisma.member.findFirst({ where: { email: suiteOperator().email }, select: { id: true } });
    if (member === null) return;
    await prisma.puzzleSolve.deleteMany({ where: { memberId: member.id, kind: "tsunagi" } });
    await prisma.puzzleRun.deleteMany({ where: { memberId: member.id, kind: "tsunagi" } });
    await prisma.tsunagiAttempt.deleteMany({ where: { memberId: member.id } });
  } finally {
    await prisma.$disconnect();
  }
}

test.beforeEach(forgetOperatorTsunagi);

const AT = "/games/tsunagi";
const PHONE = { width: 390, height: 844 };
const HUGE = [
  { size: 20, levels: TSUNAGI_20 },
  { size: 25, levels: TSUNAGI_25 },
  { size: 30, levels: TSUNAGI_30 },
] as const;

function levelOf(size: number, level: number) {
  const row = HUGE.find((each) => each.size === size)!.levels[level - 1]!;
  const layout = decodeLayout(row[0], size)!;
  return { givens: row[0], answer: row[1], layout, lines: linesOfAnswer(layout, row[1])! };
}

async function openLevel(page: Page, size: number, level: number) {
  await page.goto(`${AT}/play?size=${size}&seed=${level}`);
  await ready(page, "puzzle-play");
  if ((await page.getByTestId("puzzle-play").getAttribute("data-reviewing")) === "true") await page.getByTestId("tsunagi-restart-solved").click();
  await expect(page.getByTestId("tsunagi-line")).toHaveCount(0);
}

const whereOn = (page: Page, size: number) => async (cell: number) => {
  const box = (await page.getByTestId("tsunagi-board").boundingBox())!;
  return { x: box.x + (((cell % size) + 0.5) * box.width) / size, y: box.y + ((Math.floor(cell / size) + 0.5) * box.height) / size };
};

test.describe("the set-up offers 20×20, 25×25 and 30×30", () => {
  test("they are the last shelf, which is moved back so it is full, and the preview is the board chosen, the page the same height throughout", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    const sizes = async () => page.locator('[data-testid="tsunagi-sizes"] [data-testid="set-up-size"]').evaluateAll((tiles) => tiles.map((tile) => Number(tile.getAttribute("data-size"))));
    const height = (await page.getByTestId("puzzle-set-up").boundingBox())!.height;
    for (const wanted of [[8, 9, 10, 11], [12, 13, 14, 15], [15, 20, 25, 30]]) {
      await page.getByTestId("tsunagi-more-sizes").click();
      expect(await sizes()).toEqual(wanted);
    }
    await expect(page.getByTestId("tsunagi-more-sizes")).toContainText("Smaller boards, from 4×4");
    for (const { size } of HUGE) {
      await page.locator(`[data-testid="set-up-size"][data-size="${size}"]`).click();
      await expect(page.getByTestId("tsunagi-preview")).toHaveAttribute("data-size", String(size));
      await expect(page.getByTestId("tsunagi-preview")).toHaveAttribute("data-drawn", "true");
      await expect(page.getByTestId("tsunagi-levels-caption")).toContainText(`${size}×${size}: 0 of 64 solved`);
      await expect(page.getByTestId("tsunagi-block")).toContainText("Block 1 of 4 · levels 1–16");
      expect(Math.abs((await page.getByTestId("puzzle-set-up").boundingBox())!.height - height), `the set-up changed height at ${size}×${size}`).toBeLessThanOrEqual(1);
    }
    // Its fourth block is the last: levels 49 to 64.
    await page.getByTestId("tsunagi-block-on").click();
    await page.getByTestId("tsunagi-block-on").click();
    await page.getByTestId("tsunagi-block-on").click();
    await expect(page.getByTestId("tsunagi-block")).toContainText("Block 4 of 4 · levels 49–64");
  });
});

test.describe("the biggest boards on a phone", () => {
  test.use({ viewport: PHONE, hasTouch: true, isMobile: true });

  for (const { size } of HUGE) {
    test(`${size}×${size}: the first lines are drawn by touch at Fit, nothing scrolls sideways, and only the cells that changed are drawn again`, async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Touches are sent through Chromium's own input protocol.");
      const level = levelOf(size, 1);
      await openLevel(page, size, 1);
      await expect(page.getByTestId("tsunagi-viewport")).toHaveAttribute("data-zoom", "1.00");
      await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
      const cdp = await page.context().newCDPSession(page);
      // A cell of the board before any line: kept as the node it is when the next line is drawn, which is not drawn again.
      await page.evaluate(() => {
        const far = document.querySelector('[data-testid="puzzle-cell"][data-index="0"]');
        (window as unknown as { __cell0: Element | null }).__cell0 = far;
      });
      const first = level.lines.find((each) => !each.includes(0))!;
      await drawWithTouch(cdp, whereOn(page, size), strokesOf(level.layout, first));
      await expect(page.locator(`[data-testid="tsunagi-line"][data-cells="${first.length}"]`)).toHaveCount(1);
      // A cell the line did not touch is the very element it was: the board redraws what changed.
      expect(await page.evaluate(() => document.querySelector('[data-testid="puzzle-cell"][data-index="0"]') === (window as unknown as { __cell0: Element | null }).__cell0)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(PHONE.width);
    });
  }

  test("30×30: the pad zooms to the most and a line is drawn zoomed; two fingers pinch and move the view without drawing", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Touches are sent through Chromium's own input protocol.");
    const level = levelOf(30, 1);
    await openLevel(page, 30, 1);
    const viewport = page.getByTestId("tsunagi-viewport");
    await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
    const box = (await viewport.boundingBox())!;
    const cdp = await page.context().newCDPSession(page);
    const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    // Two fingers on the board, drawn apart: the view zooms in, and no line is drawn.
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: middle.x - 20, y: middle.y, id: 1 }, { x: middle.x + 20, y: middle.y, id: 2 }] });
    for (let step = 1; step <= 8; step += 1) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: middle.x - 20 - step * 10, y: middle.y, id: 1 }, { x: middle.x + 20 + step * 10, y: middle.y, id: 2 }] });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(async () => Number(await viewport.getAttribute("data-zoom"))).toBeGreaterThan(1.5);
    await expect(page.getByTestId("tsunagi-line")).toHaveCount(0);
    // Dragged along, the board follows the fingers: its place in the box has moved.
    const before = (await page.getByTestId("tsunagi-board").boundingBox())!;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: middle.x - 30, y: middle.y, id: 1 }, { x: middle.x + 30, y: middle.y, id: 2 }] });
    for (let step = 1; step <= 6; step += 1) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: middle.x - 30 - step * 6, y: middle.y + step * 6, id: 1 }, { x: middle.x + 30 - step * 6, y: middle.y + step * 6, id: 2 }] });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    const after = (await page.getByTestId("tsunagi-board").boundingBox())!;
    expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y), "the board followed the two fingers").toBeGreaterThan(10);
    await expect(page.getByTestId("tsunagi-line")).toHaveCount(0);
    // And Fit shows it whole again, where one finger draws.
    await page.getByTestId("tsunagi-fit").click();
    await expect(viewport).toHaveAttribute("data-zoom", "1.00");
    const first = level.lines.find((each) => each.length >= 4)!;
    await drawWithTouch(cdp, whereOn(page, 30), strokesOf(level.layout, first));
    await expect(page.locator(`[data-testid="tsunagi-line"][data-cells="${first.length}"]`)).toHaveCount(1);
  });

  test("30×30: a finger's moves are answered quickly, on a phone's processor slowed four times", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "The processor is slowed through Chromium's own protocol.");
    const level = levelOf(30, 1);
    await openLevel(page, 30, 1);
    await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    // Many lines drawn first, so the board is as full as it gets mid-play; then the time a move takes is read from the browser's own event timing.
    for (const line of level.lines.slice(0, Math.min(level.lines.length, 30))) await drawWithTouch(cdp, whereOn(page, 30), strokesOf(level.layout, line));
    await page.evaluate(() => {
      const seen: number[] = [];
      (window as unknown as { __moves: number[] }).__moves = seen;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (entry.name === "pointermove" || entry.name === "touchmove") seen.push(entry.duration);
      }).observe({ type: "event", durationThreshold: 16, buffered: false } as PerformanceObserverInit);
    });
    for (const line of level.lines.slice(30, 36)) await drawWithTouch(cdp, whereOn(page, 30), strokesOf(level.layout, line));
    const moves = await page.evaluate(() => (window as unknown as { __moves: number[] }).__moves);
    // Event timing reports only the slow ones (over 16 ms): the slowest of them must still be quick enough to feel like a drag.
    const worst = moves.length === 0 ? 0 : Math.max(...moves);
    console.log(`30×30, processor slowed 4×: ${moves.length} moves over 16 ms, the slowest ${Math.round(worst)} ms`);
    expect(worst, "the slowest move").toBeLessThan(250);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  });
});

test.describe("the biggest boards on a desk", () => {
  test.use({ viewport: { width: 1280, height: 1100 } });

  test("20×20 is solved by dragging along its answer, kept, and its next level is offered", async ({ page }) => {
    const level = levelOf(20, 1);
    await openLevel(page, 20, 1);
    await drawWithMouse(page, whereOn(page, 20), level.lines.flatMap((line) => strokesOf(level.layout, line)));
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-next-level")).toBeVisible();
    await viewStillMovesAfterSolve(page, "tsunagi");
  });

  test("30×30 is solved by dragging along its answer", async ({ page }) => {
    test.setTimeout(240_000);
    const level = levelOf(30, 1);
    await openLevel(page, 30, 1);
    await drawWithMouse(page, whereOn(page, 30), level.lines.flatMap((line) => strokesOf(level.layout, line)));
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await viewStillMovesAfterSolve(page, "tsunagi");
  });
});
