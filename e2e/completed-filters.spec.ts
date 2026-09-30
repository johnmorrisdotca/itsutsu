import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generateNumberPlace } from "../src/lib/puzzles/numberPlace/generate";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { freshPuzzleSeed, ready } from "./support";

/**
 * COMPLETED, NARROWED TO A GAME OR A FAMILY. John, 2026-09-30: "Complete games
 * page should list everything together", then "Allow filters. For the game
 * type / family". This solves a Sudoku, narrows Completed to Sudoku by its
 * control, finds only Sudoku rows and the narrowing said in a chip, reloads
 * to the same list, then takes it off by the chip and is back to everything.
 */
test("Completed narrows to one game by its control, says so, and comes back", async ({ page }) => {
  const seed = freshPuzzleSeed();
  const puzzle = generateNumberPlace(4, "easy", seed);
  const givens = decodeCells(puzzle.givens, 4)!;
  const solution = decodeCells(puzzle.solution, 4)!;
  await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/play?size=4&level=easy&seed=${seed}`);
  await ready(page, "puzzle-play");
  for (const [index, given] of givens.entries()) {
    if (given !== 0) continue;
    await page.getByTestId("puzzle-cell").nth(index).click();
    await page.getByTestId(`puzzle-key-${solution[index]}`).click();
  }
  await expect(page.getByTestId("puzzle-paid")).toBeVisible();

  await page.goto("/play/completed");
  await ready(page, "completed-filters");
  await expect(page.getByTestId("completed-narrowed")).toHaveCount(0);

  // By the control, as a reader would: the address carries it, and every row is the game chosen.
  await page.getByTestId("completed-filter-game").selectOption(PUZZLE_SLUGS.numberPlace);
  await expect(page).toHaveURL(new RegExp(`game=${PUZZLE_SLUGS.numberPlace}`));
  await expect(page.getByTestId("completed-narrowed-game")).toBeVisible();
  const rows = page.locator('[data-testid="my-games-finished"] ul > li');
  await expect(rows.first()).toHaveAttribute("data-kind", "numberPlace");
  expect(new Set(await rows.evaluateAll((all) => all.map((li) => li.getAttribute("data-kind"))))).toEqual(new Set(["numberPlace"]));

  // The same list from the address alone.
  await page.reload();
  await ready(page, "completed-filters");
  await expect(page.getByTestId("completed-filter-game")).toHaveValue(PUZZLE_SLUGS.numberPlace);

  // Its family too: the Sudoku is on its family's list.
  await page.getByTestId("completed-narrowed-game").click();
  await ready(page, "completed-filters");
  await expect(page.getByTestId("completed-narrowed")).toHaveCount(0);
  const familyValue = await page.getByTestId("completed-filter-family").locator("option").evaluateAll((all, wanted) => all.find((one) => one.textContent === wanted)?.getAttribute("value") ?? "", "Numbers");
  await page.getByTestId("completed-filter-family").selectOption(familyValue);
  await expect(page).toHaveURL(/family=/);
  await expect(page.getByTestId("completed-narrowed-family")).toBeVisible();
  await expect(page.locator('[data-testid="my-games-finished"] [data-testid="puzzle-solved"][data-kind="numberPlace"]').first()).toBeVisible();

  // And off again, the whole way: every kind back.
  await page.getByTestId("completed-narrowed-off").click();
  await expect(page).toHaveURL(/\/play\/completed$/);
  await ready(page, "completed-filters");
  await expect(page.getByTestId("completed-narrowed")).toHaveCount(0);
});
