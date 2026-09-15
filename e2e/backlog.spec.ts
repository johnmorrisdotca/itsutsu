import { expect, test, type Page } from "@playwright/test";

import { memberContext, seedMember } from "./members";
import { suiteOperator } from "./operator";
import { ready } from "./support";

/**
 * The features board.
 *
 * The rows live on Sumilabu, and the dev server this runs against reads
 * whichever project `sumilabuTarget` gives it — itsutsu-dev, since a test is
 * never the deployed site. So this walks the whole way round through the page
 * alone: a request added through the form comes back on a reload, it moves
 * along the statuses the rules allow and no further, and a move claims it for
 * the operator.
 *
 * WHAT IS NOT HERE ANY MORE, and why. The cases that drove `/api/backlog`
 * directly — a forbidden move refused, a body naming nothing, a stamp on a
 * row that is not done — went with those routes. The page writes through
 * Server Functions now, and the rules they asked are Sumilabu's to refuse;
 * `backlogStore.test.ts` and `boardClient.test.ts` pin what the page is told.
 * A spec that cannot reach a rule except by an address no reader uses would
 * be the kind of test this repository warns about.
 *
 * Every row a test makes is named here and dropped when the file finishes.
 * Sumilabu keeps what it is given, so a dropped row is how this file leaves
 * the dev board readable for the next run.
 */

/**
 * Who a move written by the signed-in operator's session claims a row for.
 * The admin sign-in this suite uses has no Google name behind it, so the
 * Server Function's `me.name ?? me.email` falls all the way to the email.
 */
const OPERATOR_NAME = suiteOperator().email;

/** Titles this file has created, dropped at the end whatever happened. */
const created: string[] = [];

/** A title nothing else could have: the test's own words plus the run's clock. */
function newTitle(what: string): string {
  const title = `${what} ${Date.now().toString(36)}`;
  created.push(title);
  return title;
}

/** Adds a request through the form, the way the operator does, and hands back its row. */
async function addThroughTheForm(page: Page, title: string, detail: string) {
  await page.goto("/backlog");
  await ready(page, "backlog-filters");
  await page.getByTestId("backlog-add-panel").locator("summary").click();
  await page.getByTestId("backlog-title").fill(title);
  await page.getByTestId("backlog-detail").fill(detail);
  await page.getByTestId("backlog-add").click();
  const row = page.getByTestId("backlog-item").filter({ hasText: title });
  await expect(row).toHaveCount(1);
  return row;
}

test.afterAll(async ({ browser }, testInfo) => {
  if (created.length === 0) return;
  const context = await browser.newContext({ baseURL: testInfo.project.use.baseURL, storageState: ".auth/admin.json" });
  const page = await context.newPage();
  try {
    await page.goto("/backlog");
    await ready(page, "backlog-filters");
    await page.getByTestId("filter-all").click();
    // A link to the view that reads every row: its arrival is waited for before any row is looked for.
    await expect(page.getByTestId("filter-all"), "the whole board's view never arrived").toHaveAttribute("aria-pressed", "true");
    for (const title of created) {
      const row = page.getByTestId("backlog-item").filter({ hasText: title });
      if ((await row.count()) !== 1) continue;
      if ((await row.getAttribute("data-status")) === "dropped") continue;
      await row.getByTestId("move-status").selectOption("dropped");
      await expect(row).toHaveAttribute("data-status", "dropped");
    }
  } finally {
    await context.close();
    created.length = 0;
  }
});

test.describe("backlog", () => {
  test("the board renders from Sumilabu, with its filters, and never as an alert on a readable board", async ({ page }) => {
    await page.goto("/backlog");
    await expect(page.getByTestId("backlog")).toBeVisible();
    // The chips are buttons on the board's own client component: a press
    // before it is listening narrows nothing.
    await ready(page, "backlog-filters");
    // Waited for something that IS there before asserting what is not.
    await expect(page.getByTestId("backlog-unreadable")).toHaveCount(0);
    // Both chips exist and they are different things: the umbrella that means
    // "not finished", and the status that means "nobody is on it".
    await expect(page.getByTestId("filter-unfinished")).toBeVisible();
    await expect(page.getByTestId("filter-open")).toBeVisible();

    /*
     * DONE ROWS ARE READ ONLY FOR THE VIEW THAT SHOWS THEM. The default view
     * reads the unfinished rows, so the Done chip draws no number there — a
     * count of rows nobody read would be a figure nothing counted — and it is a
     * link to the view that reads them.
     */
    await expect(page.getByTestId("filter-unfinished")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("filter-done")).not.toContainText(/\d/);

    await page.getByTestId("filter-done").click();
    await expect(page).toHaveURL(/\/backlog\?show=done$/);
    // The done view has arrived and says so, before a single row of it is looked at.
    await expect(page.getByTestId("filter-done")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("filter-done")).toContainText(/\d/);
    const rows = page.getByTestId("backlog-item");
    const count = await rows.count();
    for (let index = 0; index < count; index += 1) {
      await expect(rows.nth(index)).toHaveAttribute("data-status", "done");
    }

    // And the way back: the default view is the plain address again, with its own chip pressed.
    await page.getByTestId("filter-unfinished").click();
    await expect(page).toHaveURL(/\/backlog$/);
    await expect(page.getByTestId("filter-unfinished")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("filter-done")).not.toContainText(/\d/);
  });

  test("a request can be added, and is still there on a reload", async ({ page }) => {
    const title = newTitle("Keyboard shortcut for the scrubber");
    const added = await addThroughTheForm(page, title, "Raised by an end-to-end test, and kept like any other request.");
    await expect(added).toHaveAttribute("data-status", "open");

    await page.reload();
    // A reload is a fresh server render, so the wait is needed again.
    await ready(page, "backlog-filters");
    await page.getByTestId("filter-all").click();
    // A link to the view that reads every row: its arrival is waited for before any row is looked for.
    await expect(page.getByTestId("filter-all"), "the whole board's view never arrived").toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("backlog-item").filter({ hasText: title })).toHaveCount(1);
  });

  test("a title too short to be a request is not offered to the server", async ({ page }) => {
    await page.goto("/backlog");
    await ready(page, "backlog-filters");
    await page.getByTestId("backlog-add-panel").locator("summary").click();
    await page.getByTestId("backlog-title").fill("fix it");
    await expect(page.getByTestId("backlog-add")).toBeDisabled();
    await expect(page.getByTestId("backlog-problem")).toContainText("at least");
  });

  test("an item moves through the statuses the board allows, and done is never one of them", async ({ page }) => {
    /*
     * Board convergence ITS-04: done is the release tool's alone. The page
     * never offers it — movesFrom("inProgress") does not list it — and
     * Sumilabu's move table has no such move either.
     */
    const title = newTitle("A test request that walks the board");
    const row = await addThroughTheForm(page, title, "Added and picked up, and no further than that.");
    await expect(row).toHaveAttribute("data-status", "open");
    await expect(row.getByTestId("move-status").locator("option")).toHaveText(["Move…", "In progress", "Dropped"]);

    await row.getByTestId("move-status").selectOption("inProgress");
    await expect(row).toHaveAttribute("data-status", "inProgress");
    await expect(row.getByTestId("move-status").locator("option")).toHaveText(["Move…", "Open", "Dropped"]);
  });

  test("moving a row to In progress claims it for the operator, and the claim is still there on a reload", async ({ page }) => {
    const title = newTitle("A request somebody has picked up");
    const item = await addThroughTheForm(page, title, "Made by this test, picked up by this test.");
    await item.getByTestId("move-status").selectOption("inProgress");
    await expect(item.getByTestId("backlog-held")).toContainText(`held by ${OPERATOR_NAME}`);

    await page.reload();
    await ready(page, "backlog-filters");
    await page.getByTestId("filter-all").click();
    // A link to the view that reads every row: its arrival is waited for before any row is looked for.
    await expect(page.getByTestId("filter-all"), "the whole board's view never arrived").toHaveAttribute("aria-pressed", "true");
    const again = page.getByTestId("backlog-item").filter({ hasText: title });
    await expect(again.getByTestId("backlog-held")).toContainText(`held by ${OPERATOR_NAME}`);
  });

  test("the board's old API is gone, for the operator as for anybody", async ({ request }) => {
    // The routes went with the board token; a board write is a Server Function now.
    expect((await request.get("/api/backlog")).status()).toBe(404);
    expect((await request.patch("/api/backlog/anything", { data: { status: "dropped" } })).status()).toBe(404);
  });

  test("the board is not one of the site's sections any more", async ({ page }) => {
    // It was in the top nav between Players and About. It is the operator's
    // now, so it is reached from Admin and from nowhere else.
    await page.goto("/players");
    await expect(page.getByRole("navigation").getByRole("link", { name: /^Backlog/ })).toHaveCount(0);
  });

  test("what has shipped is a page of its own, and not on the board", async ({ page }) => {
    /*
     * These used to share a page. They are two different questions — what is
     * coming, which is the operator's, and what arrived, which is everybody's.
     * The history is still read from CHANGELOG.md, never from the board.
     */
    await page.goto("/backlog");
    await expect(page.getByTestId("release-history")).toHaveCount(0);
    await page.getByRole("link", { name: "a page of its own" }).click();
    await expect(page).toHaveURL(/\/releases$/);

    const history = page.getByTestId("release-history");
    await expect(history).toBeVisible();
    expect(await history.getByTestId("release").count()).toBeGreaterThan(3);
    await expect(history.getByTestId("releases")).toContainText("This edition");
  });

  test("the operator reaches the board from the Admin page, with both lists on the card", async ({ page }) => {
    await page.goto("/admin?view=work");
    const card = page.getByTestId("admin-board");
    await expect(card).toBeVisible();
    await expect(card).toContainText("still wanted");
    await expect(page.getByTestId("admin-latest-release")).toContainText(/\d+\.\d+\.\d+/);
    await page.getByTestId("admin-backlog-link").click();
    await expect(page).toHaveURL(/\/backlog$/);
  });

  test("Admin's board reads dropped rows only when asked, keeps its own tab in the address, and comes back", async ({ page }) => {
    await page.goto("/admin?view=work");
    await ready(page, "backlog-filters");
    const card = page.getByTestId("admin-board");
    await expect(card).toContainText("still wanted");
    await expect(page.getByTestId("filter-dropped")).not.toContainText(/\d/);

    await page.getByTestId("filter-dropped").click();
    await expect(page).toHaveURL(/\/admin\?view=work&show=dropped$/);
    await expect(page.getByTestId("filter-dropped")).toHaveAttribute("aria-pressed", "true");
    // The card says what this view read, and no longer what it did not.
    await expect(card).toContainText("dropped");
    await expect(card).not.toContainText("still wanted");

    await page.getByTestId("filter-unfinished").click();
    await expect(page).toHaveURL(/\/admin\?view=work$/);
    await expect(page.getByTestId("filter-unfinished")).toHaveAttribute("aria-pressed", "true");
    await expect(card).toContainText("still wanted");
  });
});

/**
 * The board is the operator's.
 *
 * It used to be open to every member, on the argument that a request only the
 * operator can file goes back to living in a chat window. John decided
 * otherwise, and the half that matters is not the missing navigation link —
 * it is that a member's cookie reaches no further than a stranger's.
 */
test.describe("a member who is not the operator", () => {
  test("cannot read the board", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `not-the-operator-${stamp}@example.test`, name: `Ordinary ${stamp}` };
    await seedMember(me);
    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    // Not found rather than refused: a 403 would confirm the board is there.
    const visited = await page.goto("/backlog");
    expect(visited?.status()).toBe(404);

    await context.close();
  });
});
