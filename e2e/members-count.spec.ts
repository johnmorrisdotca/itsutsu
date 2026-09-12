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
      people: number;
      robots: number;
      shown: number;
    };

    expect(typeof body.total, "the answer carries a real total").toBe("number");
    expect(body.total).toBeGreaterThanOrEqual(body.items.length);
    /*
     * The page is a page — of PEOPLE. It never carries more of those than it
     * says it will, and it deliberately carries the programs as well as them:
     * a computer player is never seen, so recency sorts it last and it would
     * drop off the end of any capped list (`alwaysListed`). That is the whole
     * reason those rows are appended past the cap.
     *
     * This used to be asked of `items.length` and was true only while this
     * database had fewer members than the cap. It crossed 200 on 2026-09-12
     * and the assertion started failing — on a list that was behaving exactly
     * as designed, in a file about counting. The honest statement is the one
     * the guarantee actually makes.
     */
    expect(body.items.length - body.robots).toBeLessThanOrEqual(body.shown);

    /*
     * The people and the programs counted apart, because the operator's page
     * shows them on two tabs. Both are real numbers and they add up to the
     * total — a split that did not would be two headings disagreeing about how
     * many rows the site has.
     */
    expect(typeof body.people, "the answer counts the people apart").toBe("number");
    expect(typeof body.robots, "the answer counts the programs apart").toBe("number");
    expect(body.people + body.robots).toBe(body.total);
  });

  test("says so on the page when the list is cut", async ({ page, request }) => {
    /*
     * Two readings, and the page's count has to sit between them.
     *
     * THE PEOPLE, NOT EVERY ROW. This list is people now — the computer
     * players have a tab of their own — so the heading counts `people` and
     * asking it to match `total` would fail by exactly the number of programs
     * on the site. The route works both out from the one list it already
     * fetched.
     *
     * It used to be asked to equal one number fetched before the page was
     * rendered, and this suite seeds a member almost everywhere: the answer
     * said thirteen, the page rendered fourteen, and a test about counting
     * failed for having counted at the wrong moment. Nothing removes members
     * while a run is in progress, so the count can only have grown.
     */
    const before = ((await (await request.get("/api/members")).json()) as { people: number }).people;

    await page.goto("/admin?view=members");
    await expect(page.getByTestId("admin-members")).toBeVisible();
    // The list arrives from the API, so wait for it rather than reading the
    // nought it shows first and calling that a count.
    await expect(page.getByTestId("admin-member").first()).toBeVisible();

    const shown = Number(await page.getByTestId("member-total").textContent());
    const after = ((await (await request.get("/api/members")).json()) as { people: number }).people;
    expect(shown).toBeGreaterThanOrEqual(before);
    expect(shown).toBeLessThanOrEqual(after);

    /*
     * Only when there is something to say. A site with fewer members than the
     * cap is not truncated and should not be told it is — and whether it was
     * cut is a question about the page in front of us, so it is asked of the
     * rows the page actually drew rather than of another request's page.
     */
    const rows = await page.getByTestId("admin-member").count();
    const capped = page.getByTestId("member-capped");
    if (shown > rows) {
      await expect(capped).toContainText(String(shown));
    } else {
      await expect(capped).toHaveCount(0);
    }
  });
});
