import { expect, test } from "@playwright/test";
import { openAdvanced, playAt } from "./support";

test.describe("game options", () => {
  test("the mini board is 9x9", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("board-size").selectOption("9");

    // 81 intersections, and the top-left is A9 rather than A15.
    await expect(page.getByRole("button", { name: /^A9, empty$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /, (empty|Black|White)/ })).toHaveCount(81);
  });

  test("obstacles seal the star points but leave tengen open", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("board-size").selectOption("9");
    await page.getByTestId("obstacles").selectOption("hoshi");

    await expect(page.getByRole("button", { name: "C7, blocked" })).toBeDisabled();
    // Tengen stays playable.
    await expect(page.getByRole("button", { name: /^E5, empty$/ })).toBeEnabled();
  });

  test("white can be given the first stone in freestyle", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("first-player").selectOption("white");

    await expect(page.getByTestId("to-play")).toContainText("White");
  });

  test("standard rules refuse to hand the first stone over", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("rules").selectOption("standard");

    await expect(page.getByTestId("first-player")).toBeDisabled();
    await expect(page.getByTestId("to-play")).toContainText("Black");
  });

  test("undo can be switched off for a game where stones are final", async ({ page }) => {
    await page.goto("/");
    await openAdvanced(page);
    await page.getByLabel("Allow taking moves back").uncheck();

    await playAt(page, 15, 7, 7);
    await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
  });

  test("a board theme changes the surface without touching the game", async ({ page }) => {
    await page.goto("/");
    await playAt(page, 15, 7, 7);

    await page.getByTestId("board-theme-sumi").click();

    await expect(page.getByTestId("board-theme-sumi")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // The stone that was played is still exactly where it was.
    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();
  });

  test("move numbers can be printed on the stones", async ({ page }) => {
    await page.goto("/");
    await playAt(page, 15, 7, 7);
    await playAt(page, 15, 7, 8);

    await page.getByLabel("Move numbers").check();

    await expect(page.getByRole("button", { name: "H8, Black stone" })).toContainText("1");
    await expect(page.getByRole("button", { name: "J8, White stone" })).toContainText("2");
  });
});
