import { expect, test } from "@playwright/test";

import { memberContext } from "./members";

/**
 * The whole record, as text somebody can take with you.
 *
 * The point of the feature is that it can be selected and copied, so what is
 * checked here is that it really is on the page as text — a header row and
 * one line per game, inside a block a person can select — rather than a table
 * that only looks like text.
 */
test.describe("the record as plain text", () => {
  test("is on the record page, folded away, with the columns a listing needs", async ({
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `record-text-${stamp}@example.test`,
      name: `Record Reader ${stamp}`,
    });
    const page = await context.newPage();
    await page.goto("/history");

    const block = page.getByTestId("record-text");
    await expect(block).toBeVisible();

    // Folded away until it is asked for: it is a long listing, and the page
    // is a table first.
    const listing = block.locator("pre");
    await expect(listing).toBeHidden();

    await block.locator("summary").click();
    await expect(listing).toBeVisible();

    const text = (await listing.textContent()) ?? "";
    expect(text).toContain("Itsutsu");
    for (const heading of ["Date", "Game", "Black", "White", "Result", "Moves"]) {
      expect(text).toContain(heading);
    }
    // Either it lists games, or it says plainly that there are none.
    expect(/\d{4}-\d{2}-\d{2}/.test(text) || text.includes("No games yet")).toBe(true);

    await expect(block.getByTestId("record-text-copy")).toBeVisible();
    await context.close();
  });
});
