import { expect, test } from "@playwright/test";
import { openAdvanced, openSetup, playAt, playSequence } from "./support";

/**
 * Resizing the board is a decision the two players make together, so these
 * specs are as much about the agreement as the geometry.
 */
test.describe("resizing the board", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku");
    await openAdvanced(page);
    await page.getByLabel("Allow resizing the board").check();
  });

  test("is not offered unless the game allows it", async ({ page }) => {
    await page.getByLabel("Allow resizing the board").uncheck();
    await expect(page.getByTestId("propose-grow")).toHaveCount(0);
  });

  test("one player offers and nothing happens until the other agrees", async ({
    page,
  }) => {
    await openSetup(page);
    await page.getByTestId("board-size").selectOption("9");
    await page.getByLabel("Allow resizing the board").check();
    await playAt(page, 9, 4, 4);

    await page.getByTestId("propose-grow").click();

    // Offered, not done: the board is still nine.
    await expect(page.getByTestId("resize-proposal")).toBeVisible();
    await expect(page.getByRole("button", { name: /^A9, empty$/ })).toBeVisible();

    await page.getByTestId("accept-resize").click();

    // Thirteen now, and the stone kept its place relative to the centre.
    await expect(page.getByRole("button", { name: /^A13, empty$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "G7, Black stone" })).toBeVisible();
  });

  test("declining leaves the board alone", async ({ page }) => {
    await openSetup(page);
    await page.getByTestId("board-size").selectOption("9");
    await page.getByLabel("Allow resizing the board").check();
    await playAt(page, 9, 4, 4);

    await page.getByTestId("propose-grow").click();
    await page.getByTestId("decline-resize").click();

    await expect(page.getByTestId("resize-proposal")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^A9, empty$/ })).toBeVisible();
  });

  test("a move settles the question and clears a stale offer", async ({ page }) => {
    await openSetup(page);
    await page.getByTestId("board-size").selectOption("9");
    await page.getByLabel("Allow resizing the board").check();
    await playAt(page, 9, 4, 4);

    await page.getByTestId("propose-grow").click();
    await expect(page.getByTestId("resize-proposal")).toBeVisible();

    await playAt(page, 9, 3, 3);
    await expect(page.getByTestId("resize-proposal")).toHaveCount(0);
  });

  test("nobody loses a turn by resizing", async ({ page }) => {
    await openSetup(page);
    await page.getByTestId("board-size").selectOption("9");
    await page.getByLabel("Allow resizing the board").check();
    await playAt(page, 9, 4, 4);

    // White is to move before the offer, and still to move after it.
    await expect(page.getByTestId("to-play")).toContainText("White");
    await page.getByTestId("propose-grow").click();
    await page.getByTestId("accept-resize").click();
    await expect(page.getByTestId("to-play")).toContainText("White");
  });

  test("shrinks when the outer ring is unused", async ({ page }) => {
    await openSetup(page);
    await page.getByTestId("board-size").selectOption("13");
    await page.getByLabel("Allow resizing the board").check();
    await playSequence(page, 13, [[6, 6], [6, 7]]);

    await page.getByTestId("propose-shrink").click();
    await page.getByTestId("accept-resize").click();

    await expect(page.getByRole("button", { name: /^A9, empty$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "E5, Black stone" })).toBeVisible();
  });

  test("refuses to shrink over a stone in the outer ring", async ({ page }) => {
    await openSetup(page);
    await page.getByTestId("board-size").selectOption("13");
    await page.getByLabel("Allow resizing the board").check();
    // (1,1) sits inside the margin a 13 to 9 step would remove.
    await playSequence(page, 13, [[1, 1], [6, 6]]);

    await expect(page.getByTestId("propose-shrink")).toHaveCount(0);
  });
});
