import { expect, test } from "@playwright/test";

import { ready, readyHere } from "./support";

/**
 * ANY BOARD, OPENED ON ITS OWN. John, 2026-09-25, on /famous: "mouse over the
 * Container holding the Board, Scrubber, controls and there should be a small
 * button that allows us to Make only that Board/Controls a Modal to view
 * without distractions." The button, the modal over the whole screen, the
 * position carried in and out, and Esc to leave.
 */
test.describe("a board opened on its own", () => {
  test("a famous game opens where it was scrubbed to, over the whole screen, and Esc puts it back", async ({ page }) => {
    await page.goto("/famous");
    await readyHere(page.getByTestId("famous-replay").first());
    await page.getByTestId("famous-replay-open").first().click();
    const at = page.getByTestId("famous-replay-at").first();
    await expect(at).toBeVisible();
    await page.getByTestId("famous-scrubber").first().fill("20");
    await expect(at).toContainText("Move 20 of");

    const box = page.getByTestId("board-focus").first();
    await box.hover();
    await box.getByTestId("board-focus-toggle").click();
    const open = page.locator('[data-board-focus="open"]');
    await expect(open).toBeVisible();
    await expect(open.getByRole("dialog")).toBeVisible();
    // Over the whole screen, not held inside the card.
    const shown = (await open.boundingBox())!;
    const view = page.viewportSize()!;
    expect(shown.width).toBeGreaterThanOrEqual(view.width - 1);
    expect(shown.height).toBeGreaterThanOrEqual(view.height - 1);
    // The same position, not a fresh copy of the game.
    await expect(open.getByTestId("famous-replay-at")).toContainText("Move 20 of");
    // Stepping inside the modal moves the one replay.
    await open.getByTestId("famous-back").click();
    await expect(open.getByTestId("famous-replay-at")).toContainText("Move 19 of");

    await page.keyboard.press("Escape");
    await expect(open).toHaveCount(0);
    await expect(page.getByTestId("famous-replay-at").first()).toContainText("Move 19 of");
    // The page scrolls again once it is closed.
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
  });

  test("the practice board plays inside the modal, and the move is there when it closes", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku/play");
    await ready(page, "game-view");
    await page.getByTestId("board-focus-toggle").first().click();
    const open = page.locator('[data-board-focus="open"]');
    await expect(open).toBeVisible();
    await open.getByRole("button", { name: /^H8, empty$/ }).click();
    await expect(open.getByRole("button", { name: /^H8, Black stone/ })).toBeVisible();

    await open.getByTestId("board-focus-toggle").click();
    await expect(open).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^H8, Black stone/ })).toBeVisible();
  });
});
