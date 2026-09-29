import { expect, test } from "@playwright/test";

/**
 * A TABLE ROW'S BUTTONS FLOAT OVER ITS END, AND ONLY ON HOVER. John,
 * 2026-09-29, on /players at a desk: "The play and stars don't fit well in the
 * RHS column. We should only show these buttons on Hover… and it should float
 * over the space, not take up the space/column." The actions column had held
 * to the table's right edge over the XP figures, which read "23…" and "1,…".
 *
 * With a mouse the column takes no room, every XP figure is whole, and a row's
 * Play shows when that row is hovered. A phone has no hover and keeps the
 * column, which the phone specs (fits-a-phone, phone-overflow) hold.
 */
test.describe("the members list on a desk", () => {
  test.use({ viewport: { width: 1024, height: 800 } });

  test("keeps every XP figure whole and shows a row's Play only while the row is hovered", async ({ page }) => {
    await page.goto("/players");
    // Drawn by the server and hovered by CSS alone: nothing here waits on the page's scripts.
    const table = page.getByTestId("directory");
    await expect(table).toBeVisible();
    const cell = table.locator("td[data-row-actions]").first();
    await expect(cell).toBeAttached();

    // No column: the cell is no wider than nothing, and the table fits its box.
    expect((await cell.boundingBox())!.width).toBeLessThanOrEqual(1);
    const scroll = table.locator("xpath=ancestor-or-self::*[contains(@class,'overflow-x-auto')][1]");
    await expect.poll(() => scroll.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);

    // The row with a Play: its buttons are unseen until the row is hovered, then seen.
    const row = table.locator("tr").filter({ has: page.locator("td[data-row-actions] button, td[data-row-actions] a") }).first();
    const buttons = row.locator("td[data-row-actions] > *");
    await page.mouse.move(0, 0);
    await expect(buttons).toHaveCSS("opacity", "0");
    await row.hover();
    await expect(buttons).toHaveCSS("opacity", "1");
    await page.screenshot({ path: test.info().outputPath("members-hover-1024.png") });
  });
});
