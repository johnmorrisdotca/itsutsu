import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { decodeClues, decodePicture } from "../src/lib/puzzles/pictureLogic/code";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import type { PuzzleLevel } from "../src/lib/puzzles/puzzles.types";
import { freshPuzzleSeed, ready } from "./support";

/**
 * PICTURE LOGIC 絵解き: clues beside every row and above every column give the
 * runs of shaded squares in order; shade them all and a picture appears.
 *
 * Every square here is shaded as a reader shades one — a tap, or a drag along
 * a row — from the picture the spec makes out of the same seed the page uses.
 */
const KIND = "pictureLogic";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const NAME = PUZZLE_DISPLAY[KIND].label;

function pictureOf(size: number, level: PuzzleLevel, seed: number): boolean[] {
  return decodePicture(generatePuzzle(KIND, size, level, seed).solution, size)!;
}

function square(page: Page, cell: number) {
  return page.locator(`[data-testid="picture-cell"][data-index="${cell}"]`);
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

/** A drag, a finger's way: pressed on one square, moved along the row, lifted on the last. */
async function drag(page: Page, from: number, to: number) {
  const a = (await square(page, from).boundingBox())!;
  const b = (await square(page, to).boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 });
  // Held, the run it would paint is outlined: as many squares as it covers.
  await expect(page.getByTestId("picture-board")).toHaveAttribute("data-aim", String(to - from + 1));
  await page.mouse.up();
}

test.describe("Picture logic, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, under our own name, in the Logic puzzles family", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("inspired-by")).toContainText("nonogram");
    await expect(page.getByTestId("game-family")).toContainText("Logic puzzles");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(new RegExp(`${AT}/rules$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.locator("main")).toContainText("runs of shaded squares");
    // A games company's trademarked name for the puzzle is never used here.
    await expect(page.locator("main")).not.toContainText(/picross/i);
  });
});

test.describe("the Picture logic puzzle", () => {
  test("set up at 5×5 easy and solved by tapping: a ✕ marked, met clues struck through, and the picture shown", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.locator('[data-testid="set-up-size"][data-size="5"]').click();
    await page.getByTestId("puzzle-level-easy").click();
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-size", "5");
    await expect(page.getByTestId("set-up-puzzle-preview").getByTestId("picture-clue")).toHaveCount(10);
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/size=5/);
    await ready(page, "puzzle-play");
    const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    const picture = pictureOf(5, "easy", seed);
    await expect(page.getByTestId("picture-cell")).toHaveCount(25);

    // An empty square of the picture: a tap shades it, a second marks it ✕ — and it stays ✕.
    const empty = picture.indexOf(false);
    await square(page, empty).click();
    await expect(square(page, empty)).toHaveAttribute("data-state", "shaded");
    await square(page, empty).click();
    await expect(square(page, empty)).toHaveAttribute("data-state", "marked empty");

    const shaded = picture.flatMap((on, cell) => (on ? [cell] : []));
    const last = shaded.at(-1)!;
    for (const cell of shaded) {
      if (cell === last) continue;
      await square(page, cell).click();
      await expect(square(page, cell)).toHaveAttribute("data-state", "shaded");
    }
    // The first row's clue is met once its squares are shaded (the last square is on the last row it touches), and is struck through too.
    const firstRow = Math.floor(shaded[0]! / 5);
    if (firstRow !== Math.floor(last / 5)) {
      const clue = page.locator(`[data-testid="picture-clue"][data-line="row-${firstRow}"]`);
      await expect(clue).toHaveAttribute("data-met", "true");
      await expect(clue.getByTestId("picture-clue-struck")).toHaveCount(1);
    }
    await square(page, last).click();
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    // Solved: the picture alone, the ✕s gone.
    await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-finished", "true");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);

    // Kept and scored: its own page draws it, and the fastest table has it.
    await page.getByTestId("puzzle-see-solve").click();
    await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", /replay|finished/);
    await page.goto(AT);
    await expect(page.getByTestId("puzzle-fastest-rank").first()).toBeVisible();
    await expect(page.getByTestId("puzzle-points")).toContainText("every square of the grid");
  });

  test("solved by dragging along each row's runs, with the ✕ pen marking first", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const picture = pictureOf(10, "easy", seed);
    await page.goto(`${AT}/play?size=10&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");

    // The ✕ pen: a tap marks first, a second shades, a third clears.
    const empty = picture.indexOf(false);
    await page.getByTestId("picture-pen-mark").click();
    await expect(page.getByTestId("picture-pen-mark")).toHaveAttribute("aria-checked", "true");
    await square(page, empty).click();
    await expect(square(page, empty)).toHaveAttribute("data-state", "marked empty");
    await square(page, empty).click();
    await expect(square(page, empty)).toHaveAttribute("data-state", "shaded");
    await square(page, empty).click();
    await expect(square(page, empty)).toHaveAttribute("data-state", "blank");
    await page.getByTestId("picture-pen-shade").click();

    const runs = rowRuns(picture, 10);
    for (const [from, to] of runs) {
      if (await page.getByTestId("puzzle-done").isVisible()) break;
      if (from === to) await square(page, from).click();
      else await drag(page, from, to);
      await expect(square(page, to)).toHaveAttribute("data-state", "shaded");
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-finished", "true");
  });

  test("left half way, it waits in My games and opens where it was left", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const picture = pictureOf(10, "medium", seed);
    const cell = picture.indexOf(true);
    await page.goto(`${AT}/play?size=10&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    await square(page, cell).click();
    await expect(square(page, cell)).toHaveAttribute("data-state", "shaded");
    await page.getByTestId("puzzle-pause").click();
    await expect(page.getByTestId("puzzle-paused")).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await expect(page).toHaveURL(/\/play$/);
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="going"]').click();
    const row = page.locator(`[data-testid="puzzle-going"][data-kind="${KIND}"][data-seed="${seed}"]`);
    await expect(row).toBeVisible();
    await row.getByTestId("puzzle-going-continue").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-pausable")).toHaveAttribute("data-paused", "false");
    await expect(square(page, cell)).toHaveAttribute("data-state", "shaded");
  });

  test("a 20×20 on a phone fits the screen, zooms, and fits back", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${AT}/play?size=20&level=hard&seed=5`);
    await ready(page, "puzzle-play");
    const view = page.getByTestId("picture-viewport");
    await expect(view).toHaveAttribute("data-zoom", "1.00");
    await page.getByTestId("picture-arrows").click();
    await page.getByTestId("picture-pad-in").click();
    await expect(view).not.toHaveAttribute("data-zoom", "1.00");
    await page.getByTestId("picture-fit").click();
    await expect(view).toHaveAttribute("data-zoom", "1.00");
    // Put the arrows away again: this browser remembers them for every board.
    await page.getByTestId("picture-arrows").click();
    const wide = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(wide).toBeLessThanOrEqual(390);
  });

  test("in dark mode the paper stays white and its clues stay dark", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    const seed = 3;
    const clues = decodeClues(generatePuzzle(KIND, 5, "easy", seed).givens, 5)!;
    await page.goto(`${AT}/play?size=5&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");
    expect(await page.evaluate(() => matchMedia("(prefers-color-scheme: dark)").matches)).toBe(true);
    await expect(page.getByTestId("picture-clue")).toHaveCount(clues.rows.length + clues.cols.length);
    const paper = await page.getByTestId("picture-board").evaluate((node) => getComputedStyle(node).backgroundColor);
    const ink = await page.getByTestId("picture-clue").first().locator("text").first().evaluate((node) => getComputedStyle(node).fill);
    expect(paper).toBe("rgb(255, 255, 255)");
    expect(ink).toBe("rgb(34, 35, 31)");
  });

  test("its family's page and the set-up screen both show it beside Bridges", async ({ page }) => {
    await page.goto(`${AT}/family`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Logic puzzles");
    await expect(page.getByTestId("family-games")).toContainText(NAME);
    await page.goto("/games/new");
    await ready(page, "set-up-game");
    const logic = page.getByTestId("set-up-family").filter({ hasText: "Logic puzzles" });
    await logic.click();
    await expect(logic).toHaveAttribute("data-open", "true");
    const tile = page.locator(`[data-testid="set-up-puzzle"][data-kind="${KIND}"]`);
    await expect(tile).toHaveCount(1);
    await tile.click();
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-kind", KIND);
  });
});
