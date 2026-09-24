import { expect, test } from "@playwright/test";

import { PUZZLE_KIND_LIST } from "../src/lib/puzzles/puzzles.constants";
import { setUpPath } from "../src/lib/gomoku/slugs";
import { ready } from "./support";

/**
 * THE NUMBERS FAMILY IS ON THE SET-UP SCREEN, AND LEADS TO ITS PUZZLES.
 *
 * John, 2026-09-24, on /games/new with seven family tiles and no Numbers:
 * "where tf is numbers games??? I didn't see them". The tile opens the family's
 * puzzles as links, each to its own set-up, and leaves the two-seat game the
 * screen had chosen alone. Pressed, as a reader does, and the way back is a
 * press on a board family.
 */
test("the set-up screen offers Numbers, and a puzzle there leads to its own set-up", async ({ page }) => {
  await page.goto("/games/new");
  await ready(page, "set-up-game");
  const numbers = page.getByTestId("set-up-family").filter({ hasText: /Numbers|数/ });
  await expect(numbers).toBeVisible();
  await numbers.click();
  await expect(numbers).toHaveAttribute("data-open", "true");

  const puzzles = page.getByTestId("set-up-puzzle");
  await expect(puzzles).toHaveCount(PUZZLE_KIND_LIST.length);
  const first = PUZZLE_KIND_LIST[0]!;
  await expect(puzzles.first()).toHaveAttribute("href", setUpPath(first));

  // The way back: a board family opens its games again.
  await page.getByTestId("set-up-family").first().click();
  await expect(page.getByTestId("set-up-variant").first()).toBeVisible();
  await expect(page.getByTestId("set-up-puzzle")).toHaveCount(0);

  // And a puzzle, pressed, is its own set-up page.
  await numbers.click();
  await page.getByTestId("set-up-puzzle").first().click();
  await expect(page).toHaveURL(new RegExp(`${setUpPath(first)}$`));
});
