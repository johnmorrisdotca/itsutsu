import { expect, test } from "@playwright/test";

import { playAt, readyHere } from "./support";

/**
 * A game played on one screen has a scrubber from the empty board to the last
 * move, and opens as one picture of every position — John, on such a match:
 * "Where is the scrubber to move from 1 to last move… Also no images for this
 * game too."
 */
test("a game on one screen sweeps from its first position to its last, and opens as one picture", async ({ page }) => {
  await page.goto("/games/gomoku/play");
  await page.getByRole("button", { name: "New game" }).click();
  await playAt(page, 15, 7, 7);
  await expect(page).toHaveURL(/\/games\/gomoku\/match\/[A-Za-z0-9_-]+\/1$/);
  await playAt(page, 15, 7, 8);
  await playAt(page, 15, 8, 8);
  await expect(page).toHaveURL(/\/3$/);

  // Swept back to the empty board and forward again, the address follows the position.
  const scrubber = page.getByTestId("history-scrubber");
  await expect(scrubber).toHaveAttribute("max", "3");
  await scrubber.fill("0");
  await expect(page).toHaveURL(/\/0$/);
  await scrubber.fill("2");
  await expect(page).toHaveURL(/\/2$/);

  // The whole line as a picture, in a window: three moves, three tiles.
  const open = page.getByTestId("open-mosaic");
  await readyHere(open);
  await open.click();
  const picture = page.getByTestId("mosaic-dialog").getByTestId("mosaic-picture");
  await expect(picture).toBeVisible();
  expect(await picture.getAttribute("alt")).toBe("Every position of this game, 3 moves");
  await page.getByTestId("close-mosaic").click();
  await expect(page.getByTestId("mosaic-dialog")).toHaveCount(0);
});
