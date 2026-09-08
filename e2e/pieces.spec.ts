import { expect, test } from "@playwright/test";
import { playAt } from "./support";

/** The drop family and the piece games, driven from the board and the tray. */
test.describe("drops and pieces", () => {
  test("hot drop scatters a hotspot and a hole", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.getByTestId("rules").selectOption("hotDrop");
    await expect(page.getByRole("button", { name: /, hotspot$/ })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /, blocked$/ })).toHaveCount(1);
  });

  test("giveaway drop refuses the column on top of the opponent's last stone", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.getByTestId("rules").selectOption("giveawayDrop");
    await playAt(page, 7, 6, 3);
    // White may not answer directly on top of D1.
    await expect(page.getByRole("button", { name: /^D2, empty$/ })).toBeDisabled();
    await expect(page.getByRole("button", { name: /^C1, empty$/ })).toBeEnabled();
  });

  test("edge drop only allows stones that rest on something", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.getByTestId("rules").selectOption("edgeDrop");
    await expect(page.getByRole("button", { name: /^D4, empty$/ })).toBeDisabled();
    await expect(page.getByRole("button", { name: /^A4, empty$/ })).toBeEnabled();
    await playAt(page, 7, 3, 0);
    await expect(page.getByRole("button", { name: /^B4, empty$/ })).toBeEnabled();
    await expect(page.getByRole("button", { name: /^C4, empty$/ })).toBeDisabled();
  });

  test("domino five shows the piece in hand and lays two stones at once", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.getByTestId("rules").selectOption("dominoFive");
    await expect(page.getByTestId("board-size")).toHaveValue("15");

    const tray = page.getByTestId("piece-tray");
    await expect(tray).toBeVisible();
    await expect(tray.getByTestId("next-pieces").getByRole("img")).toHaveCount(3);
    await expect(page.getByTestId("variant-line")).toContainText("Lay the piece in hand");

    // A domino laid flat with its corner on H8 covers H8 and J8.
    await page.getByRole("button", { name: /^H8, empty$/ }).click();
    await expect(page.getByRole("button", { name: /^H8, (Black|White) stone$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^J8, (Black|White) stone$/ })).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("White");
    await expect(page.getByTestId("move-history")).toContainText("×2");
  });

  test("domino five rotates the piece before laying it", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.getByTestId("rules").selectOption("dominoFive");
    await page.getByTestId("rotate-piece").click();
    // Upright now: the corner on H8 covers H8 and the point below it, H7.
    await page.getByRole("button", { name: /^H8, empty$/ }).click();
    await expect(page.getByRole("button", { name: /^H8, (Black|White) stone$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^H7, (Black|White) stone$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^J8, empty$/ })).toBeVisible();
  });

  test("block five lays four stones, or one single of your colour", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.getByTestId("rules").selectOption("blockFive");
    await expect(page.getByTestId("toggle-single")).toContainText("6");

    await page.getByTestId("toggle-single").click();
    await expect(page.getByTestId("variant-line")).toContainText("Lay one stone");
    await page.getByRole("button", { name: /^H8, empty$/ }).click();
    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("White");

    // White lays a piece: four stones land.
    await page.getByRole("button", { name: /^C3, empty$/ }).click();
    await expect(page.getByRole("button", { name: /, (Black|White) stone$/ })).toHaveCount(5);
    // Black's singles are spent one at a time; white spent none.
    await expect(page.getByTestId("toggle-single")).toContainText("5");
  });
});
