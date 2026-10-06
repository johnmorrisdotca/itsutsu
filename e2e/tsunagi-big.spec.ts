import { PrismaClient } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";

import { decodeLayout } from "@johnmorrisdotca/tsunagi";
import { linesOfAnswer } from "@johnmorrisdotca/tsunagi";
import { TSUNAGI_10 } from "@johnmorrisdotca/tsunagi/levels-10";
import { TSUNAGI_12 } from "@johnmorrisdotca/tsunagi/levels-12";
import { TSUNAGI_13 } from "@johnmorrisdotca/tsunagi/levels-13";
import { TSUNAGI_14 } from "@johnmorrisdotca/tsunagi/levels-14";
import { TSUNAGI_15 } from "@johnmorrisdotca/tsunagi/levels-15";
import { suiteOperator } from "./operator";
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
    // The arrows are out of sight until asked for.
    await expect(page.getByTestId("tsunagi-pad-in")).toHaveCount(0);
    await page.getByTestId("tsunagi-arrows").click();
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

/**
 * AND AT 12×12, the biggest board: sixteen pairs, the four newest colours among
 * them, solved by dragging at Fit on a phone. Made by mending a board to one
 * answer rather than by luck (`repairedCandidate`), so this is the proof that
 * what the generator mended is what a finger can draw.
 */
test.describe("Tsunagi at 12×12 on a phone", () => {
  test.use({ viewport: PHONE, hasTouch: true, isMobile: true });

  test("the first level is solved by dragging at Fit, and nothing scrolls sideways", async ({ page }) => {
    const size = 12;
    const [code, answer] = TSUNAGI_12[0]!;
    const lines = linesOfAnswer(decodeLayout(code, size)!, answer)!;
    await page.goto(`/games/tsunagi/play?size=${size}&seed=1`);
    await ready(page, "puzzle-play");
    if ((await page.getByTestId("puzzle-play").getAttribute("data-reviewing")) === "true") await page.getByTestId("tsunagi-restart-solved").click();
    await expect(page.getByTestId("tsunagi-viewport")).toHaveAttribute("data-zoom", "1.00");
    await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
    // Where the board is, read before every move, as a finger sees it.
    const at = async (cell: number) => {
      const box = (await page.getByTestId("tsunagi-board").boundingBox())!;
      return { x: box.x + (((cell % size) + 0.5) * box.width) / size, y: box.y + ((Math.floor(cell / size) + 0.5) * box.height) / size };
    };
    for (const line of lines) {
      const from = await at(line[0]!);
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      for (const cell of line.slice(1)) {
        const to = await at(cell);
        await page.mouse.move(to.x, to.y, { steps: 3 });
      }
      await page.mouse.up();
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(PHONE.width);
  });
});

/**
 * THE BOARD STAYS PUT WHEN PLAY STARTS. The first stroke starts the clock and
 * counts an attempt, and "0 attempts" becoming "1 attempt" changed the width of
 * the line over the board: where that line sat on the edge of wrapping — on the
 * CI runner's fonts, at a phone's 390 — the board jumped some forty pixels
 * under the finger mid-drag, and the line being drawn landed on other cells
 * (0.398.0's CI, 2026-09-26). Swept across the widths where the line wraps, from
 * a count of nought each time, so the change of words is what is measured.
 */
test.describe("Tsunagi's board under a finger", () => {
  for (const width of [372, 376, 380, 384, 388, 392, 396]) {
    test(`does not move when the first line starts the clock, at ${width}px`, async ({ page }) => {
      const prisma = new PrismaClient();
      try {
        const member = await prisma.member.findFirst({ where: { email: suiteOperator().email }, select: { id: true } });
        if (member !== null) await prisma.tsunagiAttempt.deleteMany({ where: { memberId: member.id, size: SIZE, level: 1 } });
      } finally {
        await prisma.$disconnect();
      }
      await page.setViewportSize({ width, height: 900 });
      await openLevel(page, 1);
      await expect(page.getByTestId("tsunagi-attempts")).toHaveAttribute("data-count", "0");
      const before = (await page.getByTestId("tsunagi-board").boundingBox())!;
      const [code, answer] = TSUNAGI_10[0]!;
      const line = linesOfAnswer(decodeLayout(code, SIZE)!, answer)![0]!;
      const from = await centre(page, line[0]!);
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      const to = await centre(page, line[1]!);
      await page.mouse.move(to.x, to.y, { steps: 2 });
      await page.mouse.up();
      await expect(page.getByTestId("tsunagi-attempts")).toHaveAttribute("data-count", "1");
      const after = (await page.getByTestId("tsunagi-board").boundingBox())!;
      expect(after.y, "the board moved when play started").toBe(before.y);
    });
  }
});

/**
 * 13×13, 14×14 AND 15×15 (Tsunagi 1.2.0): reached from the set-up's third
 * shelf, solved by dragging at Fit on a phone, and played zoomed with the pad.
 * The levels are the package's, each proved to have one answer; what is held
 * here is that the site offers them, draws them in a phone's width and takes a
 * finished one through the same checks as any other size.
 */
const BIG_SIZES = [
  { size: 13, levels: TSUNAGI_13 },
  { size: 14, levels: TSUNAGI_14 },
  { size: 15, levels: TSUNAGI_15 },
] as const;

async function openBig(page: Page, size: number, level: number) {
  await page.goto(`/games/tsunagi/play?size=${size}&seed=${level}`);
  await ready(page, "puzzle-play");
  if ((await page.getByTestId("puzzle-play").getAttribute("data-reviewing")) === "true") await page.getByTestId("tsunagi-restart-solved").click();
  await expect(page.getByTestId("tsunagi-line")).toHaveCount(0);
}

async function drag(page: Page, size: number, line: readonly number[]) {
  // Where the board is, read before every move, as a finger sees it.
  const at = async (cell: number) => {
    const box = (await page.getByTestId("tsunagi-board").boundingBox())!;
    return { x: box.x + (((cell % size) + 0.5) * box.width) / size, y: box.y + ((Math.floor(cell / size) + 0.5) * box.height) / size };
  };
  const from = await at(line[0]!);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (const cell of line.slice(1)) {
    const to = await at(cell);
    await page.mouse.move(to.x, to.y, { steps: 3 });
  }
  await page.mouse.up();
}

test.describe("the set-up offers 13×13 to 15×15", () => {
  test("they are the third shelf, reached from the first and left by the next, and the preview is the board chosen", async ({ page }) => {
    await page.goto("/games/tsunagi/new");
    await ready(page, "puzzle-set-up");
    const sizes = async () => page.locator('[data-testid="tsunagi-sizes"] [data-testid="set-up-size"]').evaluateAll((tiles) => tiles.map((tile) => Number(tile.getAttribute("data-size"))));
    expect(await sizes()).toEqual([4, 5, 6, 7]);
    const height = (await page.getByTestId("puzzle-set-up").boundingBox())!.height;
    await page.getByTestId("tsunagi-more-sizes").click();
    expect(await sizes()).toEqual([8, 9, 10, 11]);
    await expect(page.getByTestId("tsunagi-more-sizes")).toContainText("Bigger boards, to 15×15");
    await page.getByTestId("tsunagi-more-sizes").click();
    expect(await sizes()).toEqual([12, 13, 14, 15]);
    await expect(page.getByTestId("tsunagi-more-sizes")).toContainText("Bigger boards, to 30×30");
    for (const size of [13, 14, 15]) {
      await page.locator(`[data-testid="set-up-size"][data-size="${size}"]`).click();
      await expect(page.getByTestId("tsunagi-preview")).toHaveAttribute("data-size", String(size));
      await expect(page.getByTestId("tsunagi-preview")).toHaveAttribute("data-drawn", "true");
      await expect(page.getByTestId("tsunagi-levels-caption")).toContainText(`${size}×${size}: `);
      await expect(page.getByTestId("tsunagi-levels-caption")).toContainText("of 128 solved");
      expect(Math.abs((await page.getByTestId("puzzle-set-up").boundingBox())!.height - height), `the set-up changed height at ${size}×${size}`).toBeLessThanOrEqual(1);
    }
    // The last shelf is moved back so it is full: 15, then 20, 25 and 30 (`shelvesOf`); and from it the way back is to the first.
    await page.getByTestId("tsunagi-more-sizes").click();
    expect(await sizes()).toEqual([15, 20, 25, 30]);
    await expect(page.getByTestId("tsunagi-more-sizes")).toContainText("Smaller boards, from 4×4");
    await page.getByTestId("tsunagi-more-sizes").click();
    expect(await sizes()).toEqual([4, 5, 6, 7]);
  });
});

test.describe("Tsunagi at 13×13 to 15×15 on a phone", () => {
  test.use({ viewport: PHONE, hasTouch: true, isMobile: true });

  for (const { size, levels } of BIG_SIZES) {
    test(`${size}×${size}: the first level is solved by dragging at Fit, and nothing scrolls sideways`, async ({ page }) => {
      const [code, answer] = levels[0]!;
      const lines = linesOfAnswer(decodeLayout(code, size)!, answer)!;
      await openBig(page, size, 1);
      await expect(page.getByTestId("tsunagi-viewport")).toHaveAttribute("data-zoom", "1.00");
      await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
      for (const line of lines) await drag(page, size, line);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(PHONE.width);
    });
  }

  test("15×15: the pad zooms and moves the board, a line drawn zoomed lands where the finger is, and Fit shows it whole again", async ({ page }) => {
    const size = 15;
    const [code, answer] = TSUNAGI_15[2]!;
    const lines = linesOfAnswer(decodeLayout(code, size)!, answer)!;
    await openBig(page, size, 3);
    const viewport = page.getByTestId("tsunagi-viewport");
    await expect(viewport).toHaveAttribute("data-zoom", "1.00");
    // A line is drawn at Fit first: the cells are small but a finger still lands on them.
    const [shortest] = [...lines].sort((a, b) => a.length - b.length);
    await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
    await drag(page, size, shortest!);
    await expect(page.locator(`[data-testid="tsunagi-line"][data-cells="${shortest!.length}"]`)).toHaveCount(1);
    await page.getByTestId("tsunagi-arrows").click();
    await page.getByTestId("tsunagi-pad-in").click();
    await page.getByTestId("tsunagi-pad-in").click();
    await expect(viewport).toHaveAttribute("data-zoom", "2.25");
    await expect(page.getByTestId("tsunagi-fit")).toHaveAttribute("aria-pressed", "false");
    const shown = (await viewport.boundingBox())!;
    const inView = async (cell: number) => {
      const box = (await page.getByTestId("tsunagi-board").boundingBox())!;
      const x = box.x + (((cell % size) + 0.5) * box.width) / size;
      const y = box.y + ((Math.floor(cell / size) + 0.5) * box.height) / size;
      return x > shown.x + 30 && x < shown.x + shown.width - 30 && y > shown.y + 30 && y < shown.y + shown.height - 30;
    };
    // Move about until a whole line is in view, then draw it where the finger is.
    let drawn = false;
    for (const pad of ["left", "up", "right", "down", "down", "left"]) {
      for (const line of lines) {
        if (line === shortest || !(await Promise.all(line.map(inView))).every(Boolean)) continue;
        await drag(page, size, line);
        await expect(page.locator(`[data-testid="tsunagi-line"][data-cells="${line.length}"]`).first()).toBeVisible();
        drawn = true;
        break;
      }
      if (drawn) break;
      await page.getByTestId(`tsunagi-pad-${pad}`).click();
    }
    expect(drawn, "a line lies wholly in view once zoomed and moved").toBe(true);
    await page.getByTestId("tsunagi-fit").click();
    await expect(viewport).toHaveAttribute("data-zoom", "1.00");
    await expect(page.getByTestId("tsunagi-fit")).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(PHONE.width);
  });
});

test.describe("Tsunagi at 15×15 on a desk", () => {
  test("every board size the desk offers is drawn inside the window, and a line is drawn at each", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const size = 15;
    const [code, answer] = TSUNAGI_15[0]!;
    const lines = linesOfAnswer(decodeLayout(code, size)!, answer)!;
    await openBig(page, size, 1);
    for (const scale of ["regular", "large", "full"]) {
      await page.locator(`[data-testid="board-scale-option"][data-scale="${scale}"]`).click();
      await expect(page.getByTestId("board-scaling")).toHaveAttribute("data-board-scale", scale);
      await expect(page.getByTestId("board-scaling")).toHaveAttribute("data-scale-settled", "true");
      const box = (await page.getByTestId("tsunagi-board").boundingBox())!;
      expect(box.width, `${scale}: the board is as wide as it is tall`).toBeGreaterThan(300);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${scale}: the page scrolls sideways`).toBeLessThanOrEqual(1280);
      await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
      await drag(page, size, lines[0]!);
      await expect(page.locator(`[data-testid="tsunagi-line"][data-cells="${lines[0]!.length}"]`).first()).toBeVisible();
      await page.getByTestId("tsunagi-restart").click();
      await expect(page.getByTestId("tsunagi-line")).toHaveCount(0);
    }
    await page.locator('[data-testid="board-scale-option"][data-scale="regular"]').click();
  });
});
