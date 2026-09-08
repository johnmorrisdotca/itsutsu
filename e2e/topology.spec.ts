import { expect, test } from "@playwright/test";
import { openAdvanced } from "./support";

/**
 * The two games whose board is the rule: one with no edges, one with holes in
 * it. Both are chosen from the settings and then played on the real board.
 */
test.describe("Toroidal Five", () => {
  test("is offered, and its rules page explains the joined edges", async ({ page }) => {
    await page.goto("/rules/toroidalFive");
    await expect(page.getByRole("heading", { name: /Toroidal Five/ })).toBeVisible();
    await expect(page.getByText(/joins its opposite|top to bottom/i).first()).toBeVisible();
  });

  test("wins on a line that runs off one edge and back on the other", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku");
    await openAdvanced(page);
    await page.getByTestId("rules").selectOption("toroidalFive");
    await page.getByTestId("board-size").selectOption("9");

    // Row 4 (labelled 5 on a 9 board), columns 7, 8, 0, 1, 2 — a five only
    // because the left and right edges join.
    const blacks = ["H5", "J5", "A5", "B5", "C5"];
    const whites = ["A9", "C9", "E9", "G9"];
    for (let i = 0; i < blacks.length; i += 1) {
      await page.getByRole("button", { name: new RegExp(`^${blacks[i]}, empty$`) }).click();
      if (whites[i] !== undefined) {
        await page.getByRole("button", { name: new RegExp(`^${whites[i]}, empty$`) }).click();
      }
    }
    await expect(page.getByText(/wins in \d+ moves/)).toBeVisible();
  });
});

test.describe("Obstacle Five", () => {
  test("puts dead squares and hotspots on the board", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku");
    await openAdvanced(page);
    await page.getByTestId("rules").selectOption("obstacleFive");

    // Six squares nothing can use, and two that count as either colour.
    await expect(page.getByRole("button", { name: /, blocked$/ })).toHaveCount(6);
    await expect(page.getByRole("button", { name: /, hotspot$/ })).toHaveCount(2);
  });

  test("its rules page names both kinds of square", async ({ page }) => {
    await page.goto("/rules/obstacleFive");
    await expect(page.getByText(/dead/i).first()).toBeVisible();
    await expect(page.getByText(/hotspot/i).first()).toBeVisible();
  });
});
