import { expect, test } from "@playwright/test";

import { BOT_PROFILES, BOT_TIER_LIST } from "../src/lib/gomoku/opponent.constants";
import { AWAY_AFTER_DAYS } from "../src/lib/rating/directoryFilter";
import { seedMember, seenDaysAgo } from "./members";

/**
 * Narrowing the directory.
 *
 * The elder sites all had this on their ranking pages, and the three
 * questions people ask of a list of players are the three the bar answers:
 * who is a person, whose rating means anything yet, and who is still about.
 *
 * Every one of them is invisible on a small directory — with a dozen members
 * each filter shows everybody — which is exactly the condition under which a
 * filter that quietly does nothing goes unnoticed. So each case here seeds
 * the row that ought to be dropped and looks for it by name, rather than
 * watching a count go down.
 */

const stamp = Date.now().toString(36);
const HERE = { email: `filter-here-${stamp}@example.test`, name: `Filter Here ${stamp}` };
const AWAY = { email: `filter-away-${stamp}@example.test`, name: `Filter Away ${stamp}` };
const A_ROBOT = BOT_PROFILES[BOT_TIER_LIST[0]].name;

const named = (page: import("@playwright/test").Page, name: string) =>
  page.getByTestId("directory").getByTestId("directory-name").filter({ hasText: name });

test.describe("who the directory lists", () => {
  test.beforeEach(async () => {
    await seedMember(HERE);
    await seedMember(AWAY);
    await seenDaysAgo(AWAY.email, AWAY_AFTER_DAYS + 1);
  });

  test("lists everybody, computer players included, until it is asked otherwise", async ({ page }) => {
    /*
     * The default used to be `people`, so that a filter changed nothing until
     * somebody asked. That hid the five computer players — the opponents that
     * are always available — behind a control nobody had reason to touch.
     */
    await page.goto("/players");
    await expect(page.getByTestId("who-everyone")).toHaveAttribute("aria-current", "true");
    await expect(named(page, HERE.name)).toHaveCount(1);
    await expect(named(page, A_ROBOT)).toHaveCount(1);
  });

  test("still lists people alone when somebody asks for that", async ({ page }) => {
    await page.goto("/players?who=people");
    await expect(page.getByTestId("who-people")).toHaveAttribute("aria-current", "true");
    await expect(named(page, HERE.name)).toHaveCount(1);
    await expect(named(page, A_ROBOT)).toHaveCount(0);
  });

  test("lists the programs on their own, and everybody together", async ({ page }) => {
    await page.goto("/players?who=computers");
    await expect(named(page, A_ROBOT)).toHaveCount(1);
    await expect(named(page, HERE.name)).toHaveCount(0);

    await page.goto("/players?who=everyone");
    await expect(named(page, A_ROBOT)).toHaveCount(1);
    await expect(named(page, HERE.name)).toHaveCount(1);
  });

  test("leaves out somebody nobody has seen for a month, and never a program", async ({ page }) => {
    await page.goto("/players");
    await expect(named(page, AWAY.name)).toHaveCount(1);

    await page.goto("/players?active=1");
    await expect(named(page, HERE.name)).toHaveCount(1);
    await expect(named(page, AWAY.name)).toHaveCount(0);

    /*
     * The case that would have made this filter quietly wrong. A program does
     * not sign in, so its stamp never moves and every away test would put it
     * away for ever — "seen lately" would have emptied the computers list on
     * any site older than a month.
     */
    await page.goto("/players?who=computers&active=1");
    await expect(named(page, A_ROBOT)).toHaveCount(1);
  });

  test("leaves out a rating that has not settled", async ({ page }) => {
    // A seeded member has played nothing, so their rating is as unsettled as
    // one gets: they are here without the filter and gone with it.
    await page.goto("/players?settled=1");
    await expect(page.getByTestId("only-settled")).toHaveAttribute("aria-pressed", "true");
    await expect(named(page, HERE.name)).toHaveCount(0);
  });
});

test.describe("the bar itself", () => {
  test.beforeEach(async () => {
    await seedMember(HERE);
  });

  test("is made of addresses, so a narrowed list can be sent to somebody", async ({ page }) => {
    await page.goto("/players");
    await page.getByTestId("who-computers").click();
    await expect(page).toHaveURL(/\/players\?who=computers$/);

    // And the toggles keep the answer already given rather than replacing it.
    await page.getByTestId("only-settled").click();
    await expect(page).toHaveURL(/who=computers/);
    await expect(page).toHaveURL(/settled=1/);
  });

  test("says how many of them are listed", async ({ page }) => {
    await page.goto("/players?who=everyone");
    const count = page.getByTestId("directory-count");
    await expect(count).toHaveText(/^\d+ listed$/);

    await page.goto("/players?who=everyone&settled=1");
    // Narrowed, so it says both numbers: a filter that shows fewer rows
    // without saying so reads as a broken page rather than as an answer.
    await expect(count).toHaveText(/^\d+ of \d+ listed$/);
  });

  test("says so when nothing answers to all of it, and offers the way back", async ({ page }) => {
    /*
     * An empty table under a full page of headings is the shape of a broken
     * site. Seeded members have no settled rating, so asking for the settled
     * programs is a question nobody on a development database answers.
     */
    await page.goto("/players?who=computers&settled=1&active=1");
    /*
     * Read the count rather than the row: if the page says nobody is listed
     * and there is no such row, that is the bug this test is about, and only
     * a database where a program has earned a settled rating gets a pass.
     */
    const listed = (await page.getByTestId("directory-count").textContent()) ?? "";
    test.skip(!listed.startsWith("0 "), "a computer player has earned a settled rating on this database");
    await expect(page.getByTestId("directory-empty")).toBeVisible();
    await page.getByTestId("directory-clear").click();
    /*
     * "Everyone", said out loud, rather than the bare page.
     *
     * This asked for /players and nothing else until the narrowing began to be
     * remembered. Now the bare address means "however I last asked", so a way
     * back that went there would re-apply the very narrowing it offers to
     * remove, and look like a link that does nothing. The explicit answer is
     * the one that clears.
     */
    await expect(page).toHaveURL(/\/players\?who=everyone$/);
    await expect(page.getByTestId("directory-empty")).toHaveCount(0);
  });

  test("does not fall over on an address that makes no sense", async ({ page }) => {
    // A mistyped address should show the page, not an apparently deserted site.
    await page.goto("/players?who=robots&settled=yes");
    await expect(page.getByTestId("who-everyone")).toHaveAttribute("aria-current", "true");
    await expect(named(page, HERE.name)).toHaveCount(1);
  });
});
