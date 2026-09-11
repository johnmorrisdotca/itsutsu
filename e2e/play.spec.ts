import { expect, test } from "@playwright/test";
import { openAdvanced, playAt, playSequence, winningSequence } from "./support";

test.describe("playing a game", () => {
  test("black wins with five in a row", async ({ page }) => {
    await page.goto("/games/gomoku/play");

    await playSequence(page, 15, winningSequence());

    await expect(page.getByText(/wins in 9 moves/)).toBeVisible();
    // The board refuses further stones once the game is over.
    await expect(
      page.getByRole("button", { name: /^A1, empty$/ }),
    ).toBeDisabled();
  });

  test("stones alternate colour and the record follows along", async ({ page }) => {
    await page.goto("/games/gomoku/play");

    await playAt(page, 15, 7, 7);
    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();

    await playAt(page, 15, 7, 8);
    await expect(page.getByRole("button", { name: "J8, White stone" })).toBeVisible();

    const record = page.getByTestId("move-history");
    await expect(record.getByRole("listitem")).toHaveCount(2);
  });

  test("undo takes the last stone back, redo puts it down again", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await playAt(page, 15, 7, 7);

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByRole("button", { name: /^H8, empty$/ })).toBeVisible();

    await page.getByRole("button", { name: "Redo" }).click();
    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();
  });
});

test.describe("awareness", () => {
  test("warns the player who has to answer a threat", async ({ page }) => {
    await page.goto("/games/gomoku/play");

    // Black builds an open three; white is then the side that must respond.
    await playSequence(page, 15, [
      [7, 3],
      [0, 0],
      [7, 4],
      [0, 1],
      [7, 5],
    ]);

    const banner = page.getByRole("status").first();
    await expect(banner).toHaveAttribute("data-outlook", /danger|critical/);
  });

  test("says nothing at all when awareness is switched off", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await openAdvanced(page);
    await page.getByTestId("awareness").selectOption("off");

    await playSequence(page, 15, [[7, 3], [0, 0], [7, 4], [0, 1], [7, 5]]);

    await expect(page.locator("[data-outlook]")).toHaveCount(0);
  });

  test("marks the losing move once a game is thrown away", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await openAdvanced(page);
    await page.getByTestId("awareness").selectOption("full");

    // White ignores an open three twice over, letting black build an open four.
    await playSequence(page, 15, [
      [7, 3],
      [0, 0],
      [7, 4],
      [0, 1],
      [7, 5],
      [0, 2],
      [7, 6],
    ]);

    await expect(page.locator("[data-fatal-move]")).toBeVisible();
  });
});

test.describe("hints", () => {
  test("spends an allowance and names a point", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await playSequence(page, 15, [[7, 3], [0, 0], [7, 4], [0, 1], [7, 5], [0, 2]]);

    await page.getByTestId("ask-hint").click();

    // Black is about to make a four; the hint should point at that line.
    await expect(page.getByTestId("hint-line")).toBeVisible();
    await expect(page.getByTestId("ask-hint")).toContainText("2");
  });
});
