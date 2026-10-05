import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { decodePicture } from "../src/lib/puzzles/pictureLogic/code";
import type { PuzzleLevel } from "../src/lib/puzzles/puzzles.types";
import { freshPuzzleSeed, ready } from "./support";

/**
 * PICTURE LOGIC AT 40×40 AND 50×50: a hundred lines of clues, two and a half
 * thousand squares, read and shaded on a phone and at a desk.
 *
 * What is proved here is what a reader does: the set-up offers the two on its
 * second shelf and takes Hard away from them; the board opens zoomed, the clues
 * stay at its edge as it is moved; a finger drags a run over the squares; and a
 * whole board is solved by dragging along each row's runs, the way the small
 * boards are, from the picture the spec makes out of the seed the page uses.
 */
const KIND = "pictureLogic";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

function pictureOf(size: number, level: PuzzleLevel, seed: number): boolean[] {
  return decodePicture(generatePuzzle(KIND, size, level, seed).solution, size)!;
}

/** The runs of shaded squares in each row of a picture: [first cell, last cell]. */
function rowRuns(picture: boolean[], size: number): [number, number][] {
  const runs: [number, number][] = [];
  for (let row = 0; row < size; row += 1) {
    let start = -1;
    for (let col = 0; col <= size; col += 1) {
      const shaded = col < size && picture[row * size + col];
      if (shaded && start === -1) start = col;
      if (!shaded && start !== -1) {
        runs.push([row * size + start, row * size + col - 1]);
        start = -1;
      }
    }
  }
  return runs;
}

/** Where every square is on the page once the whole board is in view (Fit): its first and last square's centres give every other. */
async function gridAt(page: Page, size: number) {
  await page.getByTestId("picture-fit").click();
  await expect(page.getByTestId("picture-viewport")).toHaveAttribute("data-zoom", "1.00");
  const first = (await page.locator('[data-testid="picture-cell"][data-index="0"]').boundingBox())!;
  const last = (await page.locator(`[data-testid="picture-cell"][data-index="${size * size - 1}"]`).boundingBox())!;
  const dx = (last.x - first.x) / (size - 1);
  const dy = (last.y - first.y) / (size - 1);
  return (cell: number) => ({ x: first.x + first.width / 2 + (cell % size) * dx, y: first.y + first.height / 2 + Math.floor(cell / size) * dy });
}

/** A drag, a pointer's way: pressed on the first square of a run, moved to the last, lifted there. */
async function drag(page: Page, at: (cell: number) => { x: number; y: number }, from: number, to: number) {
  const a = at(from);
  const b = at(to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  if (from !== to) await page.mouse.move(b.x, b.y, { steps: 3 });
  await page.mouse.up();
}

/** Every run of every row dragged, until the puzzle says it is solved. */
async function solveByDragging(page: Page, size: number, picture: boolean[]) {
  await ready(page, "puzzle-play");
  const at = await gridAt(page, size);
  for (const [from, to] of rowRuns(picture, size)) {
    if (await page.getByTestId("puzzle-done").isVisible()) break;
    await drag(page, at, from, to);
  }
  await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-finished", "true");
}

test.describe("the two biggest Picture logic boards", () => {
  test("the set-up offers 40×40 and 50×50 on its second shelf, at easy and medium only", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    // The first shelf is 5 to 20; one press turns to the last four sizes.
    await expect(page.locator('[data-testid="set-up-size"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="set-up-size"][data-size="50"]')).toHaveCount(0);
    // Hard chosen at a size that has it, then the turn to the last shelf, which opens on its biggest.
    await page.getByTestId("puzzle-level-hard").click();
    await page.getByTestId("puzzle-more-sizes").click();
    await expect(page.locator('[data-testid="set-up-size"]')).toHaveCount(4);
    await page.locator('[data-testid="set-up-size"][data-size="50"]').click();
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-size", "50");
    // Hard is taken away at this size, the first level it has is chosen instead, and hard comes back with a size that has it.
    await expect(page.getByTestId("puzzle-level-hard")).toBeDisabled();
    await expect(page.getByTestId("puzzle-level-easy")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /size=50&level=easy/);
    await page.locator('[data-testid="set-up-size"][data-size="40"]').click();
    await expect(page.getByTestId("puzzle-level-hard")).toBeDisabled();
    await page.locator('[data-testid="set-up-size"][data-size="20"]').click();
    await expect(page.getByTestId("puzzle-level-hard")).toBeEnabled();
    await expect(page.getByTestId("puzzle-level-hard")).toHaveAttribute("aria-checked", "true");
    // The set-up has not moved, whichever of the shelves it shows.
    await expect(page.getByTestId("puzzle-more-sizes")).toBeVisible();
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("a 50×50 opens zoomed with its clues readable, keeps them at the edge as it is moved, and fits back", async ({ page }) => {
      const seed = freshPuzzleSeed();
      await page.goto(`${AT}/play?size=50&level=medium&seed=${seed}`);
      await ready(page, "puzzle-play");
      const view = page.getByTestId("picture-viewport");
      // Opens near, not on the whole board: a hundred clues are not read at six pixels a square.
      await expect(view).toHaveAttribute("data-zoom", "3.00");
      // Not moved yet, so the clues are where the board drew them: nothing is pinned.
      await expect(page.getByTestId("picture-pinned-columns")).toHaveCount(0);
      await expect(page.getByTestId("picture-pinned-rows")).toHaveCount(0);
      const first = (await page.locator('[data-testid="picture-cell"][data-index="0"]').boundingBox())!;
      expect(first.width).toBeGreaterThan(12);

      // Moved down and across, the clues of the lines in view stay at the top and the left.
      await page.getByTestId("picture-arrows").click();
      await page.getByTestId("picture-pad-down").click();
      await page.getByTestId("picture-pad-right").click();
      await expect(page.getByTestId("picture-pinned-columns")).toBeVisible();
      await expect(page.getByTestId("picture-pinned-rows")).toBeVisible();
      await expect(page.getByTestId("picture-pinned-corner")).toBeVisible();
      const box = (await view.boundingBox())!;
      const columns = (await page.getByTestId("picture-pinned-columns").boundingBox())!;
      const rows = (await page.getByTestId("picture-pinned-rows").boundingBox())!;
      expect(Math.abs(columns.y - box.y)).toBeLessThan(2);
      expect(Math.abs(rows.x - box.x)).toBeLessThan(2);
      // The pinned clues are the board's own, a number each, and the page never scrolls sideways.
      expect(await page.getByTestId("picture-clue-pinned").count()).toBeGreaterThan(8);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

      // More zoom than a small board allows, to a square a thumb can press.
      for (let press = 0; press < 5; press += 1) await page.getByTestId("picture-pad-in").click();
      expect(Number(await view.getAttribute("data-zoom"))).toBeGreaterThan(3);
      expect(Number(await view.getAttribute("data-zoom"))).toBeLessThanOrEqual(8);

      await page.getByTestId("picture-fit").click();
      await expect(view).toHaveAttribute("data-zoom", "1.00");
      await expect(page.getByTestId("picture-pinned-columns")).toHaveCount(0);
      await page.getByTestId("picture-arrows").click();
    });

    test("a drag held at the edge of the zoomed board carries the view along, under a finger", async ({ page }) => {
      const seed = freshPuzzleSeed();
      await page.goto(`${AT}/play?size=40&level=easy&seed=${seed}`);
      await ready(page, "puzzle-play");
      const view = page.getByTestId("picture-viewport");
      const box = (await view.boundingBox())!;
      // Pressed on the first row's first square in view, moved along it, and held at the right-hand edge.
      const start = (await page.locator('[data-testid="picture-cell"][data-index="40"]').boundingBox())!;
      const cdp = await page.context().newCDPSession(page);
      const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number, y: number) =>
        cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
      const y = start.y + start.height / 2;
      await touch("touchStart", start.x + start.width / 2, y);
      await touch("touchMove", box.x + box.width * 0.6, y);
      await touch("touchMove", box.x + box.width - 8, y);
      const board = page.getByTestId("picture-board");
      // The run it would paint is outlined, and grows past the squares that were in view when it began.
      await expect.poll(async () => Number(await board.getAttribute("data-aim")), { timeout: 8000 }).toBeGreaterThan(24);
      await touch("touchEnd", 0, 0);
      // Lifted, the run is painted: the squares along the first row are shaded.
      await expect(page.locator('[data-testid="picture-cell"][data-index="40"]')).toHaveAttribute("data-state", "shaded");
      await expect(page.locator('[data-testid="picture-cell"][data-index="60"]')).toHaveAttribute("data-state", "shaded");
    });

    test("a 40×40 is solved on a phone, row by row, by dragging along each run", async ({ page }) => {
      test.setTimeout(240_000);
      const seed = freshPuzzleSeed();
      const picture = pictureOf(40, "easy", seed);
      await page.goto(`${AT}/play?size=40&level=easy&seed=${seed}`);
      await solveByDragging(page, 40, picture);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
    });
  });

  test.describe("at a desk", () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test("a 50×50 is solved by dragging along each row's runs, kept and scored", async ({ page }) => {
      test.setTimeout(300_000);
      const seed = freshPuzzleSeed();
      const picture = pictureOf(50, "medium", seed);
      await page.goto(`${AT}/play?size=50&level=medium&seed=${seed}`);
      await solveByDragging(page, 50, picture);
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
      // Kept: its own page draws the finished picture, and the fastest table has it.
      await page.getByTestId("puzzle-see-solve").click();
      await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", /replay|finished/);
      await page.goto(`${AT}/play?size=50&level=medium&seed=${seed}`);
    });

    test("a long drag over the 50×50 is smooth: no step of it takes a frame's worth of work twice over", async ({ page }) => {
      const seed = freshPuzzleSeed();
      await page.goto(`${AT}/play?size=50&level=medium&seed=${seed}`);
      await ready(page, "puzzle-play");
      const at = await gridAt(page, 50);
      // The longest frame while a pointer is dragged along thirty rows of forty-odd squares each.
      await page.evaluate(() => {
        const w = window as unknown as { __frames: number[] };
        w.__frames = [];
        let last = performance.now();
        const tick = (now: number) => {
          w.__frames.push(now - last);
          last = now;
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await page.waitForTimeout(300);
      await page.evaluate(() => ((window as unknown as { __frames: number[] }).__frames.length = 0));
      const a = at(3 * 50 + 2);
      await page.mouse.move(a.x, a.y);
      await page.mouse.down();
      for (let row = 0; row < 6; row += 1) {
        const b = at((3 + row) * 50 + 47);
        await page.mouse.move(b.x, b.y, { steps: 40 });
      }
      const frames = await page.evaluate(() => (window as unknown as { __frames: number[] }).__frames.slice(2));
      await page.mouse.up();
      expect(frames.length).toBeGreaterThan(20);
      const sorted = [...frames].sort((x, y) => x - y);
      // Ordinary frames are 17 ms; a drag that restyled the whole board at each step took 80 ms a frame.
      expect(sorted[Math.floor(sorted.length * 0.9)]!).toBeLessThan(50);
    });
  });
});
