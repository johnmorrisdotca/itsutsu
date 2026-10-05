import { expect, test, webkit, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { drawThrough, placedMaze, wayThrough } from "./meikyuu";
import { memberContext, removeMember } from "./members";
import { ready } from "./support";

/**
 * A SOLVED MEIKYUU LEVEL'S WALLPAPER, and the full-screen view of it.
 *
 * John, 2026-10-02, with a screenshot of the window on an iPhone: the maze was
 * drawn tiny in the top-left corner of a large cream panel, "kind of silly. They
 * should be able to see full screen the game they played because it's a pretty
 * image." The cause was the picture's own scaling in Safari's engine
 * (`boardSnapshot.ts`), so it was found there, and what is held here is the
 * result in the picture itself: the board covers most of the canvas, centred,
 * under the title bar, in both shapes; and the picture opens full screen, closes
 * on Esc and downloads from there.
 *
 * Each case is a member of its own, made for it and taken away after. The Safari
 * engine is not in this repository's browser install, so that run is asked for
 * (`E2E_WEBKIT=1`, `pnpm exec playwright install webkit` once) and is not part of
 * the gate: the geometry check below is the same one, run in Chromium.
 */
const AT = `/games/${PUZZLE_SLUGS.meikyuu}`;

async function aMember(browser: Browser, baseURL: string | undefined, tag: string, width: number): Promise<{ context: BrowserContext; page: Page; email: string }> {
  const email = `meikyuu-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const context = await memberContext(browser, baseURL!, { email, name: "Meikyuu Player" }, { viewport: { width, height: width === 1280 ? 1100 : 844 } });
  return { context, page: await context.newPage(), email };
}

/** A small level solved by drawing the line, as a player does. */
async function solve(page: Page, size: number, level: number) {
  await page.goto(`${AT}/play?size=${size}&level=easy&seed=${level}`);
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("meikyuu-board").locator("svg")).toBeVisible();
  const placed = await placedMaze(page);
  await drawThrough(page, placed, wayThrough(placed));
  await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
}

/** Where the board is in the picture on the page: the box of everything that is not the dark ground, under the title bar, as shares of the canvas. */
async function boardBox(page: Page) {
  return page.getByTestId("mosaic-picture").evaluate(async (img: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(img, 0, 0);
    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
    // The ground the wallpaper is painted on (`MOSAIC_ART.ground`); the title bar is above 13% of the height in both shapes.
    const ground = [0x1c, 0x17, 0x12];
    let left = width;
    let right = -1;
    let top = height;
    let bottom = -1;
    for (let y = Math.floor(height * 0.13); y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const at = (y * width + x) * 4;
        const far = Math.abs(data[at]! - ground[0]!) + Math.abs(data[at + 1]! - ground[1]!) + Math.abs(data[at + 2]! - ground[2]!);
        if (far < 40) continue;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
    return { left: left / width, right: right / width, top: top / height, bottom: bottom / height };
  });
}

async function expectFilled(page: Page) {
  const dialog = page.getByTestId("mosaic-dialog");
  for (const shape of ["portrait", "landscape"] as const) {
    await dialog.getByTestId(`mosaic-shape-${shape}`).check();
    await expect(dialog.getByTestId("mosaic-picture")).toHaveAttribute("data-shape", shape);
    const box = await boardBox(page);
    const wide = box.right - box.left;
    const high = box.bottom - box.top;
    const centred = (box.left + box.right) / 2;
    // Portrait: the board is as wide as the canvas allows. Landscape: as tall as the room under the bar allows.
    if (shape === "portrait") expect(wide, "the board is a corner of the portrait canvas").toBeGreaterThan(0.8);
    else expect(high, "the board is a corner of the landscape canvas").toBeGreaterThan(0.7);
    expect(Math.abs(centred - 0.5), `the board is not in the middle of the ${shape} canvas`).toBeLessThan(0.03);
    expect(box.top, `the board is not under the bar (${shape})`).toBeGreaterThan(0.1);
  }
}

for (const width of [390, 1280]) {
  test(`the wallpaper of a solved level has the maze filling the canvas, both shapes, ${width}px wide`, async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, `fill-${width}`, width);
    try {
      await solve(page, 2, 8);
      await page.getByTestId("open-board-wallpaper").click();
      const dialog = page.getByTestId("mosaic-dialog");
      await expect(dialog.getByTestId("mosaic-picture")).toBeVisible({ timeout: 30_000 });
      await expectFilled(page);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
}

test("the picture opens full screen, closes on Esc, and downloads from there", async ({ browser, baseURL }) => {
  const { context, page, email } = await aMember(browser, baseURL, "full", 390);
  try {
    await solve(page, 1, 2);
    // One wallpaper for the one game played: no combined picture of many games is offered on its page.
    await expect(page.getByTestId("open-board-wallpaper")).toHaveCount(1);
    await page.getByTestId("open-board-wallpaper").click();
    const dialog = page.getByTestId("mosaic-dialog");
    await expect(dialog.getByTestId("mosaic-picture")).toBeVisible({ timeout: 30_000 });
    await dialog.getByTestId("mosaic-fullscreen").click();
    const full = page.getByTestId("mosaic-full");
    await expect(full).toBeVisible();
    // It is the screen's: the dialog covers the window, and the picture is drawn at the size it is saved in.
    const box = await full.boundingBox();
    expect(box!.width).toBe(390);
    expect(box!.height).toBe(844);
    const picture = full.getByTestId("mosaic-full-picture");
    await expect(picture).toHaveAttribute("data-shape", "portrait");
    await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.naturalWidth), { timeout: 30_000 }).toBe(1170);
    // The other shape from here, and a file to keep.
    await full.getByTestId("mosaic-full-shape-landscape").check();
    await expect(picture).toHaveAttribute("data-shape", "landscape");
    await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.naturalWidth), { timeout: 30_000 }).toBe(1920);
    const download = page.waitForEvent("download");
    await full.getByTestId("mosaic-full-download").click();
    expect((await download).suggestedFilename()).toMatch(/^itsutsu-meikyuu-level-2\.png$/);
    // Esc closes the full screen and leaves the window it was opened from.
    await page.keyboard.press("Escape");
    await expect(full).toHaveCount(0);
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  } finally {
    await context.close();
    await removeMember(email);
  }
});

test.describe("in Safari's engine", () => {
  test.skip(process.env.E2E_WEBKIT !== "1", "Safari's engine is not in the gate's browser install: E2E_WEBKIT=1 asks for it");
  test("the wallpaper has the maze filling the canvas on a phone", async ({ baseURL }) => {
    const engine = await webkit.launch();
    const { context, page, email } = await aMember(engine, baseURL, "webkit", 390);
    try {
      await solve(page, 2, 8);
      await page.getByTestId("open-board-wallpaper").click();
      await expect(page.getByTestId("mosaic-dialog").getByTestId("mosaic-picture")).toBeVisible({ timeout: 30_000 });
      await expectFilled(page);
    } finally {
      await context.close();
      await engine.close();
      await removeMember(email);
    }
  });
});

for (const width of [390, 1280]) {
  test(`the wallpaper of a solved TALL level has the maze filling the canvas, both shapes, ${width}px wide`, async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, `tall-${width}`, width);
    try {
      // A tall maze of the smallest size, upright: the wood is as tall as it is wide and a half again, and it is the wood that is pictured.
      await page.goto(`${AT}/play?size=6x9&level=easy&seed=3`);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("meikyuu-board").locator("svg")).toBeVisible();
      const placed = await placedMaze(page);
      await drawThrough(page, placed, wayThrough(placed));
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await page.getByTestId("open-board-wallpaper").click();
      const dialog = page.getByTestId("mosaic-dialog");
      await expect(dialog.getByTestId("mosaic-picture")).toBeVisible({ timeout: 30_000 });
      for (const shape of ["portrait", "landscape"] as const) {
        await dialog.getByTestId(`mosaic-shape-${shape}`).check();
        await expect(dialog.getByTestId("mosaic-picture")).toHaveAttribute("data-shape", shape);
        const box = await boardBox(page);
        const high = box.bottom - box.top;
        const wide = box.right - box.left;
        // The wood is what is pictured, and none of the picture is the empty column the page has beside it: a tall maze is as wide as the portrait canvas allows, and as tall as the landscape one does under the bar.
        if (shape === "portrait") expect(wide, "the tall maze is a corner of the portrait canvas").toBeGreaterThan(0.8);
        else expect(high, "the tall maze is a corner of the landscape canvas").toBeGreaterThan(0.7);
        // And in the portrait canvas it is a tall wood, taller than it is wide by about half again (the canvas is 1170 by 2532).
        if (shape === "portrait") expect((high * 2532) / (wide * 1170), "the wood is tall").toBeGreaterThan(1.3);
        expect(Math.abs((box.left + box.right) / 2 - 0.5), `the maze is not in the middle (${shape})`).toBeLessThan(0.03);
      }
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
}
