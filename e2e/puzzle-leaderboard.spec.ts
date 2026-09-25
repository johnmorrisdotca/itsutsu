import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generateNumberPlace } from "../src/lib/puzzles/numberPlace/generate";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { pointsFor } from "../src/lib/puzzles/puzzlePoints";
import { freshPuzzleSeed, ready } from "./support";

/**
 * A PUZZLE'S LEADERBOARD, ON ITS OWN PAGE, AS PUZZLEMADNESS HAS THEM. John,
 * 2026-09-24: "I want leaderboards, which we have... but these are so prominent
 * and easy to read." A solve puts its solver on the all-time and monthly boards
 * of that puzzle with the points `pointsFor` gives it; a stranger is shown the
 * shut state, as every ladder shows one.
 */
const AT = `/games/${PUZZLE_SLUGS.numberPlace}`;

test("a solve puts its solver on the puzzle's boards, all time and this month", async ({ page }) => {
  const seed = freshPuzzleSeed();
  const puzzle = generateNumberPlace(4, "easy", seed);
  const givens = decodeCells(puzzle.givens, 4)!;
  const solution = decodeCells(puzzle.solution, 4)!;
  await page.goto(`${AT}/play?size=4&level=easy&seed=${seed}`);
  await ready(page, "puzzle-play");
  for (const [index, given] of givens.entries()) {
    if (given !== 0) continue;
    await page.getByTestId("puzzle-cell").nth(index).click();
    await page.getByTestId(`puzzle-key-${solution[index]}`).click();
  }
  await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  await expect(page.getByTestId("puzzle-paid")).not.toContainText("Recording");
  expect(pointsFor("numberPlace", 4, puzzle.givens, 0, 0)).toBeGreaterThan(0);

  await page.goto(AT);
  const board = page.getByTestId("puzzle-points");
  await expect(board).toBeVisible();
  // The operator solved one just now, so is on both boards, with a positive total.
  for (const which of ["puzzle-points-all", "puzzle-points-month"]) {
    const rows = board.getByTestId(which).getByTestId("puzzle-points-row");
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThan(0);
  }
  await board.getByTestId("puzzle-points-whole").click();
  await expect(page).toHaveURL(/\/standings$/);
  await expect(page.getByTestId("puzzle-points-all").getByTestId("puzzle-points-row").first()).toBeVisible();
});

test.describe("a reader with no session", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test("is shown the board is shut, and the way in", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("puzzle-points-shut")).toBeVisible();
    await expect(page.getByTestId("puzzle-points-row")).toHaveCount(0);
  });
});
