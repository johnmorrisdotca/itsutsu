import { expect, test } from "@playwright/test";

/**
 * "Are you still there?" offers a way out as well as a way back in.
 *
 * The question appears exactly when somebody has stopped paying attention, so
 * "I am done with this one" is at least as true an answer as "still here".
 * For a while it was the only answer you could not give: the single button put
 * you back on the game you had already stopped looking at, and leaving meant
 * dismissing the question and then navigating away by hand.
 *
 * Two minutes of nothing is what triggers it, so the clock is driven rather
 * than waited out — a test that sleeps for two minutes is a test nobody runs.
 */
test.describe("the idle question", () => {
  test("offers a way out, and the way out leaves", async ({ page }) => {
    await page.clock.install();
    await page.goto("/games/gomoku");
    // The board being there is the page being alive: the watcher starts with it.
    await page.waitForSelector("button[aria-label]");

    // Nobody touches anything for longer than the threshold.
    await page.clock.runFor("03:10");

    const modal = page.getByTestId("idle-modal");
    await expect(modal, "the idle question never appeared").toBeVisible();

    // Both answers are offered, not just the one that keeps you here.
    await expect(page.getByTestId("idle-confirm")).toBeVisible();
    const leave = page.getByTestId("idle-leave");
    await expect(leave, "there is no way out of the idle question").toBeVisible();

    // And it says the game is kept, which is what makes leaving safe to choose.
    await expect(modal).toContainText("kept");

    await leave.click();
    await expect(page).toHaveURL(/\/games\/?$/);
  });

  test("still lets somebody say they are here", async ({ page }) => {
    // The original answer has to keep working: a second choice that broke the
    // first would be a worse bug than the one being fixed.
    await page.clock.install();
    await page.goto("/games/gomoku");
    await page.waitForSelector("button[aria-label]");
    await page.clock.runFor("03:10");
    await expect(page.getByTestId("idle-modal")).toBeVisible();
    await page.getByTestId("idle-confirm").click();
    await expect(page.getByTestId("idle-modal")).toHaveCount(0);
    await expect(page).toHaveURL(/\/games\/gomoku/);
  });
});
