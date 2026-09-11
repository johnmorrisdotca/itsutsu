import { expect, test } from "@playwright/test";

/**
 * Reading a page as the board alone.
 *
 * The switch is only worth anything if it survives the next visit, so the
 * test that matters is the reload: turn it on, come back, and the furniture
 * is still gone — and gone from the first paint rather than flickering away
 * after the page has settled.
 */
test.describe("just the board", () => {
  // The board is a facet of the game, not the game: /games/<slug> is the front
  // door and is a standard-width page, so the switch is not offered there.
  const board = "/games/gomoku/play";

  test("strips the page back, and brings it back again", async ({ page }) => {
    await page.goto(board);
    const header = page.locator("[data-chrome]").first();
    await expect(header).toBeVisible();

    await page.getByTestId("bare-board-toggle").click();
    // Hidden, not removed: the stylesheet takes them off the page rather than
    // the components declining to render, so count them as seen or not seen.
    await expect(header).toBeHidden();
    for (const aside of await page.locator("aside").all()) await expect(aside).toBeHidden();

    // The switch is the one thing that stays: a mode you cannot leave is a trap.
    const toggle = page.getByTestId("bare-board-toggle");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    await toggle.click();
    await expect(page.locator("[data-chrome]").first()).toBeVisible();
  });

  test("is still bare on the next visit, without the page flashing first", async ({ page }) => {
    await page.goto(board);
    await page.getByTestId("bare-board-toggle").click();
    await expect(page.locator("[data-chrome]").first()).toBeHidden();

    await page.reload();
    // Set by the script in the body before anything is drawn, so this is true
    // of the first paint and not only of the settled page.
    await expect(page.locator("html")).toHaveAttribute("data-bare", "true");
    await expect(page.locator("[data-chrome]").first()).toBeHidden();

    // And it follows the reader to another board, not just the one it was set on.
    await page.goto("/games/renju/play");
    await expect(page.locator("[data-chrome]").first()).toBeHidden();

    await page.getByTestId("bare-board-toggle").click();
    await expect(page.locator("html")).not.toHaveAttribute("data-bare", "true");
  });

  test("is not offered on a page with nothing to strip", async ({ page }) => {
    // The wide pages are the ones with a board or a table and a sidebar.
    // About is read top to bottom; there is no furniture to take off it.
    await page.goto("/about");
    await expect(page.getByTestId("bare-board")).toHaveCount(0);
  });

  /*
   * The trap this design could have set, and the reason the effect is scoped
   * to the pages that offer the switch. The setting is remembered for the
   * whole browser; if it also took the masthead off pages with no switch on
   * them, a reader would be left on a page with no navigation and no way to
   * ask for it back.
   */
  test("leaves a page it does not offer itself on completely alone", async ({ page }) => {
    await page.goto(board);
    await page.getByTestId("bare-board-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-bare", "true");

    await page.goto("/about");
    // Still on, and still doing nothing here: the masthead is where it was.
    await expect(page.locator("html")).toHaveAttribute("data-bare", "true");
    await expect(page.locator("[data-chrome]").first()).toBeVisible();
  });
});
