import { expect, test } from "@playwright/test";

import { BOT_ALL_TIERS } from "../src/lib/gomoku/opponent.constants";

/**
 * The computer players are findable.
 *
 * Their member rows are written the first time anything needs them, and until
 * this page wrote them nothing anybody visits did — so they existed in the
 * code and not in the database, and the directory that ought to have listed
 * them had nothing to list. John looked for them on /players and on the
 * operator's members list and found neither.
 */
test.describe("the computer players", () => {
  test("are listed together, badged, and each leads to their own page", async ({ page }) => {
    await page.goto("/players?view=computers");
    const rows = page.getByTestId("computer-player");
    // Counted from the list rather than written down, so a new grade or a new
    // specialist does not fail a test whose subject is that they are listed.
    await expect(rows).toHaveCount(BOT_ALL_TIERS.length);

    // Easiest first and the specialists last, so the ladder reads itself
    // rather than reordering with whichever of them moved most recently.
    await expect(rows.nth(0)).toHaveAttribute("data-tier", BOT_ALL_TIERS[0]);
    for (const [index, tier] of BOT_ALL_TIERS.entries()) {
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
     * Asserted on the players page rather than on the operator's list,
     * because that list is capped at two hundred rows ordered by who was seen
     * most recently, and a development database has hundreds of test members
     * newer than players who are always here. On production, with six
     * members, they are on both. The cap is its own ticket.
     */
    await page.goto("/players?view=computers");
    const robots = page.getByTestId("computer-player").filter({ has: page.locator('[data-kind="robot"]') });
    await expect(robots).toHaveCount(BOT_ALL_TIERS.length);
  });

  test("are listed with everybody else, and never pass as a person", async ({ page }) => {
    /*
     * This used to assert the opposite — that no program appeared in the
     * directory at all — on the reasoning that "a program in the directory of
     * people would be a person as far as anybody reading it is concerned".
     * The objection was right and the answer was wrong: hiding the five
     * opponents who are always available, on a site whose difficulty is that
     * nobody is about, cost more than it protected. So they are listed by
     * default now, and the reading the old test was defending is guarded
     * directly instead — by the row saying what it is.
     */
    await page.goto("/players");
    const directory = page.getByTestId("directory");
    const row = directory.locator("tr", { hasText: "Meijin" });
    await expect(row).toHaveCount(1);
    await expect(row.locator('[data-kind="robot"]')).toBeVisible();
  });

  test("can still be left out by somebody who wants only people", async ({ page }) => {
    await page.goto("/players?who=people");
    const directory = page.getByTestId("directory");
    await expect(directory.getByText("Meijin", { exact: true })).toHaveCount(0);
  });
});
