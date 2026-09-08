import { expect, test } from "@playwright/test";

/**
 * The features board.
 *
 * The board is only worth making a rule out of if a request typed into it is
 * still there afterwards, so this walks the whole way round: the seeded board
 * renders, a new request is added and comes back on a reload, it can be moved
 * along the statuses the rules allow, and a move the rules forbid is refused
 * by the API even when the page's select would never have offered it.
 */
test.describe("backlog", () => {
  test("the board renders, seeded, with its filters and counts", async ({ page }) => {
    await page.goto("/backlog");
    await expect(page.getByTestId("backlog")).toBeVisible();
    // The starter set is written on the first read of an empty board.
    await expect(page.getByTestId("backlog-list").getByTestId("backlog-item").first()).toBeVisible();
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
    const title = `Keyboard shortcut for the scrubber ${Date.now().toString(36)}`;
    await page.goto("/backlog");
    await page.getByTestId("backlog-add-panel").locator("summary").click();
    await page.getByTestId("backlog-title").fill(title);
    await page.getByTestId("backlog-detail").fill("Raised by an end-to-end test, and kept like any other request.");
    await page.getByTestId("backlog-add").click();

    const added = page.getByTestId("backlog-item").filter({ hasText: title });
    await expect(added).toHaveCount(1);
    await expect(added).toHaveAttribute("data-status", "proposed");

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
    const title = `A test request that walks the board ${Date.now().toString(36)}`;
    await page.goto("/backlog");
    await page.getByTestId("backlog-add-panel").locator("summary").click();
    await page.getByTestId("backlog-title").fill(title);
    await page.getByTestId("backlog-detail").fill("Added, agreed, built and finished, in that order.");
    await page.getByTestId("backlog-add").click();

    const row = page.getByTestId("backlog-item").filter({ hasText: title });
    await expect(row).toHaveAttribute("data-status", "proposed");
    // Done is not offered from a proposal: it has to be started first.
    await expect(row.getByTestId("move-status").locator("option")).toHaveText(["Move…", "Planned", "Building", "Dropped"]);

    await row.getByTestId("move-status").selectOption("planned");
    await expect(row).toHaveAttribute("data-status", "planned");
    await row.getByTestId("move-status").selectOption("building");
    await expect(row).toHaveAttribute("data-status", "building");
    await row.getByTestId("move-status").selectOption("done");
    await expect(row).toHaveAttribute("data-status", "done");
    await expect(row.getByTestId("status-pill-done")).toBeVisible();
  });

  test("the API refuses a move the board's rules forbid", async ({ page, request }) => {
    const title = `A request the API will not finish ${Date.now().toString(36)}`;
    const added = await request.post("/api/backlog", {
      data: { title, detail: "Straight to done is not a move.", kind: "fix", askedBy: "Playwright" },
    });
    expect(added.status()).toBe(201);
    const item = (await added.json()) as { id: string; status: string };
    expect(item.status).toBe("proposed");

    const illegal = await request.patch(`/api/backlog/${item.id}`, { data: { status: "done" } });
    expect(illegal.status()).toBe(422);

    const legal = await request.patch(`/api/backlog/${item.id}`, { data: { status: "dropped" } });
    expect(legal.status()).toBe(200);

    await page.goto("/backlog");
    await page.getByTestId("filter-dropped").click();
    await expect(page.getByTestId("backlog-item").filter({ hasText: title })).toHaveAttribute("data-status", "dropped");
  });

  test("the board is reachable from the site's own navigation", async ({ page }) => {
    await page.goto("/players");
    await page.getByRole("link", { name: /^Backlog/ }).click();
    await expect(page).toHaveURL(/\/backlog$/);
  });
});
