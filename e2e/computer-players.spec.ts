import { expect, test } from "@playwright/test";

import { BOT_TIER_LIST } from "../src/lib/gomoku/opponent.constants";

/**
 * The three computer players are findable.
 *
 * Their member rows are written the first time anything needs them, and until
 * this page wrote them nothing anybody visits did — so they existed in the
 * code and not in the database, and the directory that ought to have listed
 * them had nothing to list. John looked for them on /players and on the
 * operator's members list and found neither.
 */
test.describe("the computer players", () => {
  test("are listed together, badged, and each leads to their own page", async ({ page }) => {
    await page.goto("/players");
    const rows = page.getByTestId("computer-player");
    // Counted from the ladder rather than written down, so a new grade does
    // not fail a test whose subject is that they are all listed.
    await expect(rows).toHaveCount(BOT_TIER_LIST.length);

    // Easiest first, so the ladder reads itself rather than reordering with
    // whichever of them moved most recently.
    await expect(rows.nth(0)).toHaveAttribute("data-tier", BOT_TIER_LIST[0]);
    for (const [index, tier] of BOT_TIER_LIST.entries()) {
      await expect(rows.nth(index)).toHaveAttribute("data-tier", tier);
    }

    // A program is a member, so it is badged as what it is.
    await expect(rows.first().getByTestId("member-kind")).toHaveAttribute("data-kind", "robot");

    // And a name leads to the person, the same rule as everywhere else.
    const name = rows.first().getByTestId("computer-player-name");
    await expect(name).toHaveAttribute("href", /\/players\//);
    await name.click();
    await expect(page.getByTestId("player-profile")).toBeVisible();
  });

  test("are members, badged as robots wherever members are listed", async ({ page }) => {
    /*
     * They were absent from every list entirely, which is how the gap was
     * found: their rows are written on demand and nothing anybody visits was
     * demanding them.
     *
     * Asserted on /players rather than on the operator's list, because that
     * list is capped at two hundred rows ordered by who was seen most
     * recently, and a development database has hundreds of test members newer
     * than three players who are always here. On production, with six
     * members, they are on both. The cap is its own ticket.
     */
    await page.goto("/players");
    const robots = page.getByTestId("computer-player").filter({ has: page.locator('[data-kind="robot"]') });
    await expect(robots).toHaveCount(BOT_TIER_LIST.length);
  });

  test("are not mixed in with the people", async ({ page }) => {
    // A program in the directory of people would be a person as far as anybody
    // reading it is concerned.
    await page.goto("/players");
    const directory = page.getByTestId("directory");
    await expect(directory.getByText("Meijin", { exact: true })).toHaveCount(0);
  });
});
