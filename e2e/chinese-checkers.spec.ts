import { expect, test } from "@playwright/test";

test.describe("chinese checkers", () => {
  test("starts with both points full, and a piece steps out along the hex lattice", async ({ page }) => {
    await page.goto("/games/chinese-checkers");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/chinese-checkers");

    await expect(page.getByTestId("home-count")).toContainText("0");
    await expect(page.getByTestId("variant-line")).toContainText("Pick one of your pieces");
    // The board's own centre, J9, is empty from the start; not playable until a piece is picked up.
    await expect(page.getByRole("button", { name: /^J9, empty$/ })).toBeDisabled();

    // K14 is one of black's point, with two hex neighbours open toward the centre: J13 and K13.
    await page.getByRole("button", { name: "K14, Black stone" }).click();
    await expect(page.getByTestId("variant-line")).toContainText("Choose where it lands");
    await page.getByRole("button", { name: /^J13, empty$/ }).click();

    await expect(page.getByRole("button", { name: "J13, Black stone" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^K14, empty$/ })).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("White");
  });

  test("the rules page says what the star and the far point are, at its address", async ({ page }) => {
    await page.goto("/rules/chinese-checkers");
    await expect(page.getByText(/hexagram/i).first()).toBeVisible();
    await expect(page.getByText(/point/i).first()).toBeVisible();
  });
});
