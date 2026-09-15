import { expect, test, type Page } from "@playwright/test";

import { removeXpMembers, seedXpMember, type SeededXpMember } from "./xpMembers";
import { removeLedgerFor, seedLedgerFor } from "./xpGains";
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
 *
 * Which it now means all the way down, and did not before: it says nothing
 * about WHICH PAGE they land on either, because that is a fact about how many
 * other rows exist. See `PAGES_AT_MOST` below — the walk is the fix, and a
 * limit chosen to be big enough was the thing it replaced.
 */

/** Levels far apart, so a row landing on the wrong one is unmistakable. */
const RUN = `${Date.now()}`;

/**
 * IT READS THE BOARD'S PAGES, RATHER THAN ASKING FOR A PAGE BIG ENOUGH.
 *
 * Twice now this file has asked a question whose answer depended on how many
 * rows somebody else had created. The first version drove the default
 * twenty-five-row page and passed on a database with seventeen members on the
 * board; two releases later there were thirty-three and the seeds — named
 * `Xp…`, last alphabetically — fell off page one, so it reported the sort
 * broken when the sort was right. The answer then was `?limit=100`, which
 * passed until there were 186, and then reported the same thing for the same
 * reason. A number chosen to be big enough is a number that stops being big
 * enough, and it fails in the direction that reads as a bug in the code.
 *
 * So nothing here depends on the size of the board. `expectOrder` presses
 * "Show the next…" — the control a reader uses — until it has seen all three
 * seeded rows, and asserts the order they were seen in. That is a statement
 * about the ORDERING and about nothing else on this machine: the seeds may sit
 * on page one or page eight, the board may grow between two runs, and the same
 * assertion holds. It also drives a promise nothing else here does — that a
 * press of "next" keeps the sort a reader chose, rather than handing back the
 * next page of a different board.
 *
 * The cap exists so a loop cannot run away on a database nobody expected; it is
 * far above the eight pages this board takes today, and its failure message
 * says what it means rather than leaving "the sort is broken" to be guessed.
 */
const PAGES_AT_MOST = 60;

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
 * The spec's own three members among the rows on THIS page, top to bottom.
 *
 * Read off the rendered rows rather than off the addresses, because what is
 * being tested is what a reader SEES. Rows belonging to anybody else are
 * dropped, so the answer is about the ordering and not about the database.
 */
async function seededRowsHere(page: Page): Promise<string[]> {
  const names = await page.getByTestId("xp-leaderboard").locator("tbody tr td:nth-child(2)").allInnerTexts();
  const mine = [alpha.name, beta.name, gamma.name];
  return names
    .map((text) => mine.find((name) => text.includes(name)))
    .filter((name): name is string => name !== undefined);
}

/**
 * The top row of the board as it stands — the whole line, rank included.
 *
 * Used as the signal that a press of "next" has actually landed. Pressing it is
 * a client-side navigation, so a read on the line after the click sees the page
 * that was there BEFORE it; that is the mistake the third assertion in this file
 * used to make, and it reported the sort broken when the sort was right. Every
 * page of the board holds a different member at a different rank, so this
 * changing is the page having changed — which nothing about the URL can say,
 * since an address commits before what it asked for is drawn.
 */
async function topRow(page: Page): Promise<string> {
  const rows = page.getByTestId("xp-leaderboard").locator("tbody tr");
  return (await rows.count()) === 0 ? "" : (await rows.first().innerText());
}

/** The rank in the board's top row — "1" on page one, "26" on the next, and so on. */
async function topRank(page: Page): Promise<string> {
  const cells = page.getByTestId("xp-leaderboard").locator("tbody tr td:nth-child(1)");
  return (await cells.count()) === 0 ? "" : (await cells.first().innerText()).trim();
}

/** Presses "Show the next…", and waits for the page it asked for to be the one on screen. */
async function nextPage(page: Page): Promise<boolean> {
  const next = page.getByTestId("xp-board-next");
  if ((await next.count()) === 0) return false;
  const was = await topRow(page);
  await next.click();
  await expect
    .poll(() => topRow(page), { message: "the next page of the board to be the one on screen" })
    .not.toBe(was);
  return true;
}

/**
 * Back to page one, through the control a reader would use rather than by typing
 * an address. Absent when the board is already showing its top.
 */
async function backToTop(page: Page) {
  if ((await page.getByTestId("xp-board-top").count()) === 0) return;
  await page.getByTestId("xp-board-top").click();
  // The rank in the top row, which is 1 on page one and nowhere else.
  await expect.poll(() => topRank(page), { message: "the top of the board" }).toBe("1");
}

/**
 * Presses a heading, and waits for the table to say it is sorted that way.
 *
 * The settle is the heading's own `aria-sort`, which the server renders for the
 * order actually in force — so it is a fact about the page that came back rather
 * than about the address, and it is unambiguous in both directions.
 */
async function sortByHeading(page: Page, column: string, way: "ascending" | "descending") {
  const heading = page.locator(`th:has([data-testid='sortable-head'][data-sort='${column}'])`);
  await heading.locator("[data-testid='sortable-head']").click();
  await expect(heading).toHaveAttribute("aria-sort", way);
}

/**
 * The seeded rows are in this order, read across as many pages as it takes.
 *
 * Walks forward from wherever the board is now, collecting the seeds page by
 * page, and stops as soon as it has all three. So it is the ORDER that is
 * asserted and never the page they landed on: what the board does with the rest
 * of its rows is not this spec's business, and how many of them there are is not
 * either.
 */
async function expectOrder(page: Page, order: readonly string[]) {
  const seen: string[] = [];
  let read = 0;
  for (; read < PAGES_AT_MOST; read += 1) {
    seen.push(...(await seededRowsHere(page)));
    if (seen.length >= order.length) break;
    if (!(await nextPage(page))) break;
  }
  expect(
    seen,
    `the seeded rows in the order the board gives them, read across ${read + 1} page(s). ` +
      `Fewer than ${order.length} found means the walk ran out of pages before it found them — ` +
      `look at whether the rows were seeded, not at whether the sort works`,
  ).toEqual([...order]);
}

/**
 * The row for one seeded member, found by paging from the top of the board.
 *
 * For the assertions that are about a row rather than about an order: which page
 * a member is on depends on everybody else, so the page is walked to rather than
 * assumed.
 */
async function rowFor(page: Page, name: string) {
  await backToTop(page);
  const row = page.getByTestId("xp-board-row").filter({ hasText: name });
  for (let read = 0; read < PAGES_AT_MOST; read += 1) {
    if ((await row.count()) > 0) return row;
    if (!(await nextPage(page))) break;
  }
  throw new Error(`${name} is not on any page of the board, so the row cannot be read`);
}

test("the board opens on XP, highest first", async ({ page }) => {
  const crashes = watchForCrashes(page);
  await page.goto("/xp");

  await expect(page.getByTestId("xp-leaderboard")).toBeVisible();
  await expectOrder(page, [beta.name, gamma.name, alpha.name]);

  // The level badge is on the row, and it leads to that level's own page.
  const row = await rowFor(page, beta.name);
  await expect(row.getByTestId("level-name")).toHaveAttribute("href", "/xp/levels/80");
  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("pressing a heading sorts by it, and pressing it again reverses", async ({ page }) => {
  await page.goto("/xp");
  await expect(page.getByTestId("xp-leaderboard")).toBeVisible();

  /*
   * Back to the top before each press, through the board's own control. A sort
   * press drops the cursor but the walk above may have left a `from` in the
   * address, and the page numbers its rows from that — so pressing a heading
   * from page eight would ask a question about page one under page eight's
   * numbering. Starting each direction from the top is also what a reader does.
   */
  await sortByHeading(page, "name", "ascending");
  await expect(page).toHaveURL(/sort=name%3Aasc|sort=name:asc/);
  await expectOrder(page, [alpha.name, beta.name, gamma.name]);

  /*
   * A second press means "the other way round", not "again". This is the return
   * trip: a one-directional control is a whole class of fault, and an order a
   * reader cannot get back out of is one of them.
   */
  await backToTop(page);
  await sortByHeading(page, "name", "descending");
  await expect(page).toHaveURL(/sort=name%3Adesc|sort=name:desc/);
  await expectOrder(page, [gamma.name, beta.name, alpha.name]);

  /* And back to the board's own order, which must be reachable by pressing. */
  await backToTop(page);
  await sortByHeading(page, "xp", "descending");
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
  await page.goto("/xp?sort=passwordHash");

  /*
   * Waited for the table, which IS on the page, before reading the notice — an
   * absence or a presence asserted before the page has answered is the quietest
   * way for a test to say nothing.
   */
  await expect(page.getByTestId("xp-leaderboard")).toBeVisible();
  await expect(page.getByTestId("xp-sort-refused")).toBeVisible();
  await expectOrder(page, [beta.name, gamma.name, alpha.name]);
});

/**
 * TODAY AND 7 DAYS, IN THE BOARD'S SCOPE.
 *
 * John: "XP tables aren't useful if they don't tell us how much you went up each
 * day". The member and every award are this spec's own: 20 won here today, 30
 * of another site's credit today, 100 three days ago, and 400 ten days ago that
 * neither column may count. Everywhere that is +50 and +150; Itsutsu only, +20
 * and +120. The scope is changed by pressing its chip, and pressed back again so
 * the operator's remembered scope is left as the spec found it.
 */
test("each row says what it gained today and over seven days, in the board's scope", async ({ page }) => {
  const gainer = await seedXpMember(30, "gains", `Xpgain-${RUN}`);
  try {
    await seedLedgerFor(gainer.id, [
      { type: "gameWon", points: 20, subject: `${RUN}-won`, daysAgo: 0 },
      { type: "importedGames", points: 30, subject: `ItsYourTurn.com@${RUN}=30`, daysAgo: 0 },
      { type: "gameFinished", points: 100, subject: `${RUN}-finished`, daysAgo: 3 },
      { type: "firstOfVariant", points: 400, subject: "renju", daysAgo: 10 },
    ]);
    await page.goto("/xp?who=everyone");
    await expect(page.getByTestId("xp-leaderboard")).toBeVisible();

    await page.getByTestId("scope-everywhere").click();
    await expect(page.getByTestId("xp-scope-said")).toHaveAttribute("data-scope", "everywhere");
    let row = await rowFor(page, gainer.name);
    await expect(row.getByTestId("xp-board-today")).toHaveText("+50");
    await expect(row.getByTestId("xp-board-week")).toHaveText("+150");

    await page.getByTestId("scope-here").click();
    await expect(page.getByTestId("xp-scope-said")).toHaveAttribute("data-scope", "here");
    row = await rowFor(page, gainer.name);
    await expect(row.getByTestId("xp-board-today")).toHaveText("+20");
    await expect(row.getByTestId("xp-board-week")).toHaveText("+120");

    // And the way back, which also leaves the remembered scope where it was.
    await page.getByTestId("scope-everywhere").click();
    await expect(page.getByTestId("xp-scope-said")).toHaveAttribute("data-scope", "everywhere");
    row = await rowFor(page, gainer.name);
    await expect(row.getByTestId("xp-board-today")).toHaveText("+50");
  } finally {
    await removeLedgerFor([gainer.id]);
    await removeXpMembers([gainer.email]);
  }
});

/**
 * BEHIND NEXT: THE GAP TO THE ROW DIRECTLY ABOVE, WHOEVER IS ON THE BOARD.
 *
 * Asserted as a relation between rows the page drew — each row's gap is the XP
 * above it less its own — so it holds on any database, and three to a page so
 * the row above the second page's first is on the page before. The first row of
 * the board has nobody above it and says nothing. A fourth member is seeded so
 * there is always a second page, whatever else the board holds.
 */
test("Behind next is the gap to the row directly above: blank at the top, and carried onto the next page", async ({ page }) => {
  const fourth = await seedXpMember(10, "gap", `Xpgap-${RUN}`);
  try {
    await page.goto("/xp?who=everyone&limit=3");
    const rows = page.getByTestId("xp-leaderboard").locator("tbody tr");
    await expect(rows).toHaveCount(3);
    const xpOf = async (at: number) =>
      Number((await rows.nth(at).getByTestId("xp-board-xp").innerText()).replace(/,/g, ""));

    await expect(rows.nth(0).getByTestId("xp-board-behind")).toHaveText("");
    for (const at of [1, 2]) {
      const gap = (await xpOf(at - 1)) - (await xpOf(at));
      await expect(rows.nth(at).getByTestId("xp-board-behind")).toHaveText(gap.toLocaleString("en-GB"));
    }

    const lastOnFirst = await xpOf(2);
    expect(await nextPage(page), "a second page of the board").toBe(true);
    const across = lastOnFirst - (await xpOf(0));
    await expect(rows.nth(0).getByTestId("xp-board-behind")).toHaveText(across.toLocaleString("en-GB"));
  } finally {
    await removeXpMembers([fourth.email]);
  }
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
