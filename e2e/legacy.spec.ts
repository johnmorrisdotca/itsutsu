import { expect, test } from "@playwright/test";

import { seedMember } from "./members";

/**
 * The rule John set: if a page lists a game, it links to that game. A legacy
 * record names games from another site, so this is where the rule is easiest
 * to break by accident — it checks the actual rendered page, not just that
 * the alias table has an entry.
 */
test.describe("a legacy record's games link to what they are", () => {
  /*
   * John is a member here, so these run against the page he actually has.
   *
   * They used to depend on his NOT being one: with no member row, his own
   * address fell through to the kept record's page, which opens on the record
   * itself. Another test in this file seeds him, and once it had run the dev
   * database kept him — so these passed on a fresh database and failed on the
   * next run, which is not a test saying anything. Seeding him here says which
   * page is meant, and it is the one production serves.
   */
  test.beforeEach(async () => {
    await seedMember({ email: "john-morris-live@example.test", name: "John Morris" });
  });

  test("an aliased game name is a link; an unmapped one is plain text", async ({ page }) => {
    // One page per person: John's ItsYourTurn chapter, where he played as
    // Incognito, is a tab of his own page rather than a second address.
    await page.goto("/players/john-morris?view=itsyourturn");
    const detail = page.getByTestId("legacy-detail").first();

    // Go-Moku maps to our Gomoku (internally still the "freestyle" variant) —
    // exact, since "Pro Go-Moku" is also a link a few rows down and would
    // otherwise match too.
    const goMoku = detail.getByRole("link", { name: "Go-Moku", exact: true });
    await expect(goMoku).toBeVisible();
    await expect(goMoku).toHaveAttribute("href", "/games/gomoku/rules");

    /*
     * Backgammon has no Itsutsu equivalent. It must render, not as a link,
     * and visibly as a game that is not ours — on a page where every other
     * game name leads somewhere, bare words read as a link nobody made.
     */
    await expect(detail.getByText("Backgammon", { exact: true })).toBeVisible();
    await expect(detail.getByRole("link", { name: "Backgammon", exact: true })).toHaveCount(0);
    const notHere = detail.getByTestId("game-not-here").filter({ hasText: "Backgammon" }).first();
    await expect(notHere, "a game we do not have looked like a link nobody made").toBeVisible();
    await expect(notHere).toHaveClass(/italic/);
    await expect(notHere).toHaveAttribute("title", /not a game played here/i);
  });

  test("a head-to-head record links each game the same way", async ({ page }) => {
    // His head-to-head with his father is GoldToken's, so it is that tab.
    await page.goto("/players/john-morris?view=goldtoken");
    const log = page.getByTestId("legacy-head-to-head-log");
    await expect(log.getByRole("link", { name: "Long Gammon" })).toHaveCount(0);
    await expect(log.getByText("Long Gammon").first()).toBeVisible();
  });

  test("one person is one page, with every site they played on", async ({ page }) => {
    /*
     * Chibi played on ItsYourTurn from 2001 and on GoldToken from 2003. He is
     * one man, so he is one page: two records cross-referencing each other
     * would be two addresses a visitor could land on for him. The sites are
     * tabs of that page, and the sentence above them names all of them, so a
     * reader on one tab can see the other exists without moving.
     */
    await page.goto("/players/chibi");
    /*
     * The same panel every player has now. There used to be a second page
     * component for a record kept from elsewhere, with its own heading and its
     * own badge, and this asserted against that one — so the test was pinning
     * the split rather than the behaviour it cared about.
     */
    const heading = page.getByTestId("player-profile");
    await expect(heading).toContainText("ItsYourTurn.com");
    await expect(heading).toContainText("GoldToken.com");
    // Two sites, plus this one — every player page keeps an Itsutsu tab.
    await expect(page.getByTestId("tab")).toHaveCount(3);
    // One at a time: the whole point of the tabs.
    await expect(page.getByTestId("legacy-source")).toHaveCount(1);

    // The address his GoldToken record used to have is nobody's now.
    const gone = await page.goto("/players/chibi-goldtoken");
    expect(gone?.status()).toBe(404);
  });

  /*
   * The site owner found two pages with his own name at the top of them. The
   * record was never duplicated — there is one live account and one kept
   * record, correctly linked — but the kept record also had an address, so
   * the site served both. The address is folded away; the record is not.
   */
  test("a folded record's old address leads to the person, not a second page", async ({ page }) => {
    await page.goto("/players/jmorris");
    await expect(page).toHaveURL(/\/players\/john-morris$/);

    // And the record itself survived the fold, whole — both sites named on
    // the page it folded into, each of them a tab of his own record.
    const said = page.getByTestId("legacy-elsewhere");
    await expect(said).toContainText("ItsYourTurn.com");
    await expect(said).toContainText("GoldToken.com");
    await expect(said).toContainText("Incognito");

    // A tab click stays on his address rather than bouncing back through it.
    await page.getByTestId("tab").filter({ hasText: "GoldToken" }).click();
    await expect(page).toHaveURL(/\/players\/john-morris\?/);
    await expect(page.getByTestId("legacy-source")).toHaveAttribute("data-site", "GoldToken.com");
  });

  test("shows both of a person's handles when they differ", async ({ page }) => {
    // John was Incognito on one site and John Morris on the other.
    await page.goto("/players/john-morris");
    const said = page.getByTestId("legacy-elsewhere");
    await expect(said).toContainText("Incognito");
    await expect(said).toContainText("John Morris");
    // Two sites he played on, and this one.
    await expect(page.getByTestId("tab")).toHaveCount(3);
  });

  test("a member's own page shows the record they brought with them", async ({ page }) => {
    // The tab only belongs on a page that is somebody's: a kept record with
    // no live account behind it gets its own page instead.
    await seedMember({ email: "john-morris-live@example.test", name: "John Morris" });
    /*
     * The first place anybody looks for somebody's history is that person's
     * own page. John's ItsYourTurn and GoldToken chapters existed at their
     * own address and appeared nowhere he would look, because nothing had
     * ever set the link between the kept record and the live account.
     */
    await page.goto("/players/john-morris");
    const said = page.getByTestId("legacy-elsewhere");
    await expect(said).toBeVisible();
    await expect(said).toContainText("ItsYourTurn.com");
    await expect(said).toContainText("GoldToken.com");
    await expect(said).toContainText("Incognito");

    // And the record itself is a tab beside what he has done here.
    await expect(page.getByTestId("tab")).toHaveCount(3);
    await page.getByTestId("tab").filter({ hasText: "GoldToken" }).click();
    await expect(page.getByTestId("legacy-source")).toHaveAttribute("data-site", "GoldToken.com");
  });
});

/**
 * A kept record says more than won, lost and drawn.
 *
 * Years of somebody's play reduced to three numbers is the least that could
 * be said about it. The figures are derived and stay derived, so a page can
 * never print a total that disagrees with the record under it.
 */
test.describe("a kept record's figures", () => {
  test("shows games played and a win rate, and says what the rate means", async ({ page }) => {
    await page.goto("/players/chibi");
    const figures = page.getByTestId("legacy-figures");

    // Chibi's ItsYourTurn record: 2077+1355+8, 266+286, 71+54+1 = 4118 games.
    await expect(figures.getByTestId("figure-played")).toHaveText("4,118");
    await expect(figures.getByTestId("figure-won-lost-drawn")).toHaveText("2,414W · 1,695L · 9D");
    // (2414 + 9/2) / 4118 = 58.75%
    await expect(figures.getByTestId("figure-win-rate")).toHaveText("58.7%");

    // Which of the two definitions it is, in words, on the page itself.
    await expect(page.getByTestId("legacy-source")).toContainText("counts a draw as half a game won");
  });

  test("leaves room for a fourth figure without rearranging", async ({ page }) => {
    /*
     * A rating will join these three. The row is equal cells laid out by
     * width rather than a layout balanced around three of them, so it takes
     * a fourth without being rebuilt — checked by measuring, since that is
     * the only thing that can tell the difference.
     */
    await page.goto("/players/chibi");
    const cells = page.getByTestId("legacy-figures").getByTestId("figure");
    const count = await cells.count();
    expect(count).toBeGreaterThanOrEqual(3);
    const widths: number[] = [];
    for (let index = 0; index < count; index += 1) {
      const box = await cells.nth(index).boundingBox();
      if (box !== null) widths.push(Math.round(box.width));
    }
    expect(new Set(widths).size, `widths were ${widths.join(", ")}`).toBe(1);
  });
});
