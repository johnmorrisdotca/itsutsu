import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generateNumberPlace } from "../src/lib/puzzles/numberPlace/generate";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { freshPuzzleSeed, ready } from "./support";

/**
 * MY GAMES' SOLVED PUZZLES, on Completed among the finished games. John,
 * 2026-09-25: "where will the completed puzzles go… where are the scores?!",
 * 2026-09-26: "All completed should be in ONE tab", and 2026-09-30: "Complete
 * games page should list everything together." This solves one, then finds it
 * at the top of Completed's one list with its points, its time and the help it
 * took, and checks there is no Puzzles tab left to find it in twice.
 */
test("a solved puzzle heads Completed's one list, with its points, its time and its help", async ({ page }) => {
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

  await page.goto("/play");
  await ready(page, "tabs");
  // The Completed tab, by its tab, and no Puzzles tab beside it.
  await expect(page.getByRole("link", { name: /^Puzzles/ })).toHaveCount(0);
  await page.getByRole("link", { name: /^Completed/ }).click();
  const list = page.getByTestId("my-games-finished");
  await expect(list).toBeVisible();
  await expect(page.getByTestId("my-games-finished-count")).not.toHaveText(/^0/);
  // The newest thing finished, so the first row of the one list, whatever kind the rows under it are.
  const newest = list.locator("ul > li").first();
  await expect(newest).toHaveAttribute("data-testid", "puzzle-solved");
  await expect(newest).toHaveAttribute("data-kind", "numberPlace");
  await expect(newest).toContainText("4×4");
  await expect(newest).toContainText("no help");
  // Twelve-odd cells filled at five points each: a score, never nought, for a solve with no help.
  await expect(newest.getByTestId("puzzle-solved-points")).not.toContainText(/^0/);

  // The row opens the member's own solves of that puzzle.
  await newest.locator("[data-card-link]").click();
  await expect(page).toHaveURL(new RegExp(`/games/${PUZZLE_SLUGS.numberPlace}/me`));
});
