import { expect, test } from "@playwright/test";

/**
 * The operator's members list says how many members there are.
 *
 * It printed the length of the page it had been handed, and the page is cut
 * at two hundred — so a site with nine hundred members reported two hundred,
 * in the one place somebody goes to find out how many there are. It is the
 * same shape as the computer players falling off the end of the directory:
 * a capped list read as though it were the whole thing.
 */
test.describe("the operator's members list", () => {
  test("counts every member, not the ones it happens to show", async ({ request }) => {
    const answer = await request.get("/api/members");
    expect(answer.status()).toBe(200);
    const body = (await answer.json()) as {
      items: unknown[];
      total: number;
      shown: number;
    };

    expect(typeof body.total, "the answer carries a real total").toBe("number");
    expect(body.total).toBeGreaterThanOrEqual(body.items.length);
    // The page is a page: it never carries more than it says it will.
    expect(body.items.length).toBeLessThanOrEqual(body.shown);
  });

  test("says so on the page when the list is cut", async ({ page, request }) => {
    const body = (await (await request.get("/api/members")).json()) as {
      items: unknown[];
      total: number;
    };

    await page.goto("/admin?view=members");
    await expect(page.getByTestId("admin-members")).toBeVisible();
    await expect(page.getByTestId("member-total")).toHaveText(String(body.total));

    /*
     * Only when there is something to say. A site with fewer members than the
     * cap is not truncated and should not be told it is.
     */
    const capped = page.getByTestId("member-capped");
    if (body.total > body.items.length) {
      await expect(capped).toContainText(String(body.total));
    } else {
      await expect(capped).toHaveCount(0);
    }
  });
});
