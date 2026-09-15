import { expect, test, type Locator, type Page } from "@playwright/test";

import { readyHere } from "./support";
import { removeXpMembers, seedXpMember, type SeededXpMember } from "./xpMembers";

/**
 * THE MEMBERS LIST SHOWS WHAT EACH PERSON HAS EARNED, AND SORTS BY IT.
 *
 * John, by name: "I love our leaderboard that have your win loss tie record
 * should also show your experience points and site level." The level is the
 * badge beside a name; the total is the XP column. This drives both the way a
 * reader does — reads the row, presses the heading, follows the number — and
 * asserts only about rows it seeded or about properties true of any rows.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT BRINGS ITS OWN WORLD, INCLUDING THE ANSWER FOR NONE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Two members, written straight to `Member.xp` rather than driven through the
 * award path: one standing on a high rung, and one with NOTHING. The second is
 * the case the rule changed for — John: "Everyone is level 1 if 0xp." — and a
 * development database whose members all happen to sit at nought would show that
 * answer on every row without this spec ever having made one. Seeded, so the
 * zero is a row this spec created and can name.
 *
 * `seedXpMember(1, …)` writes `xpForLevel(1)`, which is nought: the floor of the
 * first rung is where everybody starts.
 */

/** A seeded member's row on the directory, by the id in the link on their name. */
function rowFor(page: Page, member: SeededXpMember): Locator {
  return page.getByTestId("directory").locator(`tbody tr:has(a[href="/players/${member.id}"])`);
}

/** The XP column down the page, as numbers — a program's dash reads as nought. */
async function xpDownThePage(page: Page): Promise<number[]> {
  const cells = await page.getByTestId("directory").getByTestId("record-xp").allInnerTexts();
  return cells.map((text) => {
    const digits = text.replace(/[^0-9]/g, "");
    return digits === "" ? 0 : Number(digits);
  });
}

function isMonotone(values: readonly number[], way: "asc" | "desc"): boolean {
  return values.every((value, index) =>
    index === 0 ? true : way === "desc" ? values[index - 1] >= value : values[index - 1] <= value,
  );
}

test.describe("the XP column on the members list", () => {
  let high: SeededXpMember;
  let none: SeededXpMember;

  test.beforeEach(async () => {
    high = await seedXpMember(60, "xpcolumn-high");
    none = await seedXpMember(1, "xpcolumn-none");
  });

  test.afterEach(async () => {
    await removeXpMembers([high.email, none.email]);
  });

  test("shows the number and the level, and nought as Level 1 with a 0", async ({ page }) => {
    await page.goto("/players");

    const earned = rowFor(page, high);
    const nothing = rowFor(page, none);
    // Present before anything is read off them: both rows are this spec's.
    await expect(earned, "the member seeded with XP is not on the first page").toHaveCount(1);
    await expect(nothing, "the member seeded with none is not on the first page").toHaveCount(1);

    // The total, written the way every count on the site is written.
    await expect(earned.getByTestId("record-xp")).toHaveText(high.xp.toLocaleString("en-GB"));
    await expect(earned.getByTestId("record-level")).toHaveAttribute("data-level", "60");

    /*
     * THE ANSWER FOR NONE. A 0 in the column — a number, not a dash, because a
     * dash in this table means "not known" — and Level 1 beside the name. Both
     * asserted as present rather than absent, so this cannot pass on a page that
     * had not rendered yet.
     */
    expect(none.xp).toBe(0);
    await expect(nothing.getByTestId("record-xp")).toHaveText("0");
    await expect(nothing.getByTestId("record-level")).toHaveAttribute("data-level", "1");
  });

  test("the number leads to the board that ranks it", async ({ page }) => {
    await page.goto("/players");
    const earned = rowFor(page, high);
    await expect(earned).toHaveCount(1);

    // Pressed, not read off the href: a reader follows it.
    await earned.getByTestId("record-xp-link").click();
    await expect(page).toHaveURL(/\/xp(\?|$)/);
    await expect(page.getByTestId("xp-leaderboard")).toBeVisible();
  });

  test("the heading sorts by it, both ways, and there is a way back", async ({ page }) => {
    await page.goto("/players");
    const heading = page.getByTestId("directory").locator('[data-testid="sortable-head"][data-sort="xp"]');
    await expect(heading, "the XP heading is not a sortable heading").toHaveCount(1);
    /*
     * WAIT FOR THE TABLE TO BE LISTENING BEFORE PRESSING ITS HEADING. The heading
     * is a server-rendered link, so it is on the page before React has taken the
     * table over, and a press in that window went nowhere: red on CI on every run
     * from 0.195.1, when each row gained its own hydrated "⋯" menu, and green on
     * any machine fast enough to finish first. The CI trace settles it — all 52
     * ready marks on the page read "false" in the snapshot taken as the click
     * went in, and "true" in the one after it, with no request sent and no
     * navigation scheduled. The seeded row's own menu carries the mark and
     * hydrates with the heading, so it is the thing to wait on.
     */
    await readyHere(rowFor(page, high).getByTestId("row-more"));

    // Most first, on the first press.
    await heading.click();
    await expect(page).toHaveURL(/[?&]sort=xp/);
    await expect(page.getByTestId("directory").locator('th[aria-sort="descending"]')).toContainText("XP");
    /*
     * The seeded high member stands on rung 60, which is past anybody a spec on
     * this machine leaves behind, so it is on the first page of "most first" —
     * and the column under it never goes up.
     */
    await expect(rowFor(page, high)).toHaveCount(1);
    const most = await xpDownThePage(page);
    expect(most.length).toBeGreaterThan(1);
    expect(isMonotone(most, "desc"), `XP down the page: ${most.join(", ")}`).toBe(true);

    // Pressed again, the other way round.
    await page.getByTestId("directory").locator('[data-testid="sortable-head"][data-sort="xp"]').click();
    await expect(page.getByTestId("directory").locator('th[aria-sort="ascending"]')).toContainText("XP");
    const least = await xpDownThePage(page);
    expect(isMonotone(least, "asc"), `XP down the page: ${least.join(", ")}`).toBe(true);

    // And out again: the return trip is its own test.
    await page.getByTestId("directory-own-order").click();
    await expect(page).not.toHaveURL(/[?&]sort=/);
    await expect(page.getByTestId("directory").locator('[data-testid="sortable-head"][data-sort="xp"]')).toHaveCount(1);
  });
});
