import { expect, test } from "@playwright/test";

test.describe("checkers", () => {
  test("captures by a forced jump, and blocks a piece with no capture of its own", async ({ page }) => {
    await page.goto("/games/checkers/play");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/checkers/play");

    // Both sides start with twelve men filling the dark squares of their own three rows.
    await expect(page.getByRole("button", { name: "B8, Black stone" })).toBeVisible();
    await expect(page.getByRole("button", { name: "A3, White stone" })).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("Black");

    // Black: D6 to E5.
    await page.getByRole("button", { name: "D6, Black stone" }).click();
    await page.getByRole("button", { name: /^E5, empty$/ }).click();
    await expect(page.getByTestId("to-play")).toContainText("White");

    // White: C3 to D4 — puts a white man where black can jump it, and leaves C3 open to land on.
    await page.getByRole("button", { name: "C3, White stone" }).click();
    await page.getByRole("button", { name: /^D4, empty$/ }).click();
    await expect(page.getByTestId("to-play")).toContainText("Black");

    // Black has a capture on offer, so a different black man with no capture of its own is offered no step.
    await page.getByRole("button", { name: "B6, Black stone" }).click();
    await expect(page.getByRole("button", { name: /^A5, empty$/ })).toBeDisabled();
    await expect(page.getByRole("button", { name: "B6, Black stone" })).toBeVisible();

    // The piece that can capture jumps over D4 and lands on C3, taking the white man off the board.
    await page.getByRole("button", { name: "E5, Black stone" }).click();
    await page.getByRole("button", { name: /^C3, empty$/ }).click();
    await expect(page.getByRole("button", { name: "C3, Black stone" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^D4, empty$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^E5, empty$/ })).toBeVisible();
    // No further capture is waiting from C3, so the turn passes.
    await expect(page.getByTestId("to-play")).toContainText("White");
  });

  test("the rules page says what capturing and crowning are, at its address", async ({ page }) => {
    await page.goto("/games/checkers/rules");
    await expect(page.getByText(/forced/i).first()).toBeVisible();
    await expect(page.getByText(/crowned/i).first()).toBeVisible();
  });
});
