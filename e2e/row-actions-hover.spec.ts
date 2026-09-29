import { expect, test, type Locator } from "@playwright/test";

/** A cell of the row holding no link or button, so a tap on it is a tap on the row and nothing else. */
function plainCell(row: Locator): Locator {
  return row.locator("td:not([data-row-actions])").filter({ hasNot: row.page().locator("a, button") }).first();
}

/**
 * A TABLE ROW'S BUTTONS FLOAT OVER ITS END, AND ONLY ON HOVER. John,
 * 2026-09-29, on /players at a desk: "The play and stars don't fit well in the
 * RHS column. We should only show these buttons on Hover… and it should float
 * over the space, not take up the space/column." The actions column had held
 * to the table's right edge over the XP figures, which read "23…" and "1,…".
 *
 * With a mouse the column takes no room, every XP figure is whole, and a row's
 * Play shows when that row is hovered. And on a phone, which has no hover:
 * "touch should bring up the options" — a tap on the row brings them up, and a
 * first tap where an unseen button sits presses nothing.
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

test.describe("the members list on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("a tap on a row brings up its buttons, and never presses one it could not see", async ({ page }) => {
    await page.goto("/players");
    const table = page.getByTestId("directory");
    await expect(table).toBeVisible();
    const withButtons = table.locator("tr").filter({ has: page.locator("td[data-row-actions] button, td[data-row-actions] a") });
    const row = withButtons.first();
    const buttons = row.locator("td[data-row-actions] > *");
    await row.scrollIntoViewIfNeeded();
    await expect(buttons).toHaveCSS("opacity", "0");

    // Unseen, they take no press: a tap where they sit reaches the row beneath them, never a button of theirs.
    const at = (await buttons.boundingBox())!;
    const beneath = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest("[data-row-actions]") === null,
      [at.x + at.width / 2, at.y + at.height / 2],
    );
    expect(beneath, "an unseen button is where a tap lands").toBe(true);

    // A tap on the row (a cell with no link of its own) gives it the focus, by which the buttons come up —
    // not by a hover the browser makes up for a tap: iPhone's Safari makes up none for a row.
    const address = page.url();
    await plainCell(row).tap();
    await expect(row).toBeFocused();
    await expect(buttons).toHaveCSS("opacity", "1");
    await expect(buttons).toHaveCSS("pointer-events", "auto");
    expect(page.url()).toBe(address);
    await page.screenshot({ path: test.info().outputPath("members-tap-390.png") });

    // A tap on another row moves them there.
    const other = withButtons.nth(1);
    await plainCell(other).tap();
    await expect(other.locator("td[data-row-actions] > *")).toHaveCSS("opacity", "1");
    await expect(buttons).toHaveCSS("opacity", "0");
  });
});
