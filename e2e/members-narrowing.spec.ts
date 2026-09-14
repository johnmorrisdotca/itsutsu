import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { AWAY_AFTER_DAYS } from "../src/lib/rating/directoryFilter";
import { shownName } from "../src/lib/rating/shownName";

import {
  memberContext,
  memberIdFor,
  removeMember,
  removePlayedUnder,
  seedLadderRow,
  seedMember,
  seenDaysAgo,
  type TestMember,
} from "./members";
import { ready } from "./support";

/**
 * THE MEMBERS LIST MUST NEVER BE EMPTY BECAUSE OF A NARROWING NOBODY IS
 * LOOKING AT.
 *
 * John, at 0.187.3, signed in as himself on /players: "no player standings".
 * The Members tab had "Settled ratings" and "Seen lately" both switched on,
 * read "0 of 11 listed", and drew its headings over nothing. He had not
 * switched them on that visit. The page had REMEMBERED them on his account
 * from some earlier click, and a bare /players reopened them.
 *
 * The two switches are questions somebody asks on the day — who is about
 * now, whose rating means something yet — and on a site this size either one
 * can empty the list. So they are carried by the address and never kept:
 * the Members tab opens with them off. Which KIND of player somebody likes to
 * look at (People, Computers, Everyone) is a standing view, and it is still
 * kept — and the page now says so when it opens with one, with the way to
 * take it off beside it.
 *
 * EVERYTHING HERE IS CLICKED. The filter bar and the tabs are links, and a
 * reader reaches a bare /players by pressing the Members tab — a client-side
 * navigation — not by typing the address. And nothing reloads: a reload
 * would throw away exactly the state these bugs live in. A value set on
 * `window` at the start is read back at the end of each case, which a
 * document load would have wiped.
 *
 * ITS OWN WORLD. Every member it asserts about is seeded here and removed
 * here, and every case signs in as a reader of its own, so what the page
 * remembers is only what that case chose.
 */

const stamp = Date.now().toString(36);

/** Seen today, with no rating: here, and not settled. */
const NEW_HERE: TestMember = { email: `narrow-new-${stamp}@example.test`, name: `NarrowNew${stamp} Tester` };
/** A settled ladder rating, and not seen for longer than "lately" reaches. */
const SETTLED_AWAY: TestMember = {
  email: `narrow-settled-${stamp}@example.test`,
  name: `NarrowSettled${stamp} Tester`,
};

const readers: string[] = [];
let context: BrowserContext;
let page: Page;

const named = (on: Page, member: TestMember) =>
  on.getByTestId("directory").getByTestId("directory-name").filter({ hasText: shownName(member.name) });

const membersTab = (on: Page) => on.locator('[data-testid="tab"][data-tab="members"]');

/** Marks the document, so a case can prove at its end that it never loaded another. */
async function markDocument(on: Page): Promise<void> {
  await on.evaluate((value) => {
    (window as unknown as Record<string, unknown>).playersEmptyMark = value;
  }, stamp);
}

async function sameDocument(on: Page): Promise<void> {
  const kept = await on.evaluate(() => (window as unknown as Record<string, unknown>).playersEmptyMark);
  expect(kept, "the page reloaded somewhere in this case").toBe(stamp);
}

/** A reader nobody has ever narrowed anything for. */
async function freshReader(browser: Browser, baseURL: string, label: string): Promise<void> {
  const reader = { email: `narrow-reader-${label}-${stamp}@example.test`, name: `NarrowReader${label}${stamp} Tester` };
  readers.push(reader.email);
  context = await memberContext(browser, baseURL, reader);
  page = await context.newPage();
}

test.beforeAll(async () => {
  await seedMember(NEW_HERE);
  await seedMember(SETTLED_AWAY);
  await seenDaysAgo(SETTLED_AWAY.email, AWAY_AFTER_DAYS + 10);
  await seedLadderRow({
    name: SETTLED_AWAY.name,
    rating: 1712,
    games: 25,
    wins: 15,
    losses: 10,
    memberId: await memberIdFor(SETTLED_AWAY.email),
  });
});

test.afterEach(async () => {
  await context.close();
});

test.afterAll(async () => {
  await removePlayedUnder([SETTLED_AWAY.name]);
  for (const email of [NEW_HERE.email, SETTLED_AWAY.email, ...readers]) await removeMember(email);
});

test.describe("narrowing the members list", () => {
  test("empties when every narrowing is on, says why, and fills again as each is taken off", async ({
    browser,
    baseURL,
  }) => {
    await freshReader(browser, baseURL!, "empties");
    await page.goto("/players?who=people");
    await ready(page, "tabs");
    await markDocument(page);

    // Newest members first, which is where this file's own rows are.
    await page.getByTestId("sortable-head").filter({ hasText: "Joined" }).click();
    await expect(page).toHaveURL(/sort=joined(%3A|:)desc/);
    await expect(named(page, NEW_HERE)).toHaveCount(1);
    await expect(named(page, SETTLED_AWAY)).toHaveCount(1);

    await page.getByTestId("only-settled").click();
    await expect(page.getByTestId("only-settled")).toHaveAttribute("aria-pressed", "true");
    // The row that stays, waited for before the row that goes.
    await expect(named(page, SETTLED_AWAY)).toHaveCount(1);
    await expect(named(page, NEW_HERE)).toHaveCount(0);
    await expect(page.getByTestId("directory-narrowed")).toContainText("Settled ratings");

    await page.getByTestId("only-active").click();
    await expect(page.getByTestId("only-active")).toHaveAttribute("aria-pressed", "true");
    /*
     * People with a settled rating who were seen lately: nobody this file
     * made, and nobody on a development database or a fresh one — a settled
     * rating among PEOPLE is twenty games between two people. If a database
     * does hold one, this fails naming the count rather than skipping.
     */
    await expect(page.getByTestId("directory-count")).toHaveText(/^0 of \d+ listed$/);
    const empty = page.getByTestId("directory-empty");
    await expect(empty).toBeVisible();
    // Why, in words — both narrowings — under headings that are still drawn.
    await expect(empty).toContainText("settled rating");
    await expect(empty).toContainText(`seen in the last ${AWAY_AFTER_DAYS} days`);
    await expect(page.getByTestId("directory").locator("thead")).toContainText("Rating");
    await expect(named(page, SETTLED_AWAY)).toHaveCount(0);

    // Take off "seen lately" from inside the empty table: the settled member comes back.
    await empty.getByTestId("narrowed-off-active").click();
    await expect(page.getByTestId("only-active")).toHaveAttribute("aria-pressed", "false");
    await expect(page).toHaveURL(/sort=joined(%3A|:)desc/);
    await expect(named(page, SETTLED_AWAY)).toHaveCount(1);
    await expect(named(page, NEW_HERE)).toHaveCount(0);

    // And "settled" from the line above the table: everybody this file made is back.
    await page.getByTestId("directory-narrowed").getByTestId("narrowed-off-settled").click();
    await expect(page.getByTestId("only-settled")).toHaveAttribute("aria-pressed", "false");
    await expect(named(page, NEW_HERE)).toHaveCount(1);
    await expect(named(page, SETTLED_AWAY)).toHaveCount(1);

    await sameDocument(page);
  });

  test("does not keep either switch: the Members tab opens with both off", async ({ browser, baseURL }) => {
    // John's page, reproduced: both switches pressed, then the list opened again.
    await freshReader(browser, baseURL!, "forgets");
    await page.goto("/players?who=everyone");
    await ready(page, "tabs");
    await markDocument(page);

    await page.getByTestId("only-settled").click();
    await expect(page.getByTestId("only-settled")).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("only-active").click();
    await expect(page.getByTestId("only-active")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("directory-count")).toContainText(" of ");

    await membersTab(page).click();
    await expect(page).toHaveURL(/\/players$/);
    await expect(page.getByTestId("only-settled")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("only-active")).toHaveAttribute("aria-pressed", "false");
    await expect(named(page, NEW_HERE)).toHaveCount(1);
    await expect(page.getByTestId("directory-count")).not.toContainText(" of ");

    await sameDocument(page);
  });
});

/**
 * THE ONE THING STILL REMEMBERED, AND THE WAY BACK FROM IT. Setting it,
 * changing it and clearing it are three different tests.
 */
test.describe("the kind of player the list opens with", () => {
  test("is the one last chosen, and the page says that is why", async ({ browser, baseURL }) => {
    await freshReader(browser, baseURL!, "sets");
    await page.goto("/players?who=everyone");
    await ready(page, "tabs");
    await markDocument(page);
    // A reader who never chose is not told about a choice.
    await expect(page.getByTestId("who-everyone")).toHaveAttribute("aria-current", "true");
    await expect(page.getByTestId("directory-narrowed")).toHaveCount(0);

    await page.getByTestId("who-people").click();
    await expect(page).toHaveURL(/who=people/);
    await expect(page.getByTestId("who-people")).toHaveAttribute("aria-current", "true");

    await membersTab(page).click();
    await expect(page).toHaveURL(/\/players$/);
    await expect(page.getByTestId("who-people")).toHaveAttribute("aria-current", "true");
    const narrowed = page.getByTestId("directory-narrowed");
    await expect(narrowed).toContainText("People");
    await expect(narrowed.getByTestId("narrowed-remembered")).toBeVisible();
    await expect(page.getByTestId("only-settled")).toHaveAttribute("aria-pressed", "false");

    await sameDocument(page);
  });

  test("changes when another is chosen", async ({ browser, baseURL }) => {
    await freshReader(browser, baseURL!, "changes");
    await page.goto("/players?who=people");
    await ready(page, "tabs");
    await markDocument(page);
    await membersTab(page).click();
    await expect(page).toHaveURL(/\/players$/);
    await expect(page.getByTestId("who-people")).toHaveAttribute("aria-current", "true");

    await page.getByTestId("who-computers").click();
    await expect(page).toHaveURL(/who=computers/);
    await expect(page.getByTestId("who-computers")).toHaveAttribute("aria-current", "true");

    await membersTab(page).click();
    await expect(page).toHaveURL(/\/players$/);
    await expect(page.getByTestId("who-computers")).toHaveAttribute("aria-current", "true");
    const narrowed = page.getByTestId("directory-narrowed");
    await expect(narrowed).toContainText("Computers");
    await expect(narrowed.getByTestId("narrowed-remembered")).toBeVisible();
    await expect(named(page, NEW_HERE)).toHaveCount(0);

    await sameDocument(page);
  });

  test("is forgotten when it is taken off, and the list opens on everybody again", async ({
    browser,
    baseURL,
  }) => {
    await freshReader(browser, baseURL!, "clears");
    await page.goto("/players?who=people");
    await ready(page, "tabs");
    await markDocument(page);
    await membersTab(page).click();
    await expect(page).toHaveURL(/\/players$/);
    await expect(page.getByTestId("who-people")).toHaveAttribute("aria-current", "true");

    await page.getByTestId("directory-narrowed").getByTestId("narrowed-off-who").click();
    await expect(page).toHaveURL(/who=everyone/);
    await expect(page.getByTestId("who-everyone")).toHaveAttribute("aria-current", "true");

    await membersTab(page).click();
    await expect(page).toHaveURL(/\/players$/);
    await expect(page.getByTestId("who-everyone")).toHaveAttribute("aria-current", "true");
    await expect(page.getByTestId("directory-count")).toHaveText(/^\d+ listed$/);
    await expect(page.getByTestId("directory-narrowed")).toHaveCount(0);
    await expect(named(page, NEW_HERE)).toHaveCount(1);

    await sameDocument(page);
  });
});
