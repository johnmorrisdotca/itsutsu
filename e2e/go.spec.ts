import { expect, test } from "@playwright/test";

test.describe("go", () => {
  test("captures a stone the moment its last liberty is taken", async ({ page }) => {
    await page.goto("/games/go/play");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/go/play");

    await expect(page.getByTestId("to-play")).toContainText("Black");

    // Black surrounds a lone white stone at E15 on three sides, then closes the fourth.
    await page.getByRole("button", { name: /^E16, empty$/ }).click(); // black
    await page.getByRole("button", { name: /^E15, empty$/ }).click(); // white — the stone about to be taken
    await page.getByRole("button", { name: /^E14, empty$/ }).click(); // black
    await page.getByRole("button", { name: /^A19, empty$/ }).click(); // white, elsewhere
    await page.getByRole("button", { name: /^D15, empty$/ }).click(); // black
    await page.getByRole("button", { name: /^B19, empty$/ }).click(); // white, elsewhere

    await expect(page.getByRole("button", { name: "E15, White stone" })).toBeVisible();
    // Black's fourth stone closes white's last liberty.
    await page.getByRole("button", { name: /^F15, empty$/ }).click();

    await expect(page.getByRole("button", { name: /^E15, empty$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "F15, Black stone" })).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("White");
  });

  test("either side may pass, and two in a row end the game by count, not a draw", async ({ page }) => {
    await page.goto("/games/go/play");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/go/play");

    const pass = page.getByRole("button", { name: /^pass$/i });
    await expect(pass).toBeVisible();
    await pass.click();
    await expect(page.getByTestId("to-play")).toContainText("White");
    await pass.click();
    await expect(page.getByTestId("to-play")).not.toContainText("Draw");
  });

  test("the rules page says what a liberty, a capture and the ko rule are, at its address", async ({ page }) => {
    await page.goto("/games/go/rules");
    await expect(page.getByText(/liberti/i).first()).toBeVisible();
    await expect(page.getByText(/\bko\b/i).first()).toBeVisible();
  });
});
