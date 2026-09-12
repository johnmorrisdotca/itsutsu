import { expect, test, type Page } from "@playwright/test";

import { ready, watchForCrashes } from "./support";

/**
 * SORTING AND PAGING, DRIVEN THE WAY A READER DRIVES THEM.
 *
 * Everything here presses a control. Nothing types an address to reach the
 * feature and nothing reloads to make an assertion pass — both are the shape
 * AGENTS.md calls "a test that does what a user would not do", and the language
 * picker is this project's own example of it: `?lang=es` was verified thoroughly
 * and CLICKING the switch was broken the whole time, because a client-side
 * navigation answered from a cache the cookie had not reached.
 *
 * Live scrolling has exactly that hazard. It is client state built after
 * hydration, so a spec that asserts on it before the browser has taken over is
 * asserting about server HTML — which shows the pager, not the scroller, and
 * would pass for ever whatever the scroller did. `ready(page, …)` waits on the
 * marker, not on an element the server also renders.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT THESE ASSERT, AND WHAT THEY DELIBERATELY DO NOT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A spec must not assert anything about a name, a count or a row it did not
 * create — and paging needs more rows than a spec can reasonably play out, since
 * a finished game here is a full winning sequence. So nothing below names a
 * player, a game or a total. What they assert are RELATIVE properties, which are
 * true of whatever rows the database holds: the order is monotone, no row appears
 * twice, the list grows when scrolled, the address changed, the control reversed.
 *
 * The precondition is ASSERTED RATHER THAN SKIPPED. A `test.skip` on "this
 * database has too few games" reports green while checking nothing, which is the
 * quietest way for a suite to say nothing at all — ten specs here already do it
 * and AGENTS.md names them. So `enoughToPage` fails loudly, and says what it
 * needed. The `limit` is deliberately tiny so that the bar is three rows.
 */

/** A small page, so two pages exist wherever there are a handful of rows. */
const SMALL = 3;

/** The game ids down the record, in the order the rows came out. */
async function recordIds(page: Page): Promise<string[]> {
  return page
    .getByTestId("history-row")
    .locator("a[aria-label^='Replay:']")
    .evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).pathname));
}

/** The player links down the ladder, in row order. */
async function ladderNames(page: Page): Promise<string[]> {
  return page
    .getByTestId("players-table")
    .locator("tbody a[href^='/players/']")
    .evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).pathname));
}

/** The move counts down the record's rows, as numbers. */
async function moveCounts(page: Page): Promise<number[]> {
  const cells = await page
    .getByTestId("history-row")
    .locator("span.tabular-nums")
    .allInnerTexts();
  return cells.map((text) => Number(text.replace(/\D/g, "")));
}

/** The Played column down a record table, as numbers. */
async function playedCounts(page: Page): Promise<number[]> {
  const cells = await page
    .getByTestId("players-table")
    .locator("tbody [data-testid='record-played']")
    .allInnerTexts();
  return cells.map((text) => Number(text.replace(/[^\d]/g, "")));
}

/** True when the numbers never go the wrong way, and there are some. */
function ordered(values: number[], way: "up" | "down"): boolean {
  if (values.length === 0) return false;
  return values.every((value, index) => {
    if (index === 0) return true;
    return way === "up" ? values[index - 1] <= value : values[index - 1] >= value;
  });
}

/** The total out of a "N of M shown" line, so a precondition can be asserted. */
function totalIn(line: string): number {
  const found = /of\s+([\d,]+)/.exec(line);
  return found === null ? 0 : Number(found[1].replace(/,/g, ""));
}

/**
 * Fails, rather than skipping, when the database cannot show what is being
 * tested. See the head of this file.
 */
function enoughToPage(count: number, what: string) {
  expect(
    count,
    `this database has ${count} ${what}; paging needs more than ${SMALL}. Play some games, or run the suite against a database that has them — a skip here would report green while checking nothing.`,
  ).toBeGreaterThan(SMALL);
}

test.describe("the record sorts and scrolls", () => {
  test("the sort control changes the address and the order on the page", async ({ page }) => {
    const crashes = watchForCrashes(page);
    await page.goto("/history");
    // The filter bar is a client component; its select is only live once attached.
    await ready(page, "history-filters");
    await ready(page, "live-record");

    const before = await recordIds(page);
    expect(before.length).toBeGreaterThan(0);

    // Driven, not typed: a reader chooses from this select.
    await page.getByTestId("history-sort").selectOption("moves:asc");
    await expect(page).toHaveURL(/sort=moves%3Aasc|sort=moves:asc/);

    // Shortest games first, read off the rows themselves rather than the address.
    await expect.poll(async () => ordered(await moveCounts(page), "up")).toBe(true);

    // And the other way round, from the same control — the return trip.
    await page.getByTestId("history-sort").selectOption("moves:desc");
    await expect(page).toHaveURL(/sort=moves%3Adesc|sort=moves:desc/);
    await expect.poll(async () => ordered(await moveCounts(page), "down")).toBe(true);

    // A different order really is a different page, not the same rows relabelled.
    expect(await recordIds(page)).not.toEqual(before);

    expect(crashes).toEqual([]);
  });

  test("scrolling to the end appends the next page, with no row twice and none skipped", async ({
    page,
  }) => {
    const crashes = watchForCrashes(page);
    await page.goto(`/history?limit=${SMALL}`);
    await ready(page, "live-record");

    /*
     * The progress line is what says live scrolling took over, and waiting for it
     * is how the absence below becomes a statement about a rendered page rather
     * than about how fast this machine is.
     */
    const progress = page.getByTestId("record-progress");
    await expect(progress).toBeVisible();
    enoughToPage(totalIn(await progress.innerText()), "finished games");

    // ONE CONTROL AT A TIME: the pager is gone while the scroller is working.
    await expect(page.getByRole("navigation", { name: "Pagination" })).toHaveCount(0);

    /*
     * AT LEAST `SMALL`, NOT EXACTLY IT, and the difference is a real property of
     * the scroller rather than slack in the assertion. The sentinel sits below the
     * list, so a first page too short to reach the bottom of the window is already
     * in view and the list fills itself to a screenful before anybody scrolls —
     * see the head of `useLiveScroll.ts`, which this spec is the reason for. This
     * asked for three rows at a time; three rows do not fill a window.
     */
    const first = await recordIds(page);
    expect(first.length).toBeGreaterThanOrEqual(SMALL);
    expect(new Set(first).size, "the self-fill showed a row twice").toBe(first.length);

    // Driven by scrolling, which is what asks for the pages after a screenful.
    await page.getByTestId("record-sentinel").scrollIntoViewIfNeeded();
    await expect
      .poll(async () => (await recordIds(page)).length, { timeout: 20_000 })
      .toBeGreaterThan(first.length);

    const grown = await recordIds(page);
    // No row twice — the fault an offset page has and a cursor cannot.
    expect(new Set(grown).size).toBe(grown.length);
    // NO ROW SKIPPED EITHER: what was on screen is still on screen, in order, at
    // the top. An offset page that shifted would fail this even with no repeats.
    expect(grown.slice(0, first.length)).toEqual(first);

    // Again, to prove it is not a one-off append.
    await page.getByTestId("record-sentinel").scrollIntoViewIfNeeded();
    await expect
      .poll(async () => (await recordIds(page)).length, { timeout: 20_000 })
      .toBeGreaterThan(grown.length);
    const more = await recordIds(page);
    expect(new Set(more).size).toBe(more.length);
    expect(more.slice(0, grown.length)).toEqual(grown);

    expect(crashes).toEqual([]);
  });

  test("a sort the record does not have leaves the reader on the record, saying so", async ({
    page,
  }) => {
    await page.goto("/history?sort=passwordHash");
    await ready(page, "live-record");
    // The record is there, and the page says the filters were not applied.
    expect((await recordIds(page)).length).toBeGreaterThan(0);
    await expect(page.getByText(/filters were not valid/i)).toBeVisible();
  });
});

test.describe("the record without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  /*
   * The other half of the enhancement, and the half that is easy to never check.
   * With no JavaScript nothing hydrates, so the scroller never starts and the
   * pager has to be the control — which is exactly what the server renders.
   */
  test("the pager is what is there, and its Next keeps the sort", async ({ page }) => {
    await page.goto(`/history?limit=${SMALL}&sort=moves:asc`);

    /*
     * Exactly the page asked for. Nothing hydrates here, so the self-fill the
     * scrolling spec above describes cannot happen — which makes this the one
     * place the page size can be asserted precisely.
     */
    const rows = page.getByTestId("history-row");
    await expect(rows).toHaveCount(SMALL);

    // Waited for before asserting the scroller's absence. See AGENTS.md on
    // absences only meaning something after a presence.
    const pager = page.getByRole("navigation", { name: "Pagination" });
    await expect(pager).toBeVisible();
    await expect(page.getByTestId("record-progress")).toHaveCount(0);
    await expect(page.getByTestId("record-sentinel")).toHaveCount(0);

    const next = page.getByTestId("next-page");
    await expect(next).toBeVisible();
    await expect(next).toHaveAttribute("href", /sort=moves(%3A|:)asc/);

    // And it works: pressing it is a plain navigation to the second page.
    await next.click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByTestId("history-row")).toHaveCount(SMALL);
  });
});

test.describe("the ladder sorts and scrolls", () => {
  test("pressing a heading changes the address, the order and the heading itself", async ({
    page,
  }) => {
    const crashes = watchForCrashes(page);
    await page.goto("/players?view=ladder");
    await ready(page, "ladder-live");

    const byRating = await ladderNames(page);
    expect(byRating.length).toBeGreaterThan(1);

    // The default order says which way it is, in words as well as an arrow.
    await expect(page.getByRole("columnheader", { name: /Rating/ })).toHaveAttribute(
      "aria-sort",
      "descending",
    );

    // Pressed, not typed.
    await page.getByTestId("sortable-head").filter({ hasText: "Played" }).click();
    await expect(page).toHaveURL(/sort=played(%3A|:)desc/);
    // It stayed on the tab it was pressed in.
    await expect(page).toHaveURL(/view=ladder/);
    await ready(page, "ladder-live");

    const byPlayed = await ladderNames(page);
    expect(byPlayed.length).toBeGreaterThan(1);

    // Most-played first, read off the Played column rather than the address.
    await expect.poll(async () => ordered(await playedCounts(page), "down")).toBe(true);
    // And it is a different list from the one by rating.
    expect(byPlayed).not.toEqual(byRating);

    // A SECOND PRESS REVERSES IT, which is the return trip.
    await page.getByTestId("sortable-head").filter({ hasText: "Played" }).click();
    await expect(page).toHaveURL(/sort=played(%3A|:)asc/);
    await ready(page, "ladder-live");
    await expect.poll(async () => ordered(await playedCounts(page), "up")).toBe(true);

    expect(crashes).toEqual([]);
  });

  /*
   * THREE KINDS OF HEADING, AND THE POINT IS TELLING THEM APART.
   *
   * Drawn AND sortable — Played, W, L, D, Rating — is the case above. Drawn and
   * NOT sortable is this one: the column is on screen, so a reader can read it,
   * and it is text rather than a link because no index can order it. And not
   * drawn at all is Joined, which the ladder switches off because these rows come
   * from `Player` and a join date is on `Member`.
   *
   * Asserting the second as though it were the third — or the other way round —
   * is how "the heading disappeared" and "the heading stopped sorting" become the
   * same green test. This spec got it wrong first time round in exactly that
   * direction, expecting a Joined heading the ladder has never drawn.
   */
  test("the columns nothing can order by are headings, not links", async ({ page }) => {
    await page.goto("/players?view=ladder");
    // Wait for a heading that IS a link before asserting the others are not.
    await expect(page.getByTestId("sortable-head").filter({ hasText: "Rating" })).toBeVisible();

    for (const heading of ["Win rate", "Streak", "Tier"]) {
      // Still a column a reader can read…
      await expect(page.getByRole("columnheader", { name: heading })).toBeVisible();
      // …and not something they can press.
      await expect(
        page.getByTestId("sortable-head").filter({ hasText: heading }),
        `"${heading}" has become a link — is there a column behind it?`,
      ).toHaveCount(0);
    }

    // Not a column here at all: a join date is on Member, and these rows are Player.
    await expect(page.getByRole("columnheader", { name: "Joined" })).toHaveCount(0);
  });

  test("scrolling the ladder appends the next page, with no row twice", async ({ page }) => {
    const crashes = watchForCrashes(page);
    await page.goto(`/players?view=ladder&limit=${SMALL}`);
    await ready(page, "ladder-live");

    const first = await ladderNames(page);
    // At least the page asked for, and possibly more: see the record's spec above.
    expect(first.length).toBeGreaterThanOrEqual(SMALL);
    expect(new Set(first).size).toBe(first.length);
    const progress = page.getByTestId("ladder-progress");
    await expect(progress).toBeVisible();
    enoughToPage(totalIn(await progress.innerText()), "players on the ladder");

    // One control at a time: the no-JavaScript link is gone while scrolling.
    await expect(page.getByTestId("ladder-next")).toHaveCount(0);

    await page.getByTestId("ladder-sentinel").scrollIntoViewIfNeeded();
    await expect
      .poll(async () => (await ladderNames(page)).length, { timeout: 20_000 })
      .toBeGreaterThan(first.length);

    const grown = await ladderNames(page);
    expect(new Set(grown).size).toBe(grown.length);
    expect(grown.slice(0, first.length)).toEqual(first);

    expect(crashes).toEqual([]);
  });

  test("a sort the ladder does not have leaves the reader on the ladder, saying so", async ({
    page,
  }) => {
    await page.goto("/players?view=ladder&sort=winRate");
    await ready(page, "ladder-live");
    expect((await ladderNames(page)).length).toBeGreaterThan(0);
    await expect(page.getByTestId("ladder-sort-refused")).toBeVisible();
  });
});

test.describe("the ladder without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("a link carries the next page, and there is a way back to the top", async ({ page }) => {
    await page.goto(`/players?view=ladder&limit=${SMALL}`);

    const table = page.getByTestId("players-table");
    await expect(table).toBeVisible();
    await expect(page.getByTestId("ladder-progress")).toHaveCount(0);

    const first = await ladderNames(page);
    expect(first).toHaveLength(SMALL);

    // Nothing to go back to yet, so nothing offers it.
    await expect(page.getByTestId("ladder-top")).toHaveCount(0);

    const next = page.getByTestId("ladder-next");
    await expect(next).toBeVisible();
    await next.click();

    // A different page of the ladder, and the sort survived the trip.
    await expect(table).toBeVisible();
    const second = await ladderNames(page);
    expect(second).toHaveLength(SMALL);
    expect(second).not.toEqual(first);

    // THE WAY BACK. A forward-only list nobody can leave is the fault only a
    // return trip finds.
    const top = page.getByTestId("ladder-top");
    await expect(top).toBeVisible();
    await top.click();
    await expect(table).toBeVisible();
    expect(await ladderNames(page)).toEqual(first);
  });
});
