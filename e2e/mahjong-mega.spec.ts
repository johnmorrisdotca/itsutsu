import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { decodeMoves } from "@johnmorrisdotca/jarajara";
import { freshPuzzleSeed, ready } from "./support";
import { viewStillMovesAfterSolve } from "./viewAfterSolve";

/**
 * THE MEGA LAYOUTS, THE WALL (20 ACROSS, 288 TILES, A DOUBLE SET) AND THE PALACE
 * (26 ACROSS, 576, A QUADRUPLE SET): offered on the set-up's second shelf, looked
 * at through the zoom the Turtle uses, and cleared by taking every pair of the
 * deal's own answer, which the server plays through before it pays.
 *
 * Taking two hundred and eighty-eight pairs by a locator's click is minutes, so a
 * clearing is a click on each tile from inside the page — the same click a finger
 * makes, one after another — and the page's own "Solved" is what is waited for.
 */
const KIND = "mahjong";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

const board = (page: Page) => page.getByTestId("mahjong-board");

/** Every pair of a deal's answer, tapped in the page, the first tile and then its match. */
async function clearByTapping(page: Page, pairs: readonly (readonly [number, number])[]) {
  await page.evaluate(async (all) => {
    const tile = (slot: number) => document.querySelector(`[data-testid="mahjong-board"] [data-slot="${slot}"]`);
    // React draws what a click changed in a task of its own, so the second tile waits for the first to be drawn, as a finger does.
    const drawn = () => new Promise((resolve) => setTimeout(() => resolve(null), 0));
    for (const [a, b] of all) {
      for (const slot of [a, b]) {
        const node = tile(slot);
        if (node === null) throw new Error(`tile ${slot} is not on the table`);
        node.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
        await drawn();
      }
    }
  }, pairs);
}

test.describe("Mahjong's mega layouts", () => {
  test("the set-up offers the Wall and the Palace on its second shelf, every level, and the preview is the whole layout", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await expect(page.locator('[data-testid="set-up-size"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="set-up-size"][data-size="26"]')).toHaveCount(0);
    await page.getByTestId("puzzle-level-hard").click();
    await page.getByTestId("puzzle-more-sizes").click();
    await expect(page.locator('[data-testid="set-up-size"]')).toHaveCount(4);
    for (const [size, tiles] of [
      [20, 288],
      [26, 576],
    ] as const) {
      await page.locator(`[data-testid="set-up-size"][data-size="${size}"]`).click();
      await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-size", String(size));
      await expect(page.getByTestId("mahjong-preview").locator("[data-slot]")).toHaveCount(tiles);
      await expect(page.getByTestId("puzzle-level-hard")).toHaveAttribute("aria-checked", "true");
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", new RegExp(`size=${size}&level=hard`));
    }
    // And back to the first shelf, where the Torii is not the shelf's one hidden thing.
    await page.locator('[data-testid="set-up-size"][data-size="10"]').click();
    await expect(page.getByTestId("puzzle-more-sizes")).toBeVisible();
    await page.getByTestId("puzzle-more-sizes").click();
    await expect(page.locator('[data-testid="set-up-size"][data-size="8"]')).toBeVisible();
  });

  test("the Palace is cleared on a desk by taking every pair of its answer, and the server pays for it", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const seed = freshPuzzleSeed();
    const puzzle = generatePuzzle(KIND, 26, "easy", seed);
    const moves = decodeMoves(puzzle.solution, puzzle.givens.length)!;
    expect(puzzle.givens).toHaveLength(576);
    expect(moves.every((move) => "pair" in move)).toBe(true);
    await page.goto(`${AT}/play?size=26&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");
    await expect(board(page)).toHaveAttribute("data-cells", puzzle.givens);
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-left", "576");
    // A desk shows the whole layout: no zoom to turn, and no sideways scroll.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
    await clearByTapping(page, moves.flatMap((move) => ("pair" in move ? [move.pair] : [])));
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved", { timeout: 60_000 });
    await viewStillMovesAfterSolve(page, "mahjong");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/IP|XP|Already paid|allowance/);
  });

  test("the Wall is cleared the same way, from a deal the page made for itself", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const puzzle = generatePuzzle(KIND, 20, "medium", seed);
    const moves = decodeMoves(puzzle.solution, puzzle.givens.length)!;
    expect(puzzle.givens).toHaveLength(288);
    await page.goto(`${AT}/play?size=20&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    await expect(board(page)).toHaveAttribute("data-cells", puzzle.givens);
    await clearByTapping(page, moves.flatMap((move) => ("pair" in move ? [move.pair] : [])));
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved", { timeout: 60_000 });
    await viewStillMovesAfterSolve(page, "mahjong");
  });

  test("left half way, the Palace waits in My games and opens where it was left", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const puzzle = generatePuzzle(KIND, 26, "medium", seed);
    const moves = decodeMoves(puzzle.solution, puzzle.givens.length)!;
    await page.goto(`${AT}/play?size=26&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    await clearByTapping(page, moves.slice(0, 40).flatMap((move) => ("pair" in move ? [move.pair] : [])));
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-left", String(576 - 80));
    const kept = await page.getByTestId("puzzle-play").getAttribute("data-moves");
    await page.getByTestId("puzzle-pause").click();
    await expect(page.getByTestId("puzzle-paused")).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="going"]').click();
    const row = page.locator(`[data-testid="puzzle-going"][data-kind="${KIND}"][data-seed="${seed}"]`);
    await expect(row).toBeVisible();
    await row.getByTestId("puzzle-going-continue").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-moves", kept!);
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-left", String(576 - 80));
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("the Palace zooms to tiles a finger can press, moves without leaving the board, fits back, and the page never scrolls sideways", async ({ page }) => {
      await page.goto(`${AT}/play?size=26&level=easy&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
      const view = page.getByTestId("mahjong-viewport");
      await expect(view).toHaveAttribute("data-zoom", "1.00");
      const fitted = (await board(page).locator("[data-slot]").first().boundingBox())!;
      expect(fitted.width).toBeLessThan(24);
      await page.getByTestId("mahjong-arrows").click();
      for (let press = 0; press < 4; press += 1) await page.getByTestId("mahjong-pad-in").click();
      // As near as the Palace comes: four times the whole, a tile of about fifty pixels.
      await expect(view).toHaveAttribute("data-zoom", "4.00");
      const near = (await board(page).locator("[data-slot]").first().boundingBox())!;
      expect(near.width).toBeGreaterThan(40);
      // Moved to the foot of the board, the box still shows tiles: the view stops at the board's own edge, not the box's width below it.
      for (let press = 0; press < 8; press += 1) await page.getByTestId("mahjong-pad-down").click();
      const box = (await view.boundingBox())!;
      const foot = (await page.getByTestId("mahjong-board-frame").boundingBox())!;
      expect(foot.y + foot.height).toBeGreaterThanOrEqual(box.y + box.height - 2);
      expect(foot.y + foot.height).toBeLessThanOrEqual(box.y + box.height + 2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      await page.getByTestId("mahjong-fit").click();
      await expect(view).toHaveAttribute("data-zoom", "1.00");
      await page.getByTestId("mahjong-arrows").click();
    });

    test("a pair of the Wall is taken zoomed in by touch, with the pad's Fit to come back", async ({ page }) => {
      const seed = freshPuzzleSeed();
      const [first] = decodeMoves(generatePuzzle(KIND, 20, "easy", seed).solution, 288)!;
      if (first === undefined || !("pair" in first)) throw new Error("a deal's first move is a pair");
      await page.goto(`${AT}/play?size=20&level=easy&seed=${seed}`);
      await ready(page, "puzzle-play");
      await page.getByTestId("mahjong-arrows").click();
      await page.getByTestId("mahjong-pad-in").click();
      await page.getByTestId("mahjong-pad-in").click();
      await page.getByTestId("mahjong-arrows").click();
      // Both tiles are brought into view by the page's own pad before they are pressed, the way a reader would.
      const press = async (slot: number) => {
        const tile = board(page).locator(`[data-slot="${slot}"]`);
        await tile.evaluate((node) => node.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true })));
      };
      await press(first.pair[0]);
      await expect(board(page).locator(`[data-slot="${first.pair[0]}"]`)).toHaveAttribute("data-chosen", "true");
      await press(first.pair[1]);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-left", "286");
      await page.getByTestId("mahjong-undo").click();
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-left", "288");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    });
  });
});
