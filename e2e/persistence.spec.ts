import { expect, test } from "@playwright/test";
import { openSetup, playAt } from "./support";

test.describe("surviving a refresh", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("the stones are still there after reloading", async ({ page }) => {
    await page.goto("/games/gomoku");
    await playAt(page, 15, 7, 7);
    await playAt(page, 15, 7, 8);

    await page.reload();

    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();
    await expect(page.getByRole("button", { name: "J8, White stone" })).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("Black");
  });

  test("undo still reaches back through a restored game", async ({ page }) => {
    await page.goto("/games/gomoku");
    await playAt(page, 15, 7, 7);
    await playAt(page, 15, 7, 8);
    await page.reload();

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByRole("button", { name: /^J8, empty$/ })).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByRole("button", { name: /^H8, empty$/ })).toBeVisible();
  });

  test("settings and appearance come back too", async ({ page }) => {
    await page.goto("/games/gomoku");
    await openSetup(page);
    await page.getByTestId("board-size").selectOption("9");
    await openSetup(page);
    await page.getByTestId("board-theme-sumi").click();
    await playAt(page, 9, 4, 4);

    await page.reload();

    await expect(page.getByRole("button", { name: "E5, Black stone" })).toBeVisible();
    await expect(page.getByTestId("board-theme-sumi")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("a new game clears what was stored", async ({ page }) => {
    await page.goto("/games/gomoku");
    await playAt(page, 15, 7, 7);
    await page.getByRole("button", { name: "New game" }).click();

    await page.reload();
    await expect(page.getByRole("button", { name: /^H8, empty$/ })).toBeVisible();
  });
});
