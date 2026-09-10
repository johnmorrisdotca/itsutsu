import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { memberContext, seedMember } from "./members";

/**
 * The features board.
 *
 * The board is only worth making a rule out of if a request typed into it is
 * still there afterwards, so this walks the whole way round: the seeded board
 * renders, a new request is added and comes back on a reload, it can be moved
 * along the statuses the rules allow, and a move the rules forbid is refused
 * by the API even when the page's select would never have offered it.
 *
 * These tests write to the same board people take work from, which makes
 * clearing up part of the test rather than good manners. Left to itself this
 * file put three rows on the board per run and had reached ninety of them —
 * more than half the board, so the thing the board exists for, being read,
 * had stopped working. Every row a test creates is named here and deleted
 * when the file finishes.
 */

/** Titles this file has created, deleted at the end whatever happened. */
const created: string[] = [];

/** A title nothing else could have: the test's own words plus the run's clock. */
function newTitle(what: string): string {
  const title = `${what} ${Date.now().toString(36)}`;
  created.push(title);
  return title;
}

test.afterAll(async () => {
  if (created.length === 0) return;
  const prisma = new PrismaClient();
  try {
    // By exact title, so a failed run that left rows behind is still cleared
    // and nothing outside this file can be caught by it.
    await prisma.backlogItem.deleteMany({ where: { title: { in: created } } });
  } finally {
    await prisma.$disconnect();
  }
  created.length = 0;
});

test.describe("backlog", () => {
  test("the board renders, seeded, with its filters and counts", async ({ page }) => {
    await page.goto("/backlog");
    await expect(page.getByTestId("backlog")).toBeVisible();
    // The starter set is written on the first read of an empty board.
    await expect(page.getByTestId("backlog-list").getByTestId("backlog-item").first()).toBeVisible();
    // Both chips exist and they are different things: the umbrella that means
    // "not finished", and the status that means "nobody is on it".
    await expect(page.getByTestId("filter-unfinished")).toBeVisible();
    await expect(page.getByTestId("filter-open")).toBeVisible();

    // Filtering to a status shows only that status.
    await page.getByTestId("filter-done").click();
    const rows = page.getByTestId("backlog-item");
    const count = await rows.count();
    for (let index = 0; index < count; index += 1) {
      await expect(rows.nth(index)).toHaveAttribute("data-status", "done");
    }
  });

  test("a request can be added, and is still there on a reload", async ({ page }) => {
    const title = newTitle("Keyboard shortcut for the scrubber");
    await page.goto("/backlog");
    await page.getByTestId("backlog-add-panel").locator("summary").click();
    await page.getByTestId("backlog-title").fill(title);
    await page.getByTestId("backlog-detail").fill("Raised by an end-to-end test, and kept like any other request.");
    await page.getByTestId("backlog-add").click();

    const added = page.getByTestId("backlog-item").filter({ hasText: title });
    await expect(added).toHaveCount(1);
    await expect(added).toHaveAttribute("data-status", "open");

    await page.reload();
    await page.getByTestId("filter-all").click();
    await expect(page.getByTestId("backlog-item").filter({ hasText: title })).toHaveCount(1);
  });

  test("a title too short to be a request is not offered to the server", async ({ page }) => {
    await page.goto("/backlog");
    await page.getByTestId("backlog-add-panel").locator("summary").click();
    await page.getByTestId("backlog-title").fill("fix it");
    await expect(page.getByTestId("backlog-add")).toBeDisabled();
    await expect(page.getByTestId("backlog-problem")).toContainText("at least");
  });

  test("an item moves through the statuses the board allows", async ({ page }) => {
    const title = newTitle("A test request that walks the board");
    await page.goto("/backlog");
    await page.getByTestId("backlog-add-panel").locator("summary").click();
    await page.getByTestId("backlog-title").fill(title);
    await page.getByTestId("backlog-detail").fill("Added, picked up and finished, in that order.");
    await page.getByTestId("backlog-add").click();

    const row = page.getByTestId("backlog-item").filter({ hasText: title });
    await expect(row).toHaveAttribute("data-status", "open");
    // Done is not offered from an open item: somebody has to pick it up first.
    await expect(row.getByTestId("move-status").locator("option")).toHaveText(["Move…", "In progress", "Dropped"]);

    await row.getByTestId("move-status").selectOption("inProgress");
    await expect(row).toHaveAttribute("data-status", "inProgress");
    await row.getByTestId("move-status").selectOption("done");
    await expect(row).toHaveAttribute("data-status", "done");
    await expect(row.getByTestId("status-pill-done")).toBeVisible();

    /*
     * And the row says which release it was finished in, stamped as the move
     * happened. It has to be stamped rather than worked out afterwards: the
     * changelog dates none of its releases, so there is nothing for a date to
     * fall between, and the releases that can be dated at all landed on one
     * day. The board says "marked done in" rather than "shipped in", because
     * whoever lands a commit bumps the version in it — so a row finished just
     * before its own release carries the number before it.
     */
    await expect(row.getByTestId("backlog-released-in")).toHaveText(/^\d+\.\d+\.\d+$/);
    await expect(row).toContainText("marked done");
  });

  test("a row that leaves done stops claiming a release", async ({ page }) => {
    /*
     * The half that is easy to forget. A row reopened has not been released in
     * anything, and last time's version still sitting on it would read exactly
     * as though it had been.
     */
    const title = newTitle("A request that was finished and then reopened");
    await page.goto("/backlog");
    await page.getByTestId("backlog-add-panel").locator("summary").click();
    await page.getByTestId("backlog-title").fill(title);
    await page.getByTestId("backlog-detail").fill("Finished, then found to be unfinished.");
    await page.getByTestId("backlog-add").click();

    const row = page.getByTestId("backlog-item").filter({ hasText: title });
    await row.getByTestId("move-status").selectOption("inProgress");
    await row.getByTestId("move-status").selectOption("done");
    await expect(row.getByTestId("backlog-released-in")).toBeVisible();

    await row.getByTestId("move-status").selectOption("inProgress");
    await expect(row).toHaveAttribute("data-status", "inProgress");
    await expect(row.getByTestId("backlog-released-in")).toHaveCount(0);
    await expect(row).toContainText("moved");
  });

  /*
   * This one used to assign the first row on the board, which was somebody
   * else's: it wrote "Tester has it" onto whichever real request happened to
   * sort first, and did it again every run. Two live tickets carried a false
   * assignee for days because of it, and an assignee set by a person was one
   * test run away from being overwritten. A test may have an item to itself,
   * so it makes one.
   */
  test("an item says who has it, and the board groups what is where", async ({ page, request }) => {
    const title = newTitle("A request somebody has picked up");
    const added = await request.post("/api/backlog", {
      data: { title, detail: "Made by this test, assigned by this test.", kind: "chore", askedBy: "Playwright" },
    });
    expect(added.status()).toBe(201);

    await page.goto("/backlog");
    // Ordered by status and showing more than one, the board has a heading per status.
    await expect(page.getByTestId("backlog-group").first()).toBeVisible();

    const item = page.getByTestId("backlog-item").filter({ hasText: title });
    await expect(item).toHaveCount(1);
    await item.getByTestId("assign-open").click();
    await item.getByTestId("assign-name").fill("Tester");
    await item.getByRole("button", { name: "Save" }).click();
    await expect(item.getByTestId("backlog-assigned")).toContainText("Tester has it");

    await page.reload();
    const again = page.getByTestId("backlog-item").filter({ hasText: title });
    await expect(again.getByTestId("backlog-assigned")).toContainText("Tester has it");
  });

  test("the API refuses a move the board's rules forbid", async ({ page, request }) => {
    const title = newTitle("A request the API will not finish");
    const added = await request.post("/api/backlog", {
      data: { title, detail: "Straight to done is not a move.", kind: "fix", askedBy: "Playwright" },
    });
    expect(added.status()).toBe(201);
    const item = (await added.json()) as { id: string; status: string };
    expect(item.status).toBe("open");

    const illegal = await request.patch(`/api/backlog/${item.id}`, { data: { status: "done" } });
    expect(illegal.status()).toBe(422);

    const legal = await request.patch(`/api/backlog/${item.id}`, { data: { status: "dropped" } });
    expect(legal.status()).toBe(200);

    await page.goto("/backlog");
    await page.getByTestId("filter-dropped").click();
    await expect(page.getByTestId("backlog-item").filter({ hasText: title })).toHaveAttribute("data-status", "dropped");
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
     * coming, which is the operator's, and what arrived, which is everybody's
     * — and the second was written for players and then kept behind a page
     * that answers 404 to every player there is.
     */
    await page.goto("/backlog");
    await expect(page.getByTestId("release-history")).toHaveCount(0);
    await page.getByRole("link", { name: "a page of its own" }).click();
    await expect(page).toHaveURL(/\/releases$/);

    const history = page.getByTestId("release-history");
    await expect(history).toBeVisible();
    // Read from CHANGELOG.md itself, so there is a real history here, not a placeholder.
    expect(await history.getByTestId("release").count()).toBeGreaterThan(3);
    // The edition being served is marked in the list.
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
});

/**
 * The board is the operator's.
 *
 * It used to be open to every member, on the argument that a request only the
 * operator can file goes back to living in a chat window. John decided
 * otherwise, and the half that matters is not the missing navigation link —
 * it is that a member's cookie reaches no further than a stranger's. A page
 * hidden from the nav while its API still answers is a board that looks shut
 * and is open.
 */
test.describe("a member who is not the operator", () => {
  test("cannot read the board, add to it, or move a row", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `not-the-operator-${stamp}@example.test`, name: `Ordinary ${stamp}` };
    await seedMember(me);
    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    // Not found rather than refused: a 403 would confirm the board is there.
    const visited = await page.goto("/backlog");
    expect(visited?.status()).toBe(404);

    const read = await context.request.get("/api/backlog");
    expect(read.status()).toBe(404);

    const added = await context.request.post("/api/backlog", {
      data: { title: "A member should not be able to file this", detail: "and cannot" },
    });
    expect(added.status()).toBe(404);

    // Moving a row is the operator's too, and it is the method the page uses,
    // so it is the one most likely to be left open by accident.
    const moved = await context.request.patch("/api/backlog/anything", { data: { status: "done" } });
    expect(moved.status()).toBe(404);

    await context.close();
  });
});
