import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { BOT_PROFILES, BOT_TIER_LIST } from "../src/lib/gomoku/opponent.constants";
import { AWAY_AFTER_DAYS } from "../src/lib/rating/directoryFilter";
import { memberContext, seedMember, seenDaysAgo } from "./members";
import { shownName } from "../src/lib/rating/shownName";

/*
 * Names are matched by what the site PRINTS, through the same function the
 * site prints them with — a first name and an initial. Spelling the displayed
 * form out here instead would be a second copy of the rule, and the two would
 * disagree the first time it changed.
 */

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
/*
 * Unique in the FIRST word, because that is the part the site prints. Named
 * "Filter Here <stamp>" and "Filter Away <stamp>", both showed as "Filter M."
 * — the stamp was in the half that is now an initial — and a test looking for
 * one of them found two.
 */
const HERE = { email: `filter-here-${stamp}@example.test`, name: `FilterHere${stamp} Tester` };
const AWAY = { email: `filter-away-${stamp}@example.test`, name: `FilterAway${stamp} Tester` };
const A_ROBOT = BOT_PROFILES[BOT_TIER_LIST[0]].name;

const named = (page: Page, name: string) =>
  page.getByTestId("directory").getByTestId("directory-name").filter({ hasText: shownName(name) });

/**
 * Puts the reader's account back to never having asked for a narrowing.
 *
 * Through the API, the way a member would, and null is the registry's word
 * for "never said". A 404 is the operator on a database where they hold no
 * member row — and then there is nothing remembered to forget, so the state
 * this establishes already holds.
 */
async function forgetDirectoryFilter(page: Page): Promise<void> {
  const response = await page.request.patch("/api/me", {
    data: { preferences: { playersWho: null, playersSettled: null, playersActive: null } },
  });
  expect([200, 404], `forgetting the filter answered ${response.status()}`).toContain(response.status());
}

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
     *
     * The preference is forgotten first, and that is not tidiness. Since the
     * page began remembering the last narrowing, a bare address means
     * "however I last asked" for anybody who has ever asked — so "before
     * anybody has said anything" is now a state a test has to establish
     * rather than assume. Without this the case passes or fails on what ran
     * before it.
     */
    await forgetDirectoryFilter(page);
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

  /**
   * "SEEN LATELY", ASKED OF A ROW THIS SPEC CAN ACTUALLY FIND.
   *
   * This looked for AWAY on the FIRST view of the directory, and AWAY is seeded
   * as deliberately the oldest-seen row there is. The directory is ordered by
   * who was seen last, so the row this case is about is the last row the list
   * would ever reach — it was off the end of the old two-hundred cap on any
   * database with more members than that, and it is on the last PAGE now that
   * the cap is a page. Three sessions hit it in one night, and every one of
   * them read it as a broken filter: the filter was right the whole time and
   * the spec was asking a list that had not got that far.
   *
   * So it presses JOINED first. Both of these members were created seconds ago
   * by this file's own `beforeEach`, which makes them the two newest members on
   * whatever database this is — so most-recently-joined-first puts them on the
   * first page by construction, not by luck. That is the rule AGENTS.md states
   * twice, applied to a row's POSITION rather than to its contents: a spec must
   * not assert anything about a name, a count or a row it did not itself
   * create, and where a row lands in a paged list is one of those things.
   *
   * AND IT PRESSES, rather than typing the address. Both controls are links
   * whose whole job is to keep each other's answer — a filter that dropped the
   * sort, or a sort that dropped the filter, would leave a reader looking at a
   * list neither of their presses asked for. Driving them in turn is the only
   * thing that says they compose; the filter bar did NOT keep the sort until
   * the day this was written.
   */
  test("leaves out somebody nobody has seen for a month, and never a program", async ({ page }) => {
    // Asked for out loud rather than left to the bare address, which now
    // answers with whatever this browser last asked for.
    await page.goto("/players?who=everyone");
    await expect(page.getByTestId("directory")).toBeVisible();

    // Newest members first, which is where this spec's own two rows are.
    await page.getByTestId("sortable-head").filter({ hasText: "Joined" }).click();
    await expect(page).toHaveURL(/sort=joined(%3A|:)desc/);
    await expect(named(page, AWAY.name)).toHaveCount(1);
    await expect(named(page, HERE.name)).toHaveCount(1);

    /*
     * The narrowing is a number as well as a list, and the number needs no row
     * to be on any page: with nothing narrowed the bar prints one figure, and
     * the moment something is left out it prints two. AWAY is one this spec put
     * there itself, so the second form is guaranteed whatever else this database
     * holds.
     */
    await expect(page.getByTestId("directory-count")).not.toContainText(" of ");

    // Pressed, not typed — and the press must keep the order above.
    await page.getByTestId("only-active").click();
    await expect(page).toHaveURL(/active=1/);
    await expect(page).toHaveURL(/sort=joined(%3A|:)desc/);
    await expect(page.getByTestId("only-active")).toHaveAttribute("aria-pressed", "true");

    /*
     * HERE FIRST, AND THAT ORDER IS THE POINT. `toHaveCount(0)` passes the
     * instant it is asked and cannot tell "not offered" from "I asked before
     * the page had answered" — so the row that IS expected is waited for before
     * the row that is not. Both are in the same table, under the same
     * narrowing, so the absence is a statement about a rendered page.
     */
    await expect(named(page, HERE.name)).toHaveCount(1);
    await expect(named(page, AWAY.name)).toHaveCount(0);
    // And the count says somebody was left out, which the list alone cannot.
    await expect(page.getByTestId("directory-count")).toContainText(" of ");

    /*
     * The case that would have made this filter quietly wrong. A program does
     * not sign in, so its stamp never moves and every away test would put it
     * away for ever — "seen lately" would have emptied the computers list on
     * any site older than a month. Narrowed to the programs, which is a handful
     * of rows and therefore one page whatever the order.
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
    /*
     * SAY WHAT THE WORLD IS BEFORE ASSERTING WHAT A LINK SAYS. A bare
     * `/players` means "however I last asked", and since the narrowing moved
     * off its cookie and onto the account it is remembered in the DATABASE —
     * so an earlier case in this file visiting `/players?settled=1` leaves
     * `settled` on for every case after it, and every link the bar writes then
     * carries `&settled=1`.
     *
     * That is the preference working, not failing: a cookie was reset by each
     * context, and an account is not. The spec was inheriting state it had not
     * created — so it now states the whole filter first and owns its world.
     */
    await page.goto("/players?who=everyone&settled=0&active=0");
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

/**
 * Keeping the narrowing somebody last asked for.
 *
 * A filter that has to be set again every visit is a filter people set once
 * and never again. It is kept ON THE ACCOUNT, through the preferences
 * registry, so these run as a member with an account rather than as the
 * operator — who may hold no member row on a development database, and then
 * has nowhere for a preference to live. It is remembered while the page
 * renders, so none of this can be checked without a browser, which is why it
 * is all here rather than in a unit test.
 */
test.describe("what the page remembers", () => {
  const KEEPS = { email: `filter-keeps-${stamp}@example.test`, name: `FilterKeeps${stamp} Tester` };
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser, baseURL }) => {
    await seedMember(HERE);
    context = await memberContext(browser, baseURL!, KEEPS);
    page = await context.newPage();
    // Start from a known preference rather than whatever a previous case
    // left: the account outlives a test, which is the whole point of it.
    await page.goto("/players?who=everyone");
  });

  test.afterEach(async () => {
    await context.close();
  });

  test("shows what was last asked for when the address says nothing", async () => {
    await page.goto("/players?who=computers");
    await expect(named(page, A_ROBOT)).toHaveCount(1);

    await page.goto("/players");
    await expect(page.getByTestId("who-computers")).toHaveAttribute("aria-current", "true");
    await expect(named(page, A_ROBOT)).toHaveCount(1);
    await expect(named(page, HERE.name)).toHaveCount(0);
  });

  test("obeys an address that does say something, over what it remembers", async () => {
    await page.goto("/players?who=computers");
    await page.goto("/players?who=people");
    await expect(page.getByTestId("who-people")).toHaveAttribute("aria-current", "true");
    await expect(named(page, HERE.name)).toHaveCount(1);
  });

  test("forgets when somebody asks for everybody again", async () => {
    /*
     * THE CASE THE FEATURE BREAKS IF IT GETS WRONG. Narrowing, then asking for
     * everybody, then coming back to a bare address must not put the narrowing
     * back — otherwise the way out of a filter is a control that appears to do
     * nothing.
     */
    await page.goto("/players?who=computers");
    await page.goto("/players?who=everyone");
    await page.goto("/players");
    await expect(page.getByTestId("who-everyone")).toHaveAttribute("aria-current", "true");
    await expect(named(page, HERE.name)).toHaveCount(1);
    await expect(named(page, A_ROBOT)).toHaveCount(1);
  });

  test("remembers the other two questions as well, not only who", async () => {
    await page.goto("/players?who=everyone&active=1");
    await page.goto("/players");
    await expect(page.getByTestId("only-active")).toHaveAttribute("aria-pressed", "true");
  });

  test("can be taken back to never having asked, through the API", async () => {
    // Setting it, changing it and clearing it are three different tests, and
    // this is the third: a member who forgets is shown the ordinary page.
    await page.goto("/players?who=computers&active=1");
    await forgetDirectoryFilter(page);
    await page.goto("/players");
    await expect(page.getByTestId("who-everyone")).toHaveAttribute("aria-current", "true");
    await expect(page.getByTestId("only-active")).toHaveAttribute("aria-pressed", "false");
  });

  test("follows the member to another browser, which is what an account is for", async ({ browser, baseURL }) => {
    /*
     * THE REASON IT IS ON THE ACCOUNT AND NOT IN A COOKIE. Somebody who
     * narrowed the list on their phone finds it narrowed on their laptop. A
     * second browser signed in as the same member, sharing no cookies with
     * the first, is the laptop.
     */
    await page.goto("/players?who=computers");
    const laptop = await memberContext(browser, baseURL!, KEEPS);
    try {
      const other = await laptop.newPage();
      await other.goto("/players");
      await expect(other.getByTestId("who-computers")).toHaveAttribute("aria-current", "true");
      await expect(named(other, A_ROBOT)).toHaveCount(1);
    } finally {
      await laptop.close();
    }
  });
});
