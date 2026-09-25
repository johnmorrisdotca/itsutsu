import { expect, test } from "@playwright/test";

import { playPath } from "../src/lib/gomoku/slugs";
import { familyOf } from "../src/lib/gomoku/families";
import { PUZZLE_DISPLAY, PUZZLE_KIND_LIST, PUZZLE_SPECS } from "../src/lib/puzzles/puzzles.constants";
import { ready } from "./support";

/**
 * THE NUMBERS FAMILY IS ON THE SET-UP SCREEN, AND THE SCREEN TURNS TO IT.
 *
 * John, 2026-09-24, on /games/new with seven family tiles and no Numbers:
 * "where tf is numbers games??? I didn't see them". The first answer opened
 * the puzzles as links and left the rest of the screen on the last board game,
 * with no picture: "There's an error because we don't have a Preview board for
 * the new games." So a puzzle is chosen here like a game — the heading names
 * it, its picture stands where the board did, its size and level replace the
 * opponent and Begin — and a board family takes the screen back to the game.
 * Every step is a press, as a reader makes it.
 */
test("the set-up screen turns to a puzzle chosen from Numbers, and back to the game", async ({ page }) => {
  await page.goto("/games/new");
  await ready(page, "set-up-game");
  const summary = page.getByTestId("set-up-summary");
  const game = (await summary.textContent()) ?? "";
  expect(game.length).toBeGreaterThan(0);
  // The game's own preview, measured, so the puzzle's can be held to the same box.
  const boardBox = await page.getByTestId("board-preview").boundingBox();
  expect(boardBox).not.toBeNull();

  const numbers = page.getByTestId("set-up-family").filter({ hasText: /Numbers|数/ });
  await numbers.click();
  await expect(numbers).toHaveAttribute("data-open", "true");

  // The first puzzle is chosen, and the whole screen is about it.
  // The Numbers shelf: every puzzle whose home is Numbers. WordDrop's family, Other, is kept off this screen for now.
  const shelf = PUZZLE_KIND_LIST.filter((kind) => familyOf(kind)?.key === "numbers");
  const [first, second] = shelf;
  const puzzles = page.getByTestId("set-up-puzzle");
  await expect(puzzles).toHaveCount(shelf.length);
  await expect(puzzles.first()).toHaveAttribute("data-chosen", "true");
  await expect(summary).toContainText(PUZZLE_DISPLAY[first!].label);
  /*
   * THE PREVIEW IS A LIVE BOARD, like a game's: this puzzle, at the size
   * chosen, in the same box — so choosing Numbers moves nothing on the page.
   * John: "Each image is supposed to change based on size and type."
   */
  const preview = page.getByTestId("set-up-puzzle-preview");
  await expect(preview).toHaveAttribute("data-kind", first!);
  await expect(preview).toHaveAttribute("data-size", String(PUZZLE_SPECS[first!].defaultSize));
  const puzzleBox = await preview.boundingBox();
  expect(Math.round(puzzleBox!.width)).toBe(Math.round(boardBox!.width));
  expect(Math.round(puzzleBox!.height)).toBe(Math.round(boardBox!.height));
  const smallest = PUZZLE_SPECS[first!].offered[0]!;
  await page.locator(`[data-testid="set-up-size"][data-size="${smallest}"]`).click();
  await expect(preview).toHaveAttribute("data-size", String(smallest));
  // Its sizes are the board games' tiles, one chosen, each the big number in the board's own lattice.
  const sizes = page.getByTestId("set-up-size");
  await expect(sizes).toHaveCount(PUZZLE_SPECS[first!].offered.length);
  await expect(sizes.getByTestId("board-size-mark")).toHaveCount(PUZZLE_SPECS[first!].offered.length);
  await expect(page.locator('[data-testid="set-up-size"][data-chosen="true"]')).toHaveCount(1);
  await ready(page, "puzzle-set-up");
  // Asked only once the puzzle's own controls are there: no seats, no Begin.
  await expect(page.getByTestId("set-up-continue")).toHaveCount(0);

  // Another puzzle, chosen the way a game is.
  await puzzles.nth(1).click();
  await expect(puzzles.nth(1)).toHaveAttribute("data-chosen", "true");
  await expect(summary).toContainText(PUZZLE_DISPLAY[second!].label);
  await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", new RegExp(`^${playPath(second!)}\\?`));

  // The way back: a board family returns the screen to the game it held.
  await page.getByTestId("set-up-family").first().click();
  await expect(summary).toHaveText(game);
  await expect(page.getByTestId("set-up-variant").first()).toBeVisible();
  await expect(page.getByTestId("set-up-continue")).toBeVisible();
  await expect(puzzles).toHaveCount(0);

  // And Solve, pressed, goes to the puzzle with the choice in its address.
  await numbers.click();
  await ready(page, "puzzle-set-up");
  await page.getByTestId("puzzle-solve").click();
  await expect(page).toHaveURL(new RegExp(`${playPath(first!)}\\?`));
});
