import { expect, test, type Page } from "@playwright/test";

import { removeXpMembers, seedXpMember, type SeededXpMember } from "./xpMembers";
import { watchForCrashes } from "./support";

/**
 * THE XP LEADERBOARD, SORTED BY PRESSING ITS HEADINGS.
 *
 * The control is a HEADING and what it promises is a different order, so this
 * presses one rather than navigating to `?sort=name:asc` — the address the press
 * would have produced. AGENTS.md is explicit about why: the language picker was
 * verified thoroughly by setting the cookie a click would have set, every
 * assertion was true, and clicking was the whole bug.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT BRINGS THREE MEMBERS, AND THEIR NAMES DISAGREE WITH THEIR TOTALS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The three seeded levels and the three seeded names are deliberately in
 * DIFFERENT orders, so each of the three orderings this spec asks for is a
 * distinct sequence:
 *
 *   by XP, descending    B · C · A      (levels 80, 50, 20)
 *   by name, ascending   A · B · C
 *   by name, descending  C · B · A
 *
 * If the sort did nothing at all, two of those three assertions would fail.
 * Names in the same order as totals would have let a heading that sorts by
 * nothing pass the first two.
 *
 * **And it asserts about its own three rows only.** The board may hold other
 * members on a developer's database and this says nothing about them: what it
 * checks is the RELATIVE order of the rows it made, which is a statement about
 * the ordering rather than about what else is on this machine.
 */

/** Levels far apart, so a row landing on the wrong one is unmistakable. */
const RUN = `${Date.now()}`;

/**
 * ONE PAGE BIG ENOUGH TO HOLD THE WHOLE BOARD, AND WHY THE SPEC ASKS FOR IT.
 *
 * The first version of this file drove `/xp` with the default twenty-five-row
 * page, and it passed — on a database with seventeen members on the board. Two
 * releases later there were thirty-three, and the three rows this spec seeds are
 * named `Xp…`: sorted by name ascending they are last alphabetically, so they
 * fell off page one and the spec reported the sort broken when the sort was
 * right.
 *
 * That is the database-litter rule arriving from an angle the rule does not
 * name: the spec created its own rows, correctly, and then asked a question
 * whose answer depended on **how many rows somebody else had created**. So it
 * asks for a page that holds the board, and `expectOrder` carries the diagnosis
 * in its failure message for the day the board outgrows even this — so the next
 * person reads "they are not all on one page" rather than "the sort is broken".
 *
 * Only the three ordering tests need it. The one about `aria-sort` and the one
 * about the navigation bar are statements about headings and addresses, so they
 * drive the ordinary page a reader gets.
 *
 * Asking for it through `?limit=` also drives something worth driving:
 * `sortHref` promises that every other parameter survives a press, and a press
 * that dropped the limit would hand back a twenty-five-row page.
 */
const WHOLE_BOARD = 100;

/** The board must fit in one page for the order of three rows in it to be readable. */
const BOARD_FITS = `?limit=${WHOLE_BOARD}`;

let alpha: SeededXpMember;
let beta: SeededXpMember;
let gamma: SeededXpMember;

test.beforeAll(async () => {
  // Names ascend a→b→c; totals do not. See the header.
  alpha = await seedXpMember(20, "board", `Xpaaa-${RUN}`);
  beta = await seedXpMember(80, "board", `Xpbbb-${RUN}`);
  gamma = await seedXpMember(50, "board", `Xpccc-${RUN}`);
});

test.afterAll(async () => {
  await removeXpMembers([alpha.email, beta.email, gamma.email]);
});

/**
 * The order this spec's own three members appear in, top to bottom.
 *
 * Read off the rendered rows rather than off the addresses, because what is
 * being tested is what a reader SEES. Rows belonging to anybody else are
 * dropped, so the answer is about the ordering and not about the database.
 */
async function seededOrder(page: Page): Promise<string[]> {
  const names = await page.getByTestId("xp-leaderboard").locator("tbody tr td:nth-child(2)").allInnerTexts();
  const mine = [alpha.name, beta.name, gamma.name];
  return names
    .map((text) => mine.find((name) => text.includes(name)))
    .filter((name): name is string => name !== undefined);
}

/**
 * The seeded rows are in this order — waited for, not sampled.
 *
 * `expect.poll` rather than one read of the DOM, and this is not belt and
 * braces: pressing a heading is a client-side navigation, so a plain
 * `allInnerTexts()` on the line after a click reads the page that was there
 * BEFORE it. That is what the third assertion in this file did, and it reported
 * the sort broken when the sort was right — the same shape as every hydration
 * race in AGENTS.md, and one that could as easily have passed by luck over a
 * board that never re-ordered at all.
 */
async function expectOrder(page: Page, order: readonly string[]) {
  await expect
    .poll(async () => seededOrder(page), {
      /*
       * The message carries the diagnosis, because the likely cause of a failure
       * here is NOT a broken sort. An empty or short array means the seeded rows
       * are not all on this page — which happens when the board outgrows
       * `WHOLE_BOARD`, and cost this file one confusing red before it said so.
       */
      message:
        `the seeded rows in order. Fewer than ${order.length} found means they are not all ` +
        `on one page: the board may have outgrown the limit of ${WHOLE_BOARD} this spec asks for`,
    })
    .toEqual([...order]);
}

test("the board opens on XP, highest first", async ({ page }) => {
  const crashes = watchForCrashes(page);
  await page.goto(`/xp${BOARD_FITS}`);

  await expect(page.getByTestId("xp-leaderboard")).toBeVisible();
  await expectOrder(page, [beta.name, gamma.name, alpha.name]);

  // The level badge is on the row, and it leads to that level's own page.
  const row = page.getByTestId("xp-board-row").filter({ hasText: beta.name });
  await expect(row.getByTestId("level-name")).toHaveAttribute("href", "/xp/levels/80");
  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("pressing a heading sorts by it, and pressing it again reverses", async ({ page }) => {
  await page.goto(`/xp${BOARD_FITS}`);
  await expect(page.getByTestId("xp-leaderboard")).toBeVisible();

  /* The control a reader presses — the Member heading, which orders by name. */
  await page.locator("[data-testid='sortable-head'][data-sort='name']").click();

  await expect(page).toHaveURL(/sort=name%3Aasc|sort=name:asc/);
  await expectOrder(page, [alpha.name, beta.name, gamma.name]);

  /*
   * A second press means "the other way round", not "again". This is the return
   * trip: a one-directional control is a whole class of fault, and an order a
   * reader cannot get back out of is one of them.
   */
  await page.locator("[data-testid='sortable-head'][data-sort='name']").click();
  await expect(page).toHaveURL(/sort=name%3Adesc|sort=name:desc/);
  await expectOrder(page, [gamma.name, beta.name, alpha.name]);

  /* And back to the board's own order, which must be reachable by pressing. */
  await page.locator("[data-testid='sortable-head'][data-sort='xp']").click();
  await expect(page).toHaveURL(/sort=xp%3Adesc|sort=xp:desc/);
  await expectOrder(page, [beta.name, gamma.name, alpha.name]);
});

test("the heading in force says which way round it is, in words as well as an arrow", async ({
  page,
}) => {
  await page.goto("/xp");

  /*
   * Every sortable heading carries `aria-sort`, and the ones not in force carry
   * "none" — which is correct ARIA and is how a screen reader is told a column
   * CAN be sorted. So what must be unique is a heading claiming to be the order
   * in force: two of those would tell a reader the table is ordered by two
   * columns at once.
   */
  const inForce = page.locator("th[aria-sort]:not([aria-sort='none'])");
  await expect(inForce).toHaveCount(1);
  await expect(inForce).toHaveAttribute("aria-sort", "descending");
  await expect(page.locator("th[aria-sort='none']")).toHaveCount(3);

  await page.locator("[data-testid='sortable-head'][data-sort='name']").click();
  await expect(page).toHaveURL(/sort=name/);
  await expect(page.locator("th[aria-sort]:not([aria-sort='none'])")).toHaveCount(1);
  await expect(page.locator("th[aria-sort='ascending']")).toHaveCount(1);
});

test("an order the board does not have gives the board, and says so", async ({ page }) => {
  await page.goto(`/xp${BOARD_FITS}&sort=passwordHash`);

  /*
   * Waited for the table, which IS on the page, before reading the notice — an
   * absence or a presence asserted before the page has answered is the quietest
   * way for a test to say nothing.
   */
  await expect(page.getByTestId("xp-leaderboard")).toBeVisible();
  await expect(page.getByTestId("xp-sort-refused")).toBeVisible();
  await expectOrder(page, [beta.name, gamma.name, alpha.name]);
});

test("the leaderboard and the ladder of levels each lead to the other", async ({ page }) => {
  await page.goto("/xp");
  await page.getByTestId("to-ladder").click();
  await expect(page).toHaveURL(/\/xp\/levels$/);

  await page.getByTestId("to-leaderboard").click();
  await expect(page).toHaveURL(/\/xp$/);
  await expect(page.getByTestId("xp-leaderboard")).toBeVisible();
});

test("XP is a section of the site, reachable from the bar on any page", async ({ page }) => {
  await page.goto("/players");
  await page.getByRole("link", { name: "XP", exact: true }).click();
  await expect(page).toHaveURL(/\/xp$/);
  await expect(page.getByTestId("xp-leaderboard")).toBeVisible();
});
