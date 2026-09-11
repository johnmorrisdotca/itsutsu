import { expect, test } from "@playwright/test";

/** Column letters as the board labels them, with "I" skipped as in go. */
const COLUMNS = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
const cell = (row: number, col: number) => `${COLUMNS[col]}${11 - row}`;

test.describe("hex", () => {
  test("is a rhombus where a cell touches six, and joining your two sides wins", async ({ page }) => {
    await page.goto("/games/hex");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/hex");

    // Eleven a side.
    await expect(page.getByRole("button", { name: /empty$/ })).toHaveCount(121);

    // Black walks down a column while white answers along the far side.
    for (let row = 0; row < 10; row += 1) {
      await page.getByRole("button", { name: new RegExp(`^${cell(row, 5)}, empty$`) }).click();
      await expect(page.getByTestId("to-play")).toContainText("White");
      await page.getByRole("button", { name: new RegExp(`^${cell(row, 9)}, empty$`) }).click();
    }
    // Nothing yet: black is one cell short of the bottom.
    await expect(page.getByTestId("to-play")).toContainText("to play");

    await page.getByRole("button", { name: new RegExp(`^${cell(10, 5)}, empty$`) }).click();
    await expect(page.getByTestId("to-play")).toContainText("top and bottom are joined");
  });

  test("its rules page says a draw is impossible, and it offers the swap", async ({ page }) => {
    await page.goto("/games/hex/rules");
    await expect(page.getByTestId("rules-page")).toContainText("draw is impossible");
    await expect(page.getByTestId("rules-page")).toContainText("six");
    await expect(page.getByTestId("rules-page")).toContainText("Swap");
  });
});
