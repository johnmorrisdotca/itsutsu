import { expect, test, type Locator, type Page } from "@playwright/test";

import { removePlayedUnder, seedComputerPlayerFor } from "./members";
import { removeXpMembers, seedProgram, type SeededXpMember } from "./xpMembers";

/**
 * ONE TIER PER RATING, on every page that prints one.
 *
 * The reported row: /players/dan said "Unrated 未定 · Fewer than four rated
 * games" while the Computers tab said "Provisional 仮" about the same
 * program, and the Members tab printed a dash for two programs the Computers
 * tab gave a number. Three pages, three rules on the same row: the page took
 * its tier from the people pool (nought games, for a program), the Computers
 * tab took it from the computer pool, and only the Members tab waited for
 * UNRATED_BELOW games before printing a figure.
 *
 * One rule now — `ratingShown` for the number, `tierShown` for the word,
 * both from the same pool — and this drives it the way a reader meets it.
 * Two programs of its own, since a local database has none with a known
 * count: one with a computer-pool count between UNRATED_BELOW and
 * PROVISIONAL_BELOW, which must read Provisional and a number on every tab
 * and on its page; one with fewer than UNRATED_BELOW, which must read a dash
 * and Unrated everywhere. Tabs are clicked, never reloaded, and every absence
 * is asserted after a presence on the same table has been waited for.
 */

/** A row of a record table, by the id in the link on its name. */
function rowFor(table: Locator, member: SeededXpMember): Locator {
  return table.locator(`tbody tr:has(a[href="/players/${member.id}"])`);
}

/** The tab bar's link with this label, pressed the way a reader presses it. */
async function openTab(page: Page, label: string) {
  await page.getByTestId("tabs").getByTestId("tab").filter({ hasText: label }).click();
}

test.describe("one tier per rating", () => {
  let settling: SeededXpMember;
  let starting: SeededXpMember;

  test.beforeEach(async () => {
    settling = await seedProgram("settling");
    starting = await seedProgram("starting");
    // Seven rated games in the computer pool: provisional. Two: not yet a rating.
    await seedComputerPlayerFor(settling.email, { rating: 1584, games: 7, wins: 4, losses: 3 });
    await seedComputerPlayerFor(starting.email, { rating: 1614, games: 2, wins: 2, losses: 0 });
  });

  test.afterEach(async () => {
    await removePlayedUnder([settling.name, starting.name]);
    await removeXpMembers([settling.email, starting.email]);
  });

  test("the Computers tab, the Members tab and a program's own page agree", async ({ page }) => {
    await page.goto("/players?view=computers");
    const computers = page.getByTestId("computer-players-table");
    const settled = rowFor(computers, settling);
    const fresh = rowFor(computers, starting);
    await expect(settled, "the seeded program is not on the Computers tab").toHaveCount(1);
    await expect(fresh).toHaveCount(1);
    // Seven games: the number, marked as the computer pool's, and Provisional.
    await expect(settled.getByTestId("record-rating")).toContainText("1584");
    await expect(settled.getByTestId("record-rating").getByTestId("rating-pool-computer")).toBeVisible();
    await expect(settled.getByTestId("record-tier")).toContainText("Provisional");
    // Two games: a dash, and Unrated beside it — not a number under UNRATED_BELOW.
    await expect(fresh.getByTestId("record-rating")).toHaveText("–");
    await expect(fresh.getByTestId("record-tier")).toContainText("Unrated");

    // The Members tab, by its tab: the same two rows, the same rule.
    await openTab(page, "Members");
    const directory = page.getByTestId("directory");
    const settledMember = rowFor(directory, settling);
    await expect(settledMember, "the seeded program is not on the first page of the members list").toHaveCount(1);
    await expect(settledMember.getByTestId("record-rating")).toContainText("1584");
    await expect(rowFor(directory, starting).getByTestId("record-rating")).toHaveText("–");

    // The program's own page, reached from its name: the same number, the same word.
    await openTab(page, "Computers");
    await rowFor(page.getByTestId("computer-players-table"), settling).getByTestId("computer-player-name").click();
    await expect(page.getByTestId("player-figures")).toBeVisible();
    await expect(page.getByTestId("player-rating")).toContainText("1584");
    await expect(page.getByTestId("player-rating-computer")).toBeVisible();
    await expect(page.getByTestId("player-tier")).toContainText("Provisional");
    await expect(page.getByTestId("player-tier")).not.toContainText("Unrated");
  });

  test("a program under four rated games reads a dash and Unrated on its page too", async ({ page }) => {
    await page.goto("/players?view=computers");
    const computers = page.getByTestId("computer-players-table");
    await expect(rowFor(computers, starting)).toHaveCount(1);
    await rowFor(computers, starting).getByTestId("computer-player-name").click();
    await expect(page.getByTestId("player-figures")).toBeVisible();
    await expect(page.getByTestId("player-rating")).toHaveText("—");
    await expect(page.getByTestId("player-tier")).toContainText("Unrated");
    await expect(page.getByTestId("player-tier")).toContainText("Fewer than four rated games");
  });

  test("the operator's Bots tab says it the same way", async ({ page }) => {
    await page.goto("/admin?view=bots");
    // Server-rendered with nothing to hydrate, so the presence to wait for is the table.
    const bots = page.getByTestId("admin-bots-table");
    await expect(bots).toBeVisible();
    const settled = rowFor(bots, settling);
    await expect(settled, "the seeded program is not on the Bots tab").toHaveCount(1);
    await expect(settled.getByTestId("record-rating")).toContainText("1584");
    await expect(settled.getByTestId("record-tier")).toContainText("Provisional");
    const fresh = rowFor(bots, starting);
    await expect(fresh.getByTestId("record-rating")).toHaveText("–");
    await expect(fresh.getByTestId("record-tier")).toContainText("Unrated");
  });
});
