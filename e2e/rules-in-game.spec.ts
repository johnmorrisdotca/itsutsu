import { expect, test } from "@playwright/test";

import { freshPuzzleSeed, ready } from "./support";

/**
 * RULES OVER THE BOARD, NOT A PAGE AWAY FROM IT.
 *
 * John, 2026-09-25, in the middle of a puzzle: "if you're in a Game, pressing
 * the Rules shouldn't take you out of the game... A Modal of just the Rules".
 * On a puzzle and on a game's board, Rules opens the four parts over the page,
 * with no Play in it, and closing it leaves the reader where they were.
 */
test("a puzzle's Rules open over the puzzle, with no Play, and close back to it", async ({ page }) => {
  const at = `/games/number-place/play?size=4&level=easy&seed=${freshPuzzleSeed()}`;
  await page.goto(at);
  await ready(page, "puzzle-play");
  await ready(page, "open-rules");

  await page.getByTestId("open-rules").click();
  const dialog = page.getByTestId("rules-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Object");
  await expect(dialog).toContainText("House rules");
  // Checked once the rules are drawn: the modal is the rules and nothing else.
  await expect(dialog.getByRole("link")).toHaveCount(0);

  await page.getByTestId("close-rules").click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(at);
  await expect(page.getByTestId("puzzle-play")).toBeVisible();
});

test("a game's Rules open over the board, and Escape closes them", async ({ page }) => {
  await page.goto("/games/gomoku/play");
  await ready(page, "open-rules");
  await page.getByTestId("open-rules").click();
  const dialog = page.getByTestId("rules-dialog");
  await expect(dialog).toContainText("Object");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/games\/gomoku\/play$/);
});
