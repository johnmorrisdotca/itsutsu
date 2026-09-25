import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generateNumberPlace } from "../src/lib/puzzles/numberPlace/generate";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { freshPuzzleSeed, ready } from "./support";

/**
 * AN UNFINISHED PUZZLE IS KEPT, AND WAITS IN MY GAMES.
 *
 * John, 2026-09-24: "I started Numbers game, paused it, then clicked away...
 * why is it not showing up in my current games list?" This does exactly that —
 * a number, Pause, and a link in the site's own header — and then finds it on
 * /play, opens it where it was left, and finishes it, after which it is gone.
 * Each run uses a seed of its own, so a row another run kept is not this one.
 */
const SIZE = 4;
const LEVEL = "easy";
const AT = `/games/${PUZZLE_SLUGS.numberPlace}`;

test("paused and left by a link, it is in My games, opens where it was left, and is gone once solved", async ({ page }) => {
  const seed = freshPuzzleSeed();
  const puzzle = generateNumberPlace(SIZE, LEVEL, seed);
  const givens = decodeCells(puzzle.givens, SIZE)!;
  const solution = decodeCells(puzzle.solution, SIZE)!;
  const first = givens.findIndex((given) => given === 0);

  await page.goto(`${AT}/play?size=${SIZE}&level=${LEVEL}&seed=${seed}`);
  await ready(page, "puzzle-play");
  await page.getByTestId("puzzle-cell").nth(first).click();
  await page.getByTestId(`puzzle-key-${solution[first]}`).click();
  await page.getByTestId("puzzle-pause").click();
  await expect(page.getByTestId("puzzle-paused")).toBeVisible();

  // Clicked away, by the site's own navigation, as John did.
  await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
  await expect(page).toHaveURL(/\/play$/);
  const row = page.locator(`[data-testid="puzzle-going"][data-seed="${seed}"]`);
  await expect(row, "the puzzle left unfinished is not in My games").toBeVisible();
  await expect(row).toContainText("so far");

  await row.getByTestId("puzzle-going-continue").click();
  await ready(page, "puzzle-play");
  // Opened where it was left: covered and paused, the number still written.
  await expect(page.getByTestId("puzzle-paused-words")).toContainText("Kept where you left it");
  await page.getByTestId("puzzle-resume").click();
  await expect(page.getByTestId("puzzle-cell").nth(first)).toHaveAttribute("data-value", String(solution[first]));

  for (const [index, given] of givens.entries()) {
    if (given !== 0 || index === first) continue;
    await page.getByTestId("puzzle-cell").nth(index).click();
    await page.getByTestId(`puzzle-key-${solution[index]}`).click();
  }
  await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);

  await page.goto("/play");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(`[data-testid="puzzle-going"][data-seed="${seed}"]`), "a solved puzzle is still listed as going").toHaveCount(0);
});

test("left by a link without pausing, it is kept too", async ({ page }) => {
  const seed = freshPuzzleSeed();
  const puzzle = generateNumberPlace(SIZE, LEVEL, seed);
  const givens = decodeCells(puzzle.givens, SIZE)!;
  const solution = decodeCells(puzzle.solution, SIZE)!;
  const first = givens.findIndex((given) => given === 0);

  await page.goto(`${AT}/play?size=${SIZE}&level=${LEVEL}&seed=${seed}`);
  await ready(page, "puzzle-play");
  await page.getByTestId("puzzle-cell").nth(first).click();
  await page.getByTestId(`puzzle-key-${solution[first]}`).click();
  await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
  await expect(page).toHaveURL(/\/play$/);
  await expect(page.locator(`[data-testid="puzzle-going"][data-seed="${seed}"]`)).toBeVisible();
});
