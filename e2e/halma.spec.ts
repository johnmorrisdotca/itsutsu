import { expect, test } from "@playwright/test";

test.describe("halma", () => {
  test("starts with both camps full and a piece jumps out over its neighbour", async ({ page }) => {
    await page.goto("/games/halma");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/halma");
    await expect(page.getByTestId("home-count")).toContainText("0");
    await expect(page.getByTestId("variant-line")).toContainText("Pick one of your pieces");
    // Nothing is placed in a race: an open square is not playable until a piece is picked up.
    await expect(page.getByRole("button", { name: /^H8, empty$/ })).toBeDisabled();
    // (3,2) is C13; over (4,1), B12, to (5,0), A11.
    await page.getByRole("button", { name: "C13, Black stone" }).click();
    await expect(page.getByTestId("variant-line")).toContainText("Choose where it lands");
    await page.getByRole("button", { name: /^A11, empty$/ }).click();
    await expect(page.getByRole("button", { name: "A11, Black stone" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^C13, empty$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "B12, Black stone" })).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("White");
  });

  test("the rules page says what a jump is, at its address", async ({ page }) => {
    await page.goto("/rules/halma");
    await expect(page.getByText(/jump/i).first()).toBeVisible();
    await expect(page.getByText(/far corner camp/i).first()).toBeVisible();
  });
});
