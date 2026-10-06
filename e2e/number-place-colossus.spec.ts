import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generateNumberPlace } from "../src/lib/puzzles/numberPlace/generate";
import { decodeCells, symbolOf } from "../src/lib/puzzles/puzzleCode";
import { freshPuzzleSeed, ready } from "./support";

/**
 * SUDOKU AT 25×25, THE COLOSSUS: 625 cells, five-by-five boxes, the symbols 1 to 9 and then A to P.
 *
 * What is proved is what a reader does: the set-up offers it on its second shelf; on a phone it opens
 * zoomed with a pad that moves it and fits it back, its twenty-five keys and the eraser all fit the
 * screen and a thumb presses them, and the page never scrolls sideways; at a desk the whole grid is
 * there and a whole easy puzzle is solved by typing its letters, kept and paid.
 */
const KIND = "numberPlace";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const cell = (page: Page, index: number) => page.locator(`[data-testid="puzzle-cell"][data-index="${index}"]`);

test.describe("the 25×25 Sudoku", () => {
  test("the set-up offers it on its second shelf, every level, and the address carries it", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await expect(page.locator('[data-testid="set-up-size"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="set-up-size"][data-size="25"]')).toHaveCount(0);
    await page.getByTestId("puzzle-level-hard").click();
    await page.getByTestId("puzzle-more-sizes").click();
    await expect(page.locator('[data-testid="set-up-size"]')).toHaveCount(4);
    await page.locator('[data-testid="set-up-size"][data-size="25"]').click();
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-size", "25");
    await expect(page.getByTestId("puzzle-level-hard")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /size=25&level=hard/);
    await page.locator('[data-testid="set-up-size"][data-size="9"]').click();
    await expect(page.getByTestId("puzzle-more-sizes")).toBeVisible();
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test("opens zoomed, moves and fits back, with a keypad of 25 keys and an eraser that fits, and the page never scrolls sideways", async ({ page }) => {
      const seed = freshPuzzleSeed();
      await page.goto(`${AT}/play?size=25&level=easy&seed=${seed}`);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-cell")).toHaveCount(625);
      const view = page.getByTestId("numbers-viewport");
      await expect(view).toHaveAttribute("data-zoom", "2.00");
      // A cell is a thing a thumb can press once the grid is looked at through the box: wider than 24 pixels at twice the fitted size.
      const first = (await cell(page, 0).boundingBox())!;
      expect(first.width).toBeGreaterThan(24);
      // The pad moves the view, zooms it, and Fit shows the whole grid again.
      await page.getByTestId("numbers-arrows").click();
      await page.getByTestId("numbers-pad-down").click();
      await page.getByTestId("numbers-pad-right").click();
      await page.getByTestId("numbers-pad-in").click();
      expect(Number(await view.getAttribute("data-zoom"))).toBeGreaterThan(2);
      await page.getByTestId("numbers-fit").click();
      await expect(view).toHaveAttribute("data-zoom", "1.00");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      // The keypad: 25 symbols and the eraser, none past the screen's edge, each a fingertip.
      const keys = page.locator('[data-testid^="puzzle-key-"]');
      await expect(keys).toHaveCount(26);
      for (const box of await keys.evaluateAll((all) => all.map((each) => each.getBoundingClientRect().toJSON()))) {
        expect(box.right).toBeLessThanOrEqual(390);
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.height).toBeGreaterThanOrEqual(40);
        expect(box.width).toBeGreaterThanOrEqual(30);
      }
      await expect(page.getByTestId("puzzle-key-25")).toHaveText("P");
      await expect(page.getByTestId("puzzle-key-17")).toHaveText("H");
    });

    test("a tap on an empty cell and a tap on a letter writes it, and a letter typed does too", async ({ page }) => {
      const seed = freshPuzzleSeed();
      const puzzle = generateNumberPlace(25, "easy", seed);
      const givens = decodeCells(puzzle.givens, 25)!;
      const solution = decodeCells(puzzle.solution, 25)!;
      await page.goto(`${AT}/play?size=25&level=easy&seed=${seed}`);
      await ready(page, "puzzle-play");
      // The first empty cell in the top left, which the zoomed view opens on.
      const empty = givens.findIndex((given, index) => given === 0 && index % 25 < 6 && Math.floor(index / 25) < 6);
      expect(empty).toBeGreaterThanOrEqual(0);
      await cell(page, empty).tap();
      await page.getByTestId(`puzzle-key-${solution[empty]}`).tap();
      await expect(cell(page, empty)).toHaveAttribute("data-value", String(solution[empty]));
      await expect(cell(page, empty)).toHaveText(symbolOf(solution[empty]!));
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    });
  });

  test.describe("at a desk", () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test("the whole grid is there, boxes five by five, and an easy puzzle is solved by typing its numbers and letters, kept and paid", async ({ page }) => {
      test.setTimeout(300_000);
      const seed = freshPuzzleSeed();
      const puzzle = generateNumberPlace(25, "easy", seed);
      const givens = decodeCells(puzzle.givens, 25)!;
      const solution = decodeCells(puzzle.solution, 25)!;
      await page.goto(`${AT}/play?size=25&level=easy&seed=${seed}`);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("numbers-viewport")).toHaveAttribute("data-zoom", "1.00");
      await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-size", "25");
      // Five regions of 25 cells in a row: a heavy rule between every fifth.
      await expect(page.locator('[data-testid="puzzle-cell"][data-region="24"]')).toHaveCount(25);
      // A cell is wide enough for a pointer.
      expect((await cell(page, 0).boundingBox())!.width).toBeGreaterThan(14);
      // The printed numbers are the generator's, read in one go: 366 separate waits would sit still for longer than the idle watch allows.
      const printed = await page.locator('[data-testid="puzzle-cell"][data-given="true"]').evaluateAll((all) => all.map((each) => [Number((each as HTMLElement).dataset.index), each.textContent]));
      expect(printed).toEqual(givens.flatMap((given, index) => (given === 0 ? [] : [[index, symbolOf(given)]])));
      for (const [index, given] of givens.entries()) {
        if (given !== 0) continue;
        await cell(page, index).click();
        await page.keyboard.press(symbolOf(solution[index]!));
      }
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
    });
  });
});
